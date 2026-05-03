import { Router } from "express";

import {
    register,
    login,
    getMe,
    changePassword,
    forgotPassword,
    resetPassword
} from "../../controllers/auth.controller.js";

import { validate } from "../../middlewares/validate.middleware.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authLimiter } from "../../middlewares/rateLimiting.js";

import {
    registerSchema,
    loginSchema,
    changePasswordSchema,
    forgotPasswordSchema,
    resetPasswordSchema
} from "../../validators/auth.schema.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication and authorization
 */

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Creates a new user account and returns a JWT token.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterInput'
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email or username already exists
 *       429:
 *         description: Too many requests (rate limit)
 */
router.post(
  "/register",
  validate(registerSchema),
  authLimiter,
  register
);

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Login user
 *     description: Authenticates user and returns a JWT token.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginInput'
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid credentials
 *       429:
 *         description: Too many requests (rate limit)
 */
router.post(
  "/login",
  validate(loginSchema),
  authLimiter,
  login
);

/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     summary: Get current authenticated user
 *     description: Returns the currently logged-in user's profile.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user retrieved successfully
 *       401:
 *         description: Unauthorized - missing or invalid token
 */
router.get("/me", authenticate, getMe);

/**
 * @swagger
 * /api/v1/auth/change-password:
 *   post:
 *     summary: Change password
 *     description: Allows an authenticated user to change their password.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChangePasswordInput'
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized or incorrect current password
 */
router.post(
  "/change-password",
  authenticate,
  validate(changePasswordSchema),
  changePassword
);

/**
 * @swagger
 * /api/v1/auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     description: Sends a password reset link to the user's email if it exists.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ForgotPasswordInput'
 *     responses:
 *       200:
 *         description: Reset link sent if email exists
 *       400:
 *         description: Validation error
 *       429:
 *         description: Too many requests (rate limit)
 */
router.post(
  "/forgot-password",
  validate(forgotPasswordSchema),
  authLimiter,
  forgotPassword
);

/**
 * @swagger
 * /api/v1/auth/reset-password/{token}:
 *   post:
 *     summary: Reset password
 *     description: Resets user password using a valid reset token.
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         description: Password reset token
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResetPasswordInput'
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid or expired token
 *       429:
 *         description: Too many requests (rate limit)
 */
router.post(
  "/reset-password/:token",
  validate(resetPasswordSchema),
  authLimiter,
  resetPassword
);

export default router;