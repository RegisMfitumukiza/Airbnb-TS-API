import { Router } from "express";

import {
  createBooking,
  getAllBookings,
  getBookingById,
  getHostBookings,
  updateBooking,
  updateBookingStatus,
  deleteBooking
} from "../../controllers/bookings.controller.js";

import { authenticate } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";

import {
  createBookingSchema,
  updateBookingSchema,
  updateBookingStatusSchema
} from "../../validators/booking.schema.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Bookings
 *     description: Booking management
 */

/**
 * @swagger
 * /api/v1/bookings:
 *   get:
 *     summary: Get all bookings
 *     description: Get paginated bookings (ADMIN only or filtered by user).
 *     tags: [Bookings]
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, CONFIRMED, CANCELLED]
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, checkIn, checkOut]
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *     responses:
 *       200:
 *         description: Bookings retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/", authenticate, getAllBookings);

/**
 * @swagger
 * /api/v1/bookings:
 *   post:
 *     summary: Create booking
 *     description: Authenticated users can book a listing.
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - listingId
 *               - checkIn
 *               - checkOut
 *             properties:
 *               listingId:
 *                 type: string
 *                 format: uuid
 *                 example: "uuid-listing-id"
 *               checkIn:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-06-01T00:00:00.000Z"
 *               checkOut:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-06-05T00:00:00.000Z"
 *     responses:
 *       201:
 *         description: Booking created successfully
 *       400:
 *         description: Invalid input or overlapping booking
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Listing not found
 */
router.post("/", authenticate, validate(createBookingSchema), createBooking);

/**
 * @swagger
 * /api/v1/bookings/host:
 *   get:
 *     summary: Get host bookings
 *     description: Returns booking requests for listings owned by logged-in host.
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Host bookings retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Host only
 */
router.get(
  "/host",
  authenticate,
  getHostBookings
);

/**
 * @swagger
 * /api/v1/bookings/{id}:
 *   get:
 *     summary: Get booking by ID
 *     description: Retrieve a single booking.
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Booking retrieved successfully
 *       404:
 *         description: Booking not found
 */
router.get("/:id", authenticate, getBookingById);

/**
 * @swagger
 * /api/v1/bookings/{id}:
 *   put:
 *     summary: Update booking
 *     description: Update booking dates or listing.
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
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
 *               checkIn:
 *                 type: string
 *                 format: date-time
 *               checkOut:
 *                 type: string
 *                 format: date-time
 *               listingId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Booking updated successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Booking not found
 */
router.put("/:id", authenticate, validate(updateBookingSchema), updateBooking);

/**
 * @swagger
 * /api/v1/bookings/{id}/status:
 *   patch:
 *     summary: Update booking status
 *     description: Update booking status (ADMIN or HOST).
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, CONFIRMED, CANCELLED]
 *                 example: CONFIRMED
 *     responses:
 *       200:
 *         description: Booking status updated successfully
 *       400:
 *         description: Invalid status
 *       404:
 *         description: Booking not found
 */
router.patch(
  "/:id/status",
  authenticate,
  validate(updateBookingStatusSchema),
  updateBookingStatus
);

/**
 * @swagger
 * /api/v1/bookings/{id}:
 *   delete:
 *     summary: Delete booking
 *     description: Cancel or delete a booking.
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Booking deleted successfully
 *       404:
 *         description: Booking not found
 */
router.delete("/:id", authenticate, deleteBooking);

export default router;