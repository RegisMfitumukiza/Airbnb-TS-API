import { Router } from "express";

import {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  uploadMyAvatar,
  deleteMyAvatar,
  getUserStats
} from "../../controllers/users.controller.js";

import { getListingByHost } from "../../controllers/listings.controller.js";
import { getBookingsByGuest } from "../../controllers/bookings.controller.js";


import { validate } from "../../middlewares/validate.middleware.js";
import {
  createUserSchema,
  updateUserSchema
} from "../../validators/user.schema.js";

import {
  authenticate,
  requireAdmin
} from "../../middlewares/auth.middleware.js";

import { uploadSingleImage } from "../../middlewares/upload.middleware.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management and profile operations
 */

/**
 * @swagger
 * /api/v1/users:
 *   post:
 *     summary: Admin creates a new user
 *     description: Creates a new user account. This route is restricted to ADMIN users only.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUserInput'
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       403:
 *         description: Forbidden - admin only
 *       500:
 *         description: Internal server error
 */
router.post(
  "/",
  authenticate,
  requireAdmin,
  validate(createUserSchema),
  createUser
);

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     summary: Get all users
 *     description: Returns all users. This route is restricted to ADMIN users only.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       403:
 *         description: Forbidden - admin only
 *       500:
 *         description: Internal server error
 */
router.get(
  "/",
  authenticate,
  requireAdmin,
  getAllUsers
);

/**
 * @swagger
 * /api/v1/users/me/avatar:
 *   patch:
 *     summary: Upload or update current user's avatar
 *     description: Uploads a new avatar image for the authenticated user. If an old avatar exists, it is replaced.
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
 *                 description: Avatar image file
 *     responses:
 *       200:
 *         description: Avatar uploaded successfully
 *       400:
 *         description: Image is required or invalid file type
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.patch(
  "/me/avatar",
  authenticate,
  uploadSingleImage,
  uploadMyAvatar
);

/**
 * @swagger
 * /api/v1/users/me/avatar:
 *   delete:
 *     summary: Delete current user's avatar
 *     description: Deletes the authenticated user's avatar from Cloudinary and clears avatar fields in the database.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Avatar deleted successfully
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.delete(
  "/me/avatar",
  authenticate,
  deleteMyAvatar
);

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
 * /api/v1/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     description: Returns a user by ID. ADMIN can view any user, while normal users can only view their own profile.
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
 *         description: Unauthorized - missing or invalid token
 *       403:
 *         description: Forbidden - users can only view their own profile
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.get("/:id", authenticate, getUserById);

/**
 * @swagger
 * /api/v1/users/{id}/listings:
 *   get:
 *     summary: Get listings by host
 *     description: Returns all listings created by a specific user/host.
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Host user ID
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Host listings retrieved successfully
 *       404:
 *         description: Host or listings not found
 *       500:
 *         description: Internal server error
 */
router.get("/:id/listings", getListingByHost);

/**
 * @swagger
 * /api/v1/users/{id}/bookings:
 *   get:
 *     summary: Get bookings by user
 *     description: Retrieve all bookings made by a specific user. Users can only view their own bookings unless they are ADMIN.
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
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           example: createdAt
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
 *       404:
 *         description: User not found
 */
router.get("/:id/bookings", authenticate, getBookingsByGuest);

/**
 * @swagger
 * /api/v1/users/{id}:
 *   put:
 *     summary: Update user by ID
 *     description: Updates user profile information. ADMIN can update any user, while normal users can only update their own profile.
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
 *             $ref: '#/components/schemas/UpdateUserInput'
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       403:
 *         description: Forbidden - users can only update their own profile or cannot update role
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.put(
  "/:id",
  authenticate,
  validate(updateUserSchema),
  updateUser
);

/**
 * @swagger
 * /api/v1/users/{id}:
 *   delete:
 *     summary: Delete user by ID
 *     description: Deletes a user account. ADMIN can delete any user, while normal users can only delete their own account.
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
 *         description: Unauthorized - missing or invalid token
 *       403:
 *         description: Forbidden - users can only delete their own account
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.delete("/:id", authenticate, deleteUser);

export default router;