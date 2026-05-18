import { Request, Response } from "express";
import {
  BookingStatus,
  NotificationType,
  Role,
} from "../generated/prisma/client.js";

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
  getBookingsByHostService,
  countBookingsByHostService,
  updateBookingService,
  updateBookingStatusService,
  deleteBookingService,
  findOverlappingBookingService,
} from "../services/bookings.service.js";

import { findUserByIdService } from "../services/auth.service.js";
import { getListingByIdService } from "../services/listings.service.js";
import { createNotificationService } from "../services/notifications.service.js";

export const createBooking = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw new APIError("Unauthorized", 401);

    const { listingId, checkIn, checkOut, guests } = req.body;

    const listing = await getListingByIdService(listingId);
    if (!listing) throw new APIError("Listing not found", 404);

    if (!listing.available) {
      throw new APIError("Listing is not available", 400);
    }

    if (guests && guests > listing.guests) {
      throw new APIError(`Maximum guests allowed is ${listing.guests}`, 400);
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    const overlappingBooking = await findOverlappingBookingService(
      listingId,
      checkInDate,
      checkOutDate
    );

    if (overlappingBooking) {
      throw new APIError("Listing is already booked for these dates", 409);
    }

    const booking = await createBookingService({
      checkIn: checkInDate,
      checkOut: checkOutDate,
      guests,
      guestId: req.user.userId,
      listingId,
    });

    const guest = await findUserByIdService(req.user.userId);

    await createNotificationService({
      userId: listing.hostId,
      title: "New booking request",
      message: `${guest?.name || "A guest"
        } requested to book ${listing.title} from ${checkInDate.toDateString()} to ${checkOutDate.toDateString()}`,
      type: NotificationType.BOOKING_CREATED,
    });

    logger.info("Booking created", {
      bookingId: booking.id,
      listingId,
      guestId: req.user.userId,
      hostId: listing.hostId,
    });

    res.status(201).json({
      success: true,
      message: "Booking created successfully",
      data: booking,
    });
  }
);

export const getAllBookings = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw new APIError("Unauthorized", 401);

    const { page, limit, skip } = getPagination(req.query.page, req.query.limit);

    const allowedSorts = ["createdAt", "checkIn", "checkOut", "status"];
    const sortBy = allowedSorts.includes(String(req.query.sortBy))
      ? String(req.query.sortBy)
      : "createdAt";

    const sortOrder: "asc" | "desc" =
      req.query.sortOrder === "asc" ? "asc" : "desc";

    const where =
      req.user.role === Role.ADMIN
        ? {}
        : req.user.role === Role.HOST
          ? {
            listing: {
              hostId: req.user.userId,
            },
          }
          : {
            guestId: req.user.userId,
          };

    const totalBookings = await countBookingsService(where);

    const bookings = await getAllBookingsService({
      skip,
      limit,
      where,
      sortBy,
      sortOrder,
    });

    res.status(200).json({
      success: true,
      message: "Bookings retrieved successfully",
      page,
      limit,
      totalBookings,
      totalPages: Math.ceil(totalBookings / limit),
      count: bookings.length,
      data: bookings,
    });
  }
);

export const getBookingById = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw new APIError("Unauthorized", 401);

    const id = req.params.id as string;

    const booking = await getBookingByIdService(id);
    if (!booking) throw new APIError("Booking not found", 404);

    const isGuestOwner = booking.guestId === req.user.userId;
    const isHostOwner = booking.listing?.hostId === req.user.userId;
    const isAdmin = req.user.role === Role.ADMIN;

    if (!isGuestOwner && !isHostOwner && !isAdmin) {
      throw new APIError("Access denied", 403);
    }

    res.status(200).json({
      success: true,
      message: "Booking retrieved successfully",
      data: booking,
    });
  }
);

export const getBookingsByGuest = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw new APIError("Unauthorized", 401);

    const guestId = String(req.params.userId || req.user.userId);

    if (guestId !== req.user.userId && req.user.role !== Role.ADMIN) {
      throw new APIError("Access denied", 403);
    }

    const { page, limit, skip } = getPagination(req.query.page, req.query.limit);

    const totalBookings = await countBookingsByGuestService(guestId);

    const bookings = await getBookingsByGuestService({
      guestId,
      skip,
      limit,
    });

    res.status(200).json({
      success: true,
      message: "Guest bookings retrieved successfully",
      page,
      limit,
      totalBookings,
      totalPages: Math.ceil(totalBookings / limit),
      count: bookings.length,
      data: bookings,
    });
  }
);

export const getHostBookings = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw new APIError("Unauthorized", 401);

    if (req.user.role !== Role.HOST && req.user.role !== Role.ADMIN) {
      throw new APIError("Access denied: hosts only", 403);
    }

    const hostId = req.user.userId;

    const totalBookings = await countBookingsByHostService(hostId);
    const bookings = await getBookingsByHostService(hostId);

    logger.info("Host bookings fetched", {
      hostId,
      totalBookings,
    });

    res.status(200).json({
      success: true,
      message: "Host bookings retrieved successfully",
      totalBookings,
      count: bookings.length,
      data: bookings,
    });
  }
);

export const updateBooking = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw new APIError("Unauthorized", 401);

    const id = req.params.id as string;

    const booking = await getBookingByIdService(id);
    if (!booking) throw new APIError("Booking not found", 404);

    const isGuestOwner = booking.guestId === req.user.userId;
    const isAdmin = req.user.role === Role.ADMIN;

    if (!isGuestOwner && !isAdmin) {
      throw new APIError("Access denied", 403);
    }

    if (req.body.checkIn || req.body.checkOut) {
      const checkInDate = new Date(req.body.checkIn ?? booking.checkIn);
      const checkOutDate = new Date(req.body.checkOut ?? booking.checkOut);

      const overlappingBooking = await findOverlappingBookingService(
        booking.listingId,
        checkInDate,
        checkOutDate,
        booking.id
      );

      if (overlappingBooking) {
        throw new APIError("Listing is already booked for these dates", 409);
      }
    }

    const updatedBooking = await updateBookingService(id, req.body);

    logger.info("Booking updated", {
      bookingId: id,
      userId: req.user.userId,
    });

    res.status(200).json({
      success: true,
      message: "Booking updated successfully",
      data: updatedBooking,
    });
  }
);

export const updateBookingStatus = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw new APIError("Unauthorized", 401);

    const id = req.params.id as string;
    const { status } = req.body as { status: BookingStatus };

    const booking = await getBookingByIdService(id);
    if (!booking) throw new APIError("Booking not found", 404);

    const isGuestOwner = booking.guestId === req.user.userId;
    const isHostOwner = booking.listing?.hostId === req.user.userId;
    const isAdmin = req.user.role === Role.ADMIN;

    if (!isGuestOwner && !isHostOwner && !isAdmin) {
      throw new APIError("Access denied", 403);
    }

    if (isGuestOwner && status !== BookingStatus.CANCELLED) {
      throw new APIError("Guests can only cancel bookings", 403);
    }

    const updatedBooking = await updateBookingStatusService(id, status);

    if (status === BookingStatus.CONFIRMED) {
      await createNotificationService({
        userId: booking.guestId,
        title: "Booking confirmed",
        message: `Your booking for ${booking.listing?.title || "a listing"
          } was confirmed.`,
        type: NotificationType.BOOKING_CREATED,
      });
    }

    if (status === BookingStatus.CANCELLED) {
      await createNotificationService({
        userId: booking.guestId,
        title: "Booking cancelled",
        message: `Your booking for ${booking.listing?.title || "a listing"
          } was cancelled.`,
        type: NotificationType.BOOKING_CANCELLED,
      });
    }

    logger.info("Booking status updated", {
      bookingId: id,
      status,
      userId: req.user.userId,
    });

    res.status(200).json({
      success: true,
      message: "Booking status updated successfully",
      data: updatedBooking,
    });
  }
);

export const deleteBooking = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw new APIError("Unauthorized", 401);

    const id = req.params.id as string;

    const booking = await getBookingByIdService(id);
    if (!booking) throw new APIError("Booking not found", 404);

    const isGuestOwner = booking.guestId === req.user.userId;
    const isHostOwner = booking.listing?.hostId === req.user.userId;
    const isAdmin = req.user.role === Role.ADMIN;

    if (!isGuestOwner && !isHostOwner && !isAdmin) {
      throw new APIError("Access denied", 403);
    }

    await deleteBookingService(id);

    logger.info("Booking deleted", {
      bookingId: id,
      userId: req.user.userId,
    });

    res.status(200).json({
      success: true,
      message: "Booking deleted successfully",
    });
  }
);