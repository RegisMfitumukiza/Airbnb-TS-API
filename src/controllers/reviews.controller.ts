import { Request, Response } from "express";
import { Role } from "../generated/prisma/client.js";

import { asyncHandler } from "../utils/asyncHandler.js";
import { APIError } from "../utils/ApiError.js";
import { getPagination } from "../utils/pagination.js";
import { logger } from "../utils/logger.js";

import {
  createReviewService,
  getReviewsByListingService,
  countReviewsByListingService,
  getReviewByIdService,
  deleteReviewService,
  getReviewStatsByListingService,
  getAllReviewsService
} from "../services/reviews.service.js";

import { getListingByIdService } from "../services/listings.service.js";

export const createReview = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new APIError("Unauthorized", 401);

  const listingId = req.params.listingId as string;
  const { rating, comment } = req.body;

  const listing = await getListingByIdService(listingId);
  if (!listing) throw new APIError("Listing not found", 404);

  const review = await createReviewService({
    rating,
    comment,
    listingId,
    userId: req.user.userId
  });

  logger.info("Review created", {
    reviewId: review.id,
    listingId,
    userId: req.user.userId
  });

  res.status(201).json({
    success: true,
    message: "Review created successfully",
    data: review
  });
});

// controller
export const getAllReviews = asyncHandler(async (_req: Request, res: Response) => {
  const reviews = await getAllReviewsService();

  res.status(200).json({
    success: true,
    count: reviews.length,
    data: reviews,
  });
});

export const getReviewsByListing = asyncHandler(async (req: Request, res: Response) => {
  const listingId = req.params.listingId as string;
  const { page, limit, skip } = getPagination(req.query.page, req.query.limit);

  const allowedSorts = ["createdAt", "rating"];
  const sortBy = allowedSorts.includes(String(req.query.sortBy))
    ? String(req.query.sortBy)
    : "createdAt";

  const sortOrder: "asc" | "desc" =
    req.query.sortOrder === "asc" ? "asc" : "desc";

  const listing = await getListingByIdService(listingId);
  if (!listing) throw new APIError("Listing not found", 404);

  const totalReviews = await countReviewsByListingService(listingId);

  const reviews = await getReviewsByListingService({
    listingId,
    skip,
    limit,
    sortBy,
    sortOrder
  });

  res.status(200).json({
    success: true,
    message: "Reviews retrieved successfully",
    page,
    limit,
    totalReviews,
    totalPages: Math.ceil(totalReviews / limit),
    count: reviews.length,
    data: reviews
  });
});

export const getReviewStatsByListing = asyncHandler(async (req: Request, res: Response) => {
  const listingId = req.params.listingId as string;

  const listing = await getListingByIdService(listingId);
  if (!listing) throw new APIError("Listing not found", 404);

  const stats = await getReviewStatsByListingService(listingId);

  res.status(200).json({
    success: true,
    message: "Review stats retrieved successfully",
    data: stats
  });
});



export const deleteReview = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new APIError("Unauthorized", 401);

  const id = req.params.id as string;

  const review = await getReviewByIdService(id);
  if (!review) throw new APIError("Review not found", 404);

  if (review.userId !== req.user.userId && req.user.role !== Role.ADMIN) {
    logger.warn("Unauthorized review delete attempt", {
      userId: req.user.userId,
      reviewId: id,
    });

    throw new APIError("You can only delete your own review", 403);
  }

  const deletedReview = await deleteReviewService(id);

  logger.info("Review deleted", {
    reviewId: id,
    listingId: review.listingId,
    userId: req.user.userId,
  });

  res.status(200).json({
    success: true,
    message: "Review deleted successfully",
    data: deletedReview,
  });
});