import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { Role } from "../generated/prisma/client.js";
import { APIError } from "../utils/ApiError.js";

type RegisterData = {
  name: string;
  email: string;
  username: string;
  phone: string;
  password: string;
  confirmPassword?: string;
};

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

export const registerUserService = async (data: RegisterData) => {
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email: data.email }, { username: data.username }]
    }
  });

  if (existingUser) {
    throw new APIError("Email or username already exists", 409);
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  return await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      username: data.username,
      phone: data.phone,
      password: hashedPassword,
      role: Role.GUEST
    },
    select: safeUserSelect
  });
};

export const findUserByGooglePayloadService = async (userId: string) => {
  return prisma.user.findUnique({
    where: { id: userId },
    select: safeUserSelect
  });
};

export const findUserByEmailService = async (email: string) => {
  return await prisma.user.findUnique({
    where: { email }
  });
};

export const findUserByIdService = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      ...safeUserSelect,

      listings: {
        include: {
          reviews: {
            select: {
              rating: true
            }
          },
          _count: {
            select: {
              bookings: true
            }
          }
        }
      },

      bookings: {
        include: {
          listing: true
        }
      }
    }
  });

  if (!user) return null;

  const totalBookings = user.listings.reduce(
    (sum, listing) => sum + listing._count.bookings,
    0
  );

  const ratings = user.listings.flatMap((listing) =>
    listing.reviews.map((review) => review.rating)
  );

  const averageRating =
    ratings.length > 0
      ? ratings.reduce((sum, rating) => sum + rating, 0) /
        ratings.length
      : 0;

  const superhost =
    user.role === Role.HOST &&
    totalBookings >= 2 &&
    averageRating >= 4.5;

  return {
    ...user,
    superhost
  };
};

export const findUserWithPasswordByIdService = async (id: string) => {
  return prisma.user.findUnique({
    where: { id }
  });
};

export const updateUserPasswordService = async (
  id: string,
  hashedPassword: string
) => {
  return await prisma.user.update({
    where: { id },
    data: {
      password: hashedPassword
    },
    select: safeUserSelect
  });
};

export const saveResetTokenService = async (
  userId: string,
  resetToken: string,
  resetTokenExpiry: Date
) => {
  return await prisma.user.update({
    where: { id: userId },
    data: {
      resetToken,
      resetTokenExpiry
    },
    select: safeUserSelect
  });
};

export const findUserByResetTokenService = async (resetToken: string) => {
  return await prisma.user.findUnique({
    where: { resetToken }
  });
};

export const resetPasswordService = async (
  userId: string,
  hashedPassword: string
) => {
  return await prisma.user.update({
    where: { id: userId },
    data: {
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null
    },
    select: safeUserSelect
  });
};