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
 *   - name: Listings
 *     description: Listing management
 *   - name: Reviews
 *     description: Listing reviews
 */

/**
 * @swagger
 * /api/v1/listings:
 *   get:
 *     summary: Get all listings
 *     description: Get paginated listings with filters and sorting.
 *     tags: [Listings]
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
 *         name: location
 *         schema:
 *           type: string
 *           example: Kigali
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [APARTMENT, HOUSE, VILLA, CABIN]
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *           example: 20
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *           example: 100
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
 *     description: Returns total listings, average price, min/max price, and counts by type/location. ADMIN only.
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
 * /api/v1/listings:
 *   post:
 *     summary: Create listing
 *     description: HOST or ADMIN can create a listing.
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - location
 *               - pricePerNight
 *               - guests
 *               - type
 *               - amenities
 *             properties:
 *               title:
 *                 type: string
 *                 example: Modern Apartment in Kigali
 *               description:
 *                 type: string
 *                 example: A clean and modern apartment close to the city center.
 *               location:
 *                 type: string
 *                 example: Kigali
 *               pricePerNight:
 *                 type: number
 *                 example: 50
 *               guests:
 *                 type: integer
 *                 example: 2
 *               type:
 *                 type: string
 *                 enum: [APARTMENT, HOUSE, VILLA, CABIN]
 *                 example: APARTMENT
 *               amenities:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["wifi", "parking", "kitchen"]
 *               rating:
 *                 type: number
 *                 example: 4.5
 *     responses:
 *       201:
 *         description: Listing created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - hosts only
 */
router.post("/", authenticate, requireHost, validate(createListingSchema), createListing);

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
 *                 example: 5
 *               comment:
 *                 type: string
 *                 example: This place was very clean and comfortable.
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
 *     description: Retrieve a single listing by its ID.
 *     tags: [Listings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Listing retrieved successfully
 *       404:
 *         description: Listing not found
 */
router.get("/:id", getListingById);

/**
 * @swagger
 * /api/v1/listings/{id}:
 *   put:
 *     summary: Update listing
 *     description: Listing owner or ADMIN can update a listing.
 *     tags: [Listings]
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
 *               title:
 *                 type: string
 *                 example: Updated Apartment Title
 *               description:
 *                 type: string
 *                 example: Updated listing description.
 *               location:
 *                 type: string
 *                 example: Kigali
 *               pricePerNight:
 *                 type: number
 *                 example: 65
 *               guests:
 *                 type: integer
 *                 example: 3
 *               type:
 *                 type: string
 *                 enum: [APARTMENT, HOUSE, VILLA, CABIN]
 *               amenities:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["wifi", "parking"]
 *               rating:
 *                 type: number
 *                 example: 4.8
 *     responses:
 *       200:
 *         description: Listing updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Listing not found
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
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Listing deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Listing not found
 */
router.delete("/:id", authenticate, requireHost, deleteListing);

/**
 * @swagger
 * /api/v1/listings/{id}/cover-image:
 *   post:
 *     summary: Upload listing cover image
 *     description: Upload or replace a listing cover image. Field name must be image.
 *     tags: [Listings]
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
 *         description: Cover image uploaded successfully
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
 *     description: Deletes the listing cover image from Cloudinary and database.
 *     tags: [Listings]
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
 *         description: Cover image deleted successfully
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
 *     description: Upload up to 10 listing images. Field name must be images.
 *     tags: [Listings]
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - images
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Listing images uploaded successfully
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
 *     description: Deletes all listing gallery images from Cloudinary and database.
 *     tags: [Listings]
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
 *         description: All listing images deleted successfully
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
 *     description: Deletes one image by Cloudinary publicId. Encode slashes in publicId as %2F.
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: publicId
 *         required: true
 *         schema:
 *           type: string
 *         example: Listing-Images%2Fabc123
 *     responses:
 *       200:
 *         description: Listing image deleted successfully
 *       404:
 *         description: Image not found
 */
router.delete(
  "/:id/images/:publicId",
  authenticate,
  requireHost,
  deleteSingleListingImage
);

export default router;