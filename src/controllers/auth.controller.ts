import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";

import { asyncHandler } from "../utils/asyncHandler.js";
import { APIError } from "../utils/ApiError.js";
import { generateToken } from "../utils/jwt.js";
import { logger } from "../utils/logger.js";

import { sendEmail } from "../config/email.js";
import { welcomeEmail } from "../templates/welcomeEmail.js";
import { passwordResetEmail } from "../templates/resetPasswordEmail.js";

import {
  registerUserService,
  findUserByEmailService,
  findUserByIdService,
  updateUserPasswordService,
  saveResetTokenService,
  findUserByResetTokenService,
  resetPasswordService,
  findUserWithPasswordByIdService,
  findUserByGooglePayloadService
} from "../services/auth.service.js";

const removeSensitiveData = <T extends Record<string, unknown>>(user: T) => {
  const { password, resetToken, resetTokenExpiry, ...safeUser } = user;
  return safeUser;
};

export const register = asyncHandler(async (req: Request, res: Response) => {
  const user = await registerUserService(req.body);

  const token = generateToken({
    userId: user.id,
    role: user.role
  });

  logger.info("User registered", {
    userId: user.id,
    email: user.email
  });

  try {
    await sendEmail(
      user.email,
      "Welcome to Airbnb TS",
      welcomeEmail(user.name)
    );
  } catch (error) {
    logger.error("Welcome email failed", {
      userId: user.id,
      email: user.email,
      error
    });
  }

  res.status(201).json({
    success: true,
    message: "User registered successfully",
    token,
    data: removeSensitiveData(user)
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await findUserByEmailService(email);

  if (!user) {
    logger.warn("Login failed - user not found", { email });
    throw new APIError("Invalid credentials", 401);
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    logger.warn("Login failed - wrong password", {
      userId: user.id,
      email
    });

    throw new APIError("Invalid credentials", 401);
  }

  const token = generateToken({
    userId: user.id,
    role: user.role
  });

  logger.info("User logged in", {
    userId: user.id,
    email: user.email
  });

  res.status(200).json({
    success: true,
    message: "Login successful",
    token,
    data: removeSensitiveData(user)
  });
});

export const googleOAuthCallback = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new APIError("Google authentication failed", 401);
    }

    const user = await findUserByGooglePayloadService(req.user.userId);

    if (!user) {
      throw new APIError("User not found", 404);
    }

    const token = generateToken({
      userId: user.id,
      role: user.role
    });

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

    logger.info("Google OAuth login successful", {
      userId: user.id,
      email: user.email
    });

    res.redirect(`${frontendUrl}/oauth-success?token=${token}`);
  }
);

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new APIError("Unauthorized", 401);
  }

  const user = await findUserByIdService(req.user.userId);

  if (!user) {
    throw new APIError("User not found", 404);
  }

  res.status(200).json({
    success: true,
    data: removeSensitiveData(user)
  });
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new APIError("Unauthorized", 401);
  }

  const { currentPassword, newPassword } = req.body;

  const user = await findUserWithPasswordByIdService(req.user.userId);

  if (!user) {
    throw new APIError("User not found", 404);
  }

  const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

  if (!isPasswordValid) {
    logger.warn("Password change failed - wrong current password", {
      userId: user.id
    });

    throw new APIError("Current password is incorrect", 401);
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await updateUserPasswordService(user.id, hashedPassword);

  logger.info("Password changed", {
    userId: user.id
  });

  res.status(200).json({
    success: true,
    message: "Password changed successfully"
  });
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  const user = await findUserByEmailService(email);

  if (!user) {
    logger.warn("Password reset requested for non-existing email", {
      email
    });

    res.status(200).json({
      success: true,
      message: "If that email exists, a reset link has been sent"
    });
    return;
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

  await saveResetTokenService(user.id, resetToken, resetTokenExpiry);

  try {
    await sendEmail(
      user.email,
      "Password Reset Request",
      passwordResetEmail(user.name, resetToken)
    );

    logger.info("Password reset email sent", {
      userId: user.id,
      email: user.email
    });
  } catch (error) {
    logger.error("Password reset email failed", {
      userId: user.id,
      email: user.email,
      error
    });
  }

  res.status(200).json({
    success: true,
    message: "If that email exists, a reset link has been sent"
  });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const token = req.params.token as string;
  const { newPassword } = req.body;

  const user = await findUserByResetTokenService(token);

  if (!user || !user.resetTokenExpiry) {
    logger.warn("Invalid reset token attempt");
    throw new APIError("Invalid or expired reset token", 400);
  }

  if (user.resetTokenExpiry < new Date()) {
    logger.warn("Expired reset token", {
      userId: user.id
    });

    throw new APIError("Reset token has expired", 400);
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await resetPasswordService(user.id, hashedPassword);

  logger.info("Password reset successful", {
    userId: user.id
  });

  res.status(200).json({
    success: true,
    message: "Password reset successfully"
  });
});