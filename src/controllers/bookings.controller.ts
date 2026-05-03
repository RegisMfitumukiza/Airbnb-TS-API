import { Request, Response } from "express";
import { BookingStatus, Prisma, Role } from "../generated/prisma/client.js";

import { asyncHandler } from "../utils/asyncHandler.js";
import { APIError } from "../utils/ApiError.js";
import { getPagination } from "../utils/pagination.js";
import { logger } from "../utils/logger.js";

import {
  createBookingService,
  getAllBookingsService,
  countBookingsService,
  getBookingByIdService,
  getBookingsByGuestService,
  countBookingsByGuestService,
  updateBookingService,
  updateBookingStatusService,
  findOverlappingBookingService
} from "../services/bookings.service.js";

const getBookingSort = (
  sortByQuery: unknown,
  sortOrderQuery: unknown
): {
  sortBy: string;
  sortOrder: "asc" | "desc";
} => {
  const allowedSorts = ["createdAt", "checkIn", "checkOut", "status"];

  const sortBy = allowedSorts.includes(String(sortByQuery))
    ? String(sortByQuery)
    : "createdAt";

  const sortOrder: "asc" | "desc" =
    sortOrderQuery === "asc" ? "asc" : "desc";

  return { sortBy, sortOrder };
};

export const createBooking = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new APIError("Unauthorized", 401);
    }

    const { checkIn, checkOut, listingId } = req.body;

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (
      Number.isNaN(checkInDate.getTime()) ||
      Number.isNaN(checkOutDate.getTime())
    ) {
      throw new APIError("Invalid date format", 400);
    }

    const overlappingBooking = await findOverlappingBookingService(
      listingId,
      checkInDate,
      checkOutDate
    );

    if (overlappingBooking) {
      logger.warn("Booking conflict detected", {
        userId: req.user.userId,
        listingId
      });

      throw new APIError("Listing is already booked for these dates", 409);
    }

    const booking = await createBookingService({
      checkIn: checkInDate,
      checkOut: checkOutDate,
      guestId: req.user.userId,
      listingId
    });

    logger.info("Booking created", {
      bookingId: booking.id,
      userId: req.user.userId,
      listingId
    });

    res.status(201).json({
      success: true,
      message: "Booking created successfully",
      data: booking
    });
  }
);

export const getAllBookings = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new APIError("Unauthorized", 401);
    }

    if (req.user.role !== Role.ADMIN) {
      logger.warn("Non-admin attempted to fetch all bookings", {
        userId: req.user.userId
      });

      throw new APIError("Access denied: admins only", 403);
    }

    const { page, limit, skip } = getPagination(req.query.page, req.query.limit);
    const { sortBy, sortOrder } = getBookingSort(
      req.query.sortBy,
      req.query.sortOrder
    );

    const { status } = req.query;
    const statusValue = status ? String(status).toUpperCase() : undefined;

    if (
      statusValue &&
      !Object.values(BookingStatus).includes(statusValue as BookingStatus)
    ) {
      throw new APIError("Invalid booking status", 400);
    }

    const where: Prisma.BookingWhereInput = {
      ...(statusValue && {
        status: statusValue as BookingStatus
      })
    };

    const totalBookings = await countBookingsService(where);

    const bookings = await getAllBookingsService({
      where,
      skip,
      limit,
      sortBy,
      sortOrder
    });

    logger.info("Admin fetched bookings", {
      adminId: req.user.userId,
      totalBookings
    });

    res.status(200).json({
      success: true,
      message: "Bookings retrieved successfully",
      page,
      limit,
      totalBookings,
      totalPages: Math.ceil(totalBookings / limit),
      count: bookings.length,
      data: bookings
    });
  }
);

export const getBookingById = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new APIError("Unauthorized", 401);
    }

    const id = req.params.id as string;

    const booking = await getBookingByIdService(id);

    if (!booking) {
      throw new APIError("Booking not found", 404);
    }

    const isGuestOwner = booking.guestId === req.user.userId;
    const isListingHost = booking.listing.hostId === req.user.userId;
    const isAdmin = req.user.role === Role.ADMIN;

    if (!isGuestOwner && !isListingHost && !isAdmin) {
      logger.warn("Unauthorized booking access attempt", {
        userId: req.user.userId,
        bookingId: id
      });

      throw new APIError("You are not allowed to view this booking", 403);
    }

    res.status(200).json({
      success: true,
      message: "Booking retrieved successfully",
      data: booking
    });
  }
);

export const getBookingsByGuest = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new APIError("Unauthorized", 401);
    }

    const guestId = req.params.id as string;

    if (req.user.role !== Role.ADMIN && req.user.userId !== guestId) {
      logger.warn("Unauthorized guest bookings access attempt", {
        userId: req.user.userId,
        guestId
      });

      throw new APIError("You can only view your own bookings", 403);
    }

    const { page, limit, skip } = getPagination(req.query.page, req.query.limit);
    const { sortBy, sortOrder } = getBookingSort(
      req.query.sortBy,
      req.query.sortOrder
    );

    const totalBookings = await countBookingsByGuestService(guestId);

    const bookings = await getBookingsByGuestService({
      guestId,
      skip,
      limit,
      sortBy,
      sortOrder
    });

    logger.info("Guest bookings fetched", {
      requesterId: req.user.userId,
      guestId,
      totalBookings
    });

    res.status(200).json({
      success: true,
      message: "Guest bookings retrieved successfully",
      page,
      limit,
      totalBookings,
      totalPages: Math.ceil(totalBookings / limit),
      count: bookings.length,
      data: bookings
    });
  }
);

export const updateBooking = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new APIError("Unauthorized", 401);
    }

    const id = req.params.id as string;
    const { checkIn, checkOut, listingId } = req.body;

    const existingBooking = await getBookingByIdService(id);

    if (!existingBooking) {
      throw new APIError("Booking not found", 404);
    }

    if (
      existingBooking.guestId !== req.user.userId &&
      req.user.role !== Role.ADMIN
    ) {
      logger.warn("Unauthorized booking update attempt", {
        userId: req.user.userId,
        bookingId: id
      });

      throw new APIError("You can only update your own booking", 403);
    }

    if (existingBooking.status === BookingStatus.CANCELLED) {
      throw new APIError("Cancelled bookings cannot be updated", 400);
    }

    const finalListingId = listingId ?? existingBooking.listingId;
    const finalCheckIn = checkIn ? new Date(checkIn) : existingBooking.checkIn;
    const finalCheckOut = checkOut
      ? new Date(checkOut)
      : existingBooking.checkOut;

    if (
      Number.isNaN(finalCheckIn.getTime()) ||
      Number.isNaN(finalCheckOut.getTime())
    ) {
      throw new APIError("Invalid date format", 400);
    }

    const overlappingBooking = await findOverlappingBookingService(
      finalListingId,
      finalCheckIn,
      finalCheckOut,
      id
    );

    if (overlappingBooking) {
      logger.warn("Booking update conflict detected", {
        bookingId: id,
        userId: req.user.userId,
        listingId: finalListingId
      });

      throw new APIError("Listing is already booked for these dates", 409);
    }

    const updatedBooking = await updateBookingService(id, {
      ...(checkIn !== undefined && { checkIn: finalCheckIn }),
      ...(checkOut !== undefined && { checkOut: finalCheckOut }),
      ...(listingId !== undefined && { listingId })
    });

    logger.info("Booking updated", {
      bookingId: id,
      userId: req.user.userId
    });

    res.status(200).json({
      success: true,
      message: "Booking updated successfully",
      data: updatedBooking
    });
  }
);

export const updateBookingStatus = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new APIError("Unauthorized", 401);
    }

    const id = req.params.id as string;
    const { status } = req.body;

    const existingBooking = await getBookingByIdService(id);

    if (!existingBooking) {
      throw new APIError("Booking not found", 404);
    }

    const isListingHost = existingBooking.listing.hostId === req.user.userId;
    const isAdmin = req.user.role === Role.ADMIN;

    if (!isListingHost && !isAdmin) {
      logger.warn("Unauthorized booking status update attempt", {
        userId: req.user.userId,
        bookingId: id
      });

      throw new APIError(
        "Only the listing host or admin can update booking status",
        403
      );
    }

    const statusValue = String(status).toUpperCase();

    if (!Object.values(BookingStatus).includes(statusValue as BookingStatus)) {
      throw new APIError("Invalid booking status", 400);
    }

    const updatedBooking = await updateBookingStatusService(
      id,
      statusValue as BookingStatus
    );

    logger.info("Booking status updated", {
      bookingId: id,
      userId: req.user.userId,
      status: statusValue
    });

    res.status(200).json({
      success: true,
      message: "Booking status updated successfully",
      data: updatedBooking
    });
  }
);

export const deleteBooking = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new APIError("Unauthorized", 401);
    }

    const id = req.params.id as string;

    const existingBooking = await getBookingByIdService(id);

    if (!existingBooking) {
      throw new APIError("Booking not found", 404);
    }

    if (
      existingBooking.guestId !== req.user.userId &&
      req.user.role !== Role.ADMIN
    ) {
      logger.warn("Unauthorized booking cancel attempt", {
        userId: req.user.userId,
        bookingId: id
      });

      throw new APIError("You can only cancel your own bookings", 403);
    }

    if (existingBooking.status === BookingStatus.CANCELLED) {
      logger.warn("Booking already cancelled", {
        bookingId: id,
        userId: req.user.userId
      });

      throw new APIError("Booking is already cancelled", 400);
    }

    const cancelledBooking = await updateBookingStatusService(
      id,
      BookingStatus.CANCELLED
    );

    logger.info("Booking cancelled", {
      bookingId: id,
      userId: req.user.userId
    });

    res.status(200).json({
      success: true,
      message: "Booking cancelled successfully",
      data: cancelledBooking
    });
  }
);