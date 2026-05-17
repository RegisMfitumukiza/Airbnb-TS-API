import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { Prisma, Role, BookingStatus, NotificationType } from "../generated/prisma/client.js";
import { APIError } from "../utils/ApiError.js";

type CreateUserData = {
  name: string;
  email: string;
  username: string;
  phone: string;
  password: string;
  confirmPassword?: string;
  role?: Role;
  avatar?: string;
  bio?: string;
};

type UpdateUserData = Prisma.UserUpdateInput;

const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  username: true,
  phone: true,
  role: true,
  avatar: true,
  bio: true,
  createdAt: true,
  updatedAt: true
};

type GetUserOptions = {
  skip: number;
  limit: number;
  where?: Prisma.UserWhereInput;
  sortBy?: string;
  sortOrder: "asc" | "desc";
};

export const createUserService = async (data: CreateUserData) => {
  const { confirmPassword, password, ...userData } = data;

  const hashedPassword = await bcrypt.hash(password, 10);

  return await prisma.user.create({
    data: {
      ...userData,
      password: hashedPassword,
      role: data.role ?? Role.GUEST
    },
    select: safeUserSelect
  });
};

export const getAllUsersService = async ({
  skip,
  limit,
  where = {},
  sortBy = "createdAt",
  sortOrder
}: GetUserOptions) => {
  return await prisma.user.findMany({
    skip,
    take: limit,
    where,
    orderBy: {
      [sortBy]: sortOrder
    },
    select: {
      ...safeUserSelect,
      listings: true,
      bookings: true,
      reviews: true
    }
  });
};

export const countUsersService = async (where?: Prisma.UserWhereInput) => {
  return prisma.user.count({ where });
};

export const getUserByIdService = async (id: string) => {
  return await prisma.user.findUnique({
    where: { id },
    select: {
      ...safeUserSelect,
      listings: true,
      bookings: true,
      reviews: true
    }
  });
};

export const updateUserService = async (
  id: string,
  data: UpdateUserData
) => {
  const updatedData: Prisma.UserUpdateInput = { ...data };

  if (typeof updatedData.password === "string") {
    updatedData.password = await bcrypt.hash(updatedData.password, 10);
  }

  return await prisma.user.update({
    where: { id },
    data: updatedData,
    select: safeUserSelect
  });
};

export const deleteUserService = async (id: string) => {
  return await prisma.user.delete({
    where: { id },
    select: safeUserSelect
  });
};

export const getUserImageDataService = async (id: string) => {
  return await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      avatar: true,
      avatarPublicId: true
    }
  });
};

export const updateUserAvatarService = async (
  id: string,
  avatar: string,
  avatarPublicId: string
) => {
  return await prisma.user.update({
    where: { id },
    data: {
      avatar,
      avatarPublicId
    },
    select: safeUserSelect
  });
};

export const deleteUserAvatarService = async (id: string) => {
  return await prisma.user.update({
    where: { id },
    data: {
      avatar: null,
      avatarPublicId: null
    },
    select: safeUserSelect
  });
};

export const getUserStatsService = async () => {
  const totalUsers = await prisma.user.count();

  const usersByRole = await prisma.user.groupBy({
    by: ["role"],
    _count: {
      role: true
    }
  });

  return {
    totalUsers,
    usersByRole: usersByRole.map((item) => ({
      role: item.role,
      count: item._count.role
    }))
  };
};

export const getAdminUsersService = async () => {
  return prisma.user.findMany({
    where: {
      role: Role.ADMIN
    },
    select: {
      id: true,
      name: true,
      email: true
    }
  });
};


export const banUserService = async (
  userId: string,
  adminId: string,
  reason?: string
) => {
  if (userId === adminId) {
    throw new APIError("You cannot ban your own account", 400);
  }

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      include: {
        listings: true
      }
    });

    if (!user) {
      throw new APIError("User not found", 404);
    }

    if (user.role === Role.ADMIN) {
      throw new APIError("Admin users cannot be banned", 403);
    }

    if (user.isBanned) {
      throw new APIError("User is already banned", 400);
    }

    const bannedUser = await tx.user.update({
      where: { id: userId },
      data: {
        isBanned: true,
        bannedAt: new Date(),
        banReason: reason || "Violation of platform rules",
        bannedById: adminId
      },
      select: safeUserSelect
    });

    await tx.listing.updateMany({
      where: {
        hostId: userId
      },
      data: {
        available: false
      }
    });

    const listingIds = user.listings.map((listing) => listing.id);

    await tx.booking.updateMany({
      where: {
        OR: [
          {
            guestId: userId,
            status: {
              in: [BookingStatus.PENDING, BookingStatus.CONFIRMED]
            }
          },
          {
            listingId: {
              in: listingIds
            },
            status: {
              in: [BookingStatus.PENDING, BookingStatus.CONFIRMED]
            }
          }
        ]
      },
      data: {
        status: BookingStatus.CANCELLED
      }
    });

    await tx.notification.create({
      data: {
        userId,
        title: "Account banned",
        message: reason || "Your account has been banned by an administrator.",
        type: NotificationType.SYSTEM
      }
    });

    return bannedUser;
  });
};