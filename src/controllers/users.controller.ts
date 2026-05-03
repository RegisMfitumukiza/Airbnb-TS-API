import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { APIError } from "../utils/ApiError.js";
import { Prisma, Role } from "../generated/prisma/client.js";

import {
  createUserService,
  getAllUsersService,
  getUserByIdService,
  updateUserService,
  deleteUserService,
  getUserImageDataService,
  updateUserAvatarService,
  deleteUserAvatarService,
  countUsersService,
  getUserStatsService
} from "../services/users.service.js";

import { getPagination } from "../utils/pagination.js";
import { logger } from "../utils/logger.js";

import {
  uploadBufferToCloudinary,
  deleteFromCloudinary
} from "../utils/cloudinary.helper.js";

export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await createUserService(req.body);

  logger.info("User created by admin", {
    userId: user.id,
    email: user.email
  });

  res.status(201).json({
    success: true,
    message: "User created successfully",
    data: user
  });
});

export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPagination(req.query.page, req.query.limit);

  const allowedSorts = ["name", "email", "createdAt"];

  const sortBy = allowedSorts.includes(String(req.query.sortBy))
    ? String(req.query.sortBy)
    : "createdAt";

  const sortOrder: "asc" | "desc" =
    req.query.sortOrder === "asc" ? "asc" : "desc";

  const { search } = req.query;

  const roleQuery = req.query.role;
  const roleValue = roleQuery ? String(roleQuery).toUpperCase() : undefined;

  if (roleValue && !Object.values(Role).includes(roleValue as Role)) {
    throw new APIError("Invalid role value", 400);
  }

  const where: Prisma.UserWhereInput = {
    ...(roleValue && {
      role: roleValue as Role
    }),

    ...(search && {
      OR: [
        { name: { contains: String(search), mode: "insensitive" } },
        { email: { contains: String(search), mode: "insensitive" } },
        { username: { contains: String(search), mode: "insensitive" } }
      ]
    })
  };

  const totalUsers = await countUsersService(where);

  const users = await getAllUsersService({
    where,
    skip,
    limit,
    sortBy,
    sortOrder
  });

  logger.info("Users fetched", {
    page,
    limit,
    count: users.length,
    totalUsers
  });

  res.status(200).json({
    success: true,
    page,
    limit,
    total: totalUsers,
    totalPages: Math.ceil(totalUsers / limit),
    count: users.length,
    data: users
  });
});

export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new APIError("Unauthorized", 401);
  }

  const id = req.params.id as string;

  if (req.user.userId !== id && req.user.role !== Role.ADMIN) {
    logger.warn("Unauthorized user profile access attempt", {
      requesterId: req.user.userId,
      targetUserId: id
    });

    throw new APIError("Access denied", 403);
  }

  const user = await getUserByIdService(id);

  if (!user) {
    throw new APIError("User not found", 404);
  }

  res.status(200).json({
    success: true,
    data: user
  });
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new APIError("Unauthorized", 401);
  }

  const id = req.params.id as string;

  if (req.user.userId !== id && req.user.role !== Role.ADMIN) {
    logger.warn("Unauthorized user update attempt", {
      requesterId: req.user.userId,
      targetUserId: id
    });

    throw new APIError("Access denied", 403);
  }

  const user = await updateUserService(id, req.body);

  logger.info("User updated", {
    requesterId: req.user.userId,
    targetUserId: id
  });

  res.status(200).json({
    success: true,
    message: "User updated successfully",
    data: user
  });
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new APIError("Unauthorized", 401);
  }

  const id = req.params.id as string;

  if (req.user.userId !== id && req.user.role !== Role.ADMIN) {
    logger.warn("Unauthorized user delete attempt", {
      requesterId: req.user.userId,
      targetUserId: id
    });

    throw new APIError("Access denied", 403);
  }

  await deleteUserService(id);

  logger.info("User deleted", {
    requesterId: req.user.userId,
    targetUserId: id
  });

  res.status(200).json({
    success: true,
    message: "User deleted successfully"
  });
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new APIError("Unauthorized", 401);
  }

  const user = await getUserByIdService(req.user.userId);

  if (!user) {
    throw new APIError("User not found", 404);
  }

  res.status(200).json({
    success: true,
    data: user
  });
});

export const updateMe = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new APIError("Unauthorized", 401);
  }

  const user = await updateUserService(req.user.userId, req.body);

  logger.info("User profile updated", {
    userId: req.user.userId
  });

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    data: user
  });
});

export const uploadMyAvatar = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new APIError("Unauthorized", 401);
    }

    if (!req.file) {
      throw new APIError("No file uploaded", 400);
    }

    const existingUser = await getUserImageDataService(req.user.userId);

    if (!existingUser) {
      throw new APIError("User not found", 404);
    }

    if (existingUser.avatarPublicId) {
      await deleteFromCloudinary(existingUser.avatarPublicId);
    }

    const uploadedAvatar = await uploadBufferToCloudinary(
      req.file.buffer,
      "User-Avatars"
    );

    const updatedUser = await updateUserAvatarService(
      req.user.userId,
      uploadedAvatar.url,
      uploadedAvatar.publicId
    );

    logger.info("User avatar uploaded", {
      userId: req.user.userId
    });

    res.status(200).json({
      success: true,
      message: "Avatar uploaded successfully",
      data: updatedUser
    });
  }
);

export const deleteMyAvatar = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new APIError("Unauthorized", 401);
    }

    const existingUser = await getUserImageDataService(req.user.userId);

    if (!existingUser) {
      throw new APIError("User not found", 404);
    }

    if (existingUser.avatarPublicId) {
      await deleteFromCloudinary(existingUser.avatarPublicId);
    }

    const updatedUser = await deleteUserAvatarService(req.user.userId);

    logger.info("User avatar deleted", {
      userId: req.user.userId
    });

    res.status(200).json({
      success: true,
      message: "Avatar deleted successfully",
      data: updatedUser
    });
  }
);

export const getUserStats = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new APIError("Unauthorized", 401);
  }

  if (req.user.role !== Role.ADMIN) {
    logger.warn("Non-admin attempted to access user stats", {
      userId: req.user.userId
    });

    throw new APIError("Access denied: admins only", 403);
  }

  const stats = await getUserStatsService();

  logger.info("User stats fetched", {
    adminId: req.user.userId
  });

  res.status(200).json({
    success: true,
    message: "User stats retrieved successfully",
    data: stats
  });
});