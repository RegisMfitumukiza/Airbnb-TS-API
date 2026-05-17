import { prisma } from "../lib/prisma.js";
import { BookingStatus, Prisma } from "../generated/prisma/client.js";

type CreateBookingData = Prisma.BookingUncheckedCreateInput;
type UpdateBookingData = Prisma.BookingUncheckedUpdateInput;

type GetBookingsOptions = {
  guestId?: string;
  skip: number;
  limit: number;
  where?: Prisma.BookingWhereInput;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

export const createBookingService = async (data: CreateBookingData) => {
  return prisma.booking.create({
    data,
    include: {
      guest: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      listing: {
        select: {
          id: true,
          title: true,
          location: true,
          pricePerNight: true,
          hostId: true,
          coverImage: true,
          images: true,
        },
      },
    },
  });
};

export const getAllBookingsService = async ({
  skip,
  limit,
  where = {},
  sortBy = "createdAt",
  sortOrder = "desc",
}: GetBookingsOptions) => {
  return prisma.booking.findMany({
    skip,
    take: limit,
    where,
    orderBy: {
      [sortBy]: sortOrder,
    },
    include: {
      guest: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      listing: {
        select: {
          id: true,
          title: true,
          location: true,
          pricePerNight: true,
          hostId: true,
          coverImage: true,
          images: true,
        },
      },
    },
  });
};

export const countBookingsService = async (
  where?: Prisma.BookingWhereInput
) => {
  return prisma.booking.count({
    where,
  });
};

export const getBookingsByGuestService = async ({
  guestId,
  skip,
  limit,
  sortBy = "createdAt",
  sortOrder = "desc",
}: GetBookingsOptions) => {
  return prisma.booking.findMany({
    where: { guestId },
    skip,
    take: limit,
    orderBy: {
      [sortBy]: sortOrder,
    },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          location: true,
          pricePerNight: true,
          coverImage: true,
          images: true,
        },
      },
    },
  });
};

export const countBookingsByGuestService = async (guestId: string) => {
  return prisma.booking.count({
    where: { guestId },
  });
};

export const getBookingsByHostService = async (hostId: string) => {
  return prisma.booking.findMany({
    where: {
      listing: {
        hostId,
      },
    },
    include: {
      guest: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      listing: {
        select: {
          id: true,
          title: true,
          location: true,
          pricePerNight: true,
          hostId: true,
          coverImage: true,
          images: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const countBookingsByHostService = async (hostId: string) => {
  return prisma.booking.count({
    where: {
      listing: {
        hostId,
      },
    },
  });
};

export const getBookingByIdService = async (id: string) => {
  return prisma.booking.findUnique({
    where: { id },
    include: {
      guest: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      listing: {
        select: {
          id: true,
          title: true,
          location: true,
          pricePerNight: true,
          hostId: true,
          coverImage: true,
          images: true,
        },
      },
    },
  });
};

export const updateBookingService = async (
  id: string,
  data: UpdateBookingData
) => {
  return prisma.booking.update({
    where: { id },
    data,
    include: {
      guest: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      listing: {
        select: {
          id: true,
          title: true,
          location: true,
          pricePerNight: true,
          hostId: true,
          coverImage: true,
          images: true,
        },
      },
    },
  });
};

export const updateBookingStatusService = async (
  id: string,
  status: BookingStatus
) => {
  return prisma.booking.update({
    where: { id },
    data: { status },
    include: {
      guest: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      listing: {
        select: {
          id: true,
          title: true,
          location: true,
          pricePerNight: true,
          hostId: true,
          coverImage: true,
          images: true,
        },
      },
    },
  });
};

export const deleteBookingService = async (id: string) => {
  return prisma.booking.delete({
    where: { id },
  });
};

export const findOverlappingBookingService = async (
  listingId: string,
  checkIn: Date,
  checkOut: Date,
  excludeBookingId?: string
) => {
  return prisma.booking.findFirst({
    where: {
      listingId,
      status: {
        not: BookingStatus.CANCELLED,
      },
      ...(excludeBookingId && {
        id: {
          not: excludeBookingId,
        },
      }),
      checkIn: {
        lt: checkOut,
      },
      checkOut: {
        gt: checkIn,
      },
    },
  });
};