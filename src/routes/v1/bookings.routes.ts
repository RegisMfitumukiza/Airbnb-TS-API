import { Router } from "express";

import {
  createBooking,
  getAllBookings,
  getBookingById,
  updateBooking,
  updateBookingStatus,
  deleteBooking,
} from "../../controllers/bookings.controller.js";

import { validate } from "../../middlewares/validate.middleware.js";

import {
  createBookingSchema,
  updateBookingSchema,
  updateBookingStatusSchema
} from "../../validators/booking.schema.js";

import {
  authenticate,
  requireGuest,
  requireAdmin,
  requireHost
} from "../../middlewares/auth.middleware.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Bookings
 *   description: Booking management and reservations
 */

/**
 * @swagger
 * /api/v1/bookings:
 *   post:
 *     summary: Create a booking
 *     description: Allows a GUEST to create a booking for a listing.
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateBookingInput'
 *     responses:
 *       201:
 *         description: Booking created successfully
 *       400:
 *         description: Validation error or invalid dates
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Only guests can create bookings
 *       409:
 *         description: Booking conflict (dates overlap)
 */
router.post(
  "/",
  authenticate,
  requireGuest,
  validate(createBookingSchema),
  createBooking
);

/**
 * @swagger
 * /api/v1/bookings:
 *   get:
 *     summary: Get all bookings
 *     description: Retrieve all bookings (Admin only).
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of bookings
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin only
 */
router.get("/", authenticate, requireAdmin, getAllBookings);


/**
 * @swagger
 * /api/v1/bookings/{id}:
 *   get:
 *     summary: Get booking by ID
 *     description: Retrieve details of a specific booking.
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Booking ID
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Booking retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Booking not found
 */
router.get("/:id", authenticate, getBookingById);

/**
 * @swagger
 * /api/v1/bookings/{id}:
 *   put:
 *     summary: Update booking
 *     description: Update booking details such as check-in or check-out dates.
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Booking ID
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateBookingInput'
 *     responses:
 *       200:
 *         description: Booking updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not allowed to update this booking
 *       404:
 *         description: Booking not found
 */
router.put(
  "/:id",
  authenticate,
  validate(updateBookingSchema),
  updateBooking
);

/**
 * @swagger
 * /api/v1/bookings/{id}/status:
 *   patch:
 *     summary: Update booking status
 *     description: Allows a HOST or ADMIN to confirm or cancel a booking.
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Booking ID
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateBookingStatusInput'
 *     responses:
 *       200:
 *         description: Booking status updated
 *       400:
 *         description: Invalid status
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Only host or admin allowed
 *       404:
 *         description: Booking not found
 */
router.patch(
  "/:id/status",
  authenticate,
  requireHost,
  validate(updateBookingStatusSchema),
  updateBookingStatus
);

/**
 * @swagger
 * /api/v1/bookings/{id}:
 *   delete:
 *     summary: Delete booking
 *     description: Delete a booking. Allowed for booking owner or admin.
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Booking ID
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Booking deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not allowed to delete this booking
 *       404:
 *         description: Booking not found
 */
router.delete("/:id", authenticate, deleteBooking);

export default router;