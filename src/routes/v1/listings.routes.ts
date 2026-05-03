import { Router } from "express";

import {
  createListing,
  getAllListing,
  getListingById,
  updateListing,
  deleteListing,
  uploadCoverImageListing,
  deleteCoverImageListing,
  uploadListingImages,
  deleteAllListingImages,
  deleteSingleListingImage,
  getListingStats
} from "../../controllers/listings.controller.js";

import {
  createReview,
  getReviewsByListing,
  getReviewStatsByListing
} from "../../controllers/reviews.controller.js";

import { validate } from "../../middlewares/validate.middleware.js";
import {
  authenticate,
  requireHost
} from "../../middlewares/auth.middleware.js";

import {
  createListingSchema,
  updateListingSchema
} from "../../validators/listing.schema.js";

import { createReviewSchema } from "../../validators/review.schema.js";

import {
  uploadSingleImage,
  uploadMultipleImages
} from "../../middlewares/upload.middleware.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Listings
 *   description: Listing management
 */

/**
 * @swagger
 * tags:
 *   name: Reviews
 *   description: Listing reviews
 */

/**
 * @swagger
 * /api/v1/listings:
 *   get:
 *     summary: Get all listings
 *     description: Get paginated listings with filtering and sorting.
 *     tags: [Listings]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [APARTMENT, HOUSE, VILLA, CABIN]
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [title, createdAt, pricePerNight, rating]
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *     responses:
 *       200:
 *         description: Listings retrieved successfully
 */
router.get("/", getAllListing);

/**
 * @swagger
 * /api/v1/listings/stats:
 *   get:
 *     summary: Get listing statistics
 *     description: Returns total listings, price stats, and counts by type/location. ADMIN only.
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Listing stats retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admins only
 */
router.get("/stats", authenticate, getListingStats);

/**
 * @swagger
 * /api/v1/listings/{listingId}/reviews:
 *   get:
 *     summary: Get reviews for a listing
 *     description: Get paginated reviews for a specific listing.
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: listingId
 *         required: true
 *         description: Listing ID
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
 *           enum: [createdAt, rating]
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *     responses:
 *       200:
 *         description: Reviews retrieved successfully
 *       404:
 *         description: Listing not found
 */
router.get("/:listingId/reviews", getReviewsByListing);

/**
 * @swagger
 * /api/v1/listings/{listingId}/reviews/stats:
 *   get:
 *     summary: Get review statistics for a listing
 *     description: Returns total reviews, average rating, min/max rating, and counts by rating.
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: listingId
 *         required: true
 *         description: Listing ID
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Review stats retrieved successfully
 *       404:
 *         description: Listing not found
 */
router.get("/:listingId/reviews/stats", getReviewStatsByListing);

/**
 * @swagger
 * /api/v1/listings/{listingId}/reviews:
 *   post:
 *     summary: Add a review to a listing
 *     description: Authenticated users can add a review to a listing.
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: listingId
 *         required: true
 *         description: Listing ID
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
 *               - rating
 *               - comment
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *                 minLength: 10
 *     responses:
 *       201:
 *         description: Review created successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Listing not found
 */
router.post(
  "/:listingId/reviews",
  authenticate,
  validate(createReviewSchema),
  createReview
);

/**
 * @swagger
 * /api/v1/listings/{id}:
 *   get:
 *     summary: Get listing by ID
 *     tags: [Listings]
 */
router.get("/:id", getListingById);

/**
 * @swagger
 * /api/v1/listings:
 *   post:
 *     summary: Create listing
 *     description: HOST or ADMIN can create a listing.
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 */
router.post("/", authenticate, requireHost, validate(createListingSchema), createListing);

/**
 * @swagger
 * /api/v1/listings/{id}:
 *   put:
 *     summary: Update listing
 *     description: Listing owner or ADMIN can update a listing.
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 */
router.put("/:id", authenticate, requireHost, validate(updateListingSchema), updateListing);

/**
 * @swagger
 * /api/v1/listings/{id}:
 *   delete:
 *     summary: Delete listing
 *     description: Listing owner or ADMIN can delete a listing.
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 */
router.delete("/:id", authenticate, requireHost, deleteListing);

/**
 * @swagger
 * /api/v1/listings/{id}/cover-image:
 *   post:
 *     summary: Upload listing cover image
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  "/:id/cover-image",
  authenticate,
  requireHost,
  uploadSingleImage,
  uploadCoverImageListing
);

/**
 * @swagger
 * /api/v1/listings/{id}/cover-image:
 *   delete:
 *     summary: Delete listing cover image
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  "/:id/cover-image",
  authenticate,
  requireHost,
  deleteCoverImageListing
);

/**
 * @swagger
 * /api/v1/listings/{id}/images:
 *   post:
 *     summary: Upload multiple listing images
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  "/:id/images",
  authenticate,
  requireHost,
  uploadMultipleImages,
  uploadListingImages
);

/**
 * @swagger
 * /api/v1/listings/{id}/images:
 *   delete:
 *     summary: Delete all listing images
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  "/:id/images",
  authenticate,
  requireHost,
  deleteAllListingImages
);

/**
 * @swagger
 * /api/v1/listings/{id}/images/{publicId}:
 *   delete:
 *     summary: Delete single listing image
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  "/:id/images/:publicId",
  authenticate,
  requireHost,
  deleteSingleListingImage
);

export default router;