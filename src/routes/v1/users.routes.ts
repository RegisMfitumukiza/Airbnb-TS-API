import { Router } from "express";

import {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getMe,
  updateMe,
  uploadMyAvatar,
  deleteMyAvatar,
  getUserStats
} from "../../controllers/users.controller.js";

import { getListingByHost } from "../../controllers/listings.controller.js";
import { getBookingsByGuest } from "../../controllers/bookings.controller.js";

import { validate } from "../../middlewares/validate.middleware.js";
import {
  authenticate,
  requireAdmin
} from "../../middlewares/auth.middleware.js";

import {
  createUserSchema,
  updateUserSchema
} from "../../validators/user.schema.js";

import { uploadSingleImage } from "../../middlewares/upload.middleware.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Users
 *     description: User management and profile operations
 */

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     summary: Get all users
 *     description: Get paginated users with search, role filter, and sorting. ADMIN only.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           example: sam
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [GUEST, HOST, ADMIN]
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, email, createdAt]
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admins only
 */
router.get("/", authenticate, requireAdmin, getAllUsers);

/**
 * @swagger
 * /api/v1/users:
 *   post:
 *     summary: Create a user
 *     description: Create a new user. ADMIN only.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - username
 *               - phone
 *               - password
 *               - confirmPassword
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 example: john@example.com
 *               username:
 *                 type: string
 *                 example: johndoe
 *               phone:
 *                 type: string
 *                 example: "0781234567"
 *               password:
 *                 type: string
 *                 example: Password123!
 *               confirmPassword:
 *                 type: string
 *                 example: Password123!
 *               role:
 *                 type: string
 *                 enum: [GUEST, HOST]
 *                 example: GUEST
 *               avatar:
 *                 type: string
 *                 example: https://example.com/avatar.png
 *               bio:
 *                 type: string
 *                 example: I love travelling.
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admins only
 */
router.post("/", authenticate, requireAdmin, validate(createUserSchema), createUser);

/**
 * @swagger
 * /api/v1/users/stats:
 *   get:
 *     summary: Get user statistics
 *     description: Returns total users and count grouped by role. ADMIN only.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admins only
 */
router.get("/stats", authenticate, getUserStats);

/**
 * @swagger
 * /api/v1/users/me:
 *   get:
 *     summary: Get current user
 *     description: Returns the currently authenticated user's profile.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/me", authenticate, getMe);

/**
 * @swagger
 * /api/v1/users/me:
 *   put:
 *     summary: Update current user
 *     description: Update the currently authenticated user's profile.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Updated
 *               email:
 *                 type: string
 *                 example: john.updated@example.com
 *               username:
 *                 type: string
 *                 example: johnupdated
 *               phone:
 *                 type: string
 *                 example: "0787654321"
 *               role:
 *                 type: string
 *                 enum: [GUEST, HOST]
 *               avatar:
 *                 type: string
 *                 example: https://example.com/avatar.png
 *               bio:
 *                 type: string
 *                 example: Updated bio.
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       401:
 *         description: Unauthorized
 */
router.put("/me", authenticate, validate(updateUserSchema), updateMe);

/**
 * @swagger
 * /api/v1/users/me/avatar:
 *   post:
 *     summary: Upload current user's avatar
 *     description: Upload or replace avatar image. Field name must be image.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Avatar uploaded successfully
 *       400:
 *         description: No file uploaded
 *       401:
 *         description: Unauthorized
 */
router.post("/me/avatar", authenticate, uploadSingleImage, uploadMyAvatar);

/**
 * @swagger
 * /api/v1/users/me/avatar:
 *   delete:
 *     summary: Delete current user's avatar
 *     description: Delete avatar image from Cloudinary and database.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Avatar deleted successfully
 *       401:
 *         description: Unauthorized
 */
router.delete("/me/avatar", authenticate, deleteMyAvatar);

/**
 * @swagger
 * /api/v1/users/{id}/listings:
 *   get:
 *     summary: Get user's listings
 *     description: Get all listings created by a specific user/host.
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: User/host ID
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: User listings retrieved successfully
 */
router.get("/:id/listings", getListingByHost);

/**
 * @swagger
 * /api/v1/users/{id}/bookings:
 *   get:
 *     summary: Get user's bookings
 *     description: Get paginated bookings made by a specific user. User can view own bookings; ADMIN can view any user's bookings.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: User ID
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 10
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, checkIn, checkOut, status]
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *     responses:
 *       200:
 *         description: User bookings retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get("/:id/bookings", authenticate, getBookingsByGuest);

/**
 * @swagger
 * /api/v1/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     description: ADMIN can get any user. Normal users can only get their own profile.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: User ID
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 */
router.get("/:id", authenticate, getUserById);

/**
 * @swagger
 * /api/v1/users/{id}:
 *   put:
 *     summary: Update user by ID
 *     description: ADMIN can update any user. Normal users can only update their own profile.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: User ID
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Updated Name
 *               email:
 *                 type: string
 *                 example: updated@example.com
 *               username:
 *                 type: string
 *                 example: updateduser
 *               phone:
 *                 type: string
 *                 example: "0789999999"
 *               role:
 *                 type: string
 *                 enum: [GUEST, HOST]
 *               avatar:
 *                 type: string
 *                 example: https://example.com/avatar.png
 *               bio:
 *                 type: string
 *                 example: Updated user bio.
 *     responses:
 *       200:
 *         description: User updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 */
router.put("/:id", authenticate, validate(updateUserSchema), updateUser);

/**
 * @swagger
 * /api/v1/users/{id}:
 *   delete:
 *     summary: Delete user by ID
 *     description: ADMIN can delete any user, while normal users can only delete their own account.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: User ID
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 */
router.delete("/:id", authenticate, deleteUser);

export default router;