import { Request, Response } from "express";
import { ListingType, Prisma, Role } from "../generated/prisma/client.js";

import { asyncHandler } from "../utils/asyncHandler.js";
import { APIError } from "../utils/ApiError.js";
import { getPagination } from "../utils/pagination.js";
import { logger } from "../utils/logger.js";

import {
  uploadBufferToCloudinary,
  deleteFromCloudinary
} from "../utils/cloudinary.helper.js";

import {
  createListingService,
  getAllListingsService,
  countListingsService,
  getListingByIdService,
  getListingsByHostService,
  updateListingService,
  deleteListingService,
  getListingStatsService,
  getListingImageDataService,
  updateListingCoverImageService,
  deleteListingCoverImageService,
  uploadListingImagesService,
  deleteAllListingImagesService,
  deleteSingleListingImageService
} from "../services/listings.service.js";

export const createListing = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new APIError("Unauthorized", 401);

  const listing = await createListingService({
    ...req.body,
    hostId: req.user.userId
  });

  logger.info("Listing created", {
    listingId: listing.id,
    hostId: req.user.userId
  });

  res.status(201).json({
    success: true,
    message: "Listing created successfully",
    data: listing
  });
});

export const getAllListing = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPagination(req.query.page, req.query.limit);

  const { location, type, minPrice, maxPrice } = req.query;

  const allowedSorts = ["title", "createdAt", "pricePerNight", "rating"];

  const sortBy = allowedSorts.includes(String(req.query.sortBy))
    ? String(req.query.sortBy)
    : "createdAt";

  const sortOrder: "asc" | "desc" =
    req.query.sortOrder === "asc" ? "asc" : "desc";

  const typeValue = type ? String(type).toUpperCase() : undefined;

  if (typeValue && !Object.values(ListingType).includes(typeValue as ListingType)) {
    throw new APIError("Invalid listing type", 400);
  }

  const min = minPrice ? Number(minPrice) : undefined;
  const max = maxPrice ? Number(maxPrice) : undefined;

  if ((minPrice && Number.isNaN(min)) || (maxPrice && Number.isNaN(max))) {
    throw new APIError("Price filters must be valid numbers", 400);
  }

  if (min !== undefined && max !== undefined && min > max) {
    throw new APIError("minPrice cannot be greater than maxPrice", 400);
  }

  const where: Prisma.ListingWhereInput = {
    ...(location && {
      location: {
        contains: String(location),
        mode: "insensitive"
      }
    }),

    ...(typeValue && {
      type: typeValue as ListingType
    }),

    ...((min !== undefined || max !== undefined) && {
      pricePerNight: {
        ...(min !== undefined && { gte: min }),
        ...(max !== undefined && { lte: max })
      }
    })
  };

  const totalListings = await countListingsService(where);

  const listings = await getAllListingsService({
    where,
    skip,
    limit,
    sortBy,
    sortOrder
  });

  res.status(200).json({
    success: true,
    message: "Listings retrieved successfully",
    page,
    limit,
    totalListings,
    totalPages: Math.ceil(totalListings / limit),
    count: listings.length,
    data: listings
  });
});

export const getListingById = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const listing = await getListingByIdService(id);

  if (!listing) {
    logger.warn("Listing not found", { listingId: id });
    throw new APIError("Listing not found", 404);
  }

  res.status(200).json({
    success: true,
    message: "Listing retrieved successfully",
    data: listing
  });
});

export const getListingByHost = asyncHandler(async (req: Request, res: Response) => {
  const hostId = req.params.id as string;

  const listings = await getListingsByHostService(hostId);

  res.status(200).json({
    success: true,
    count: listings.length,
    data: listings
  });
});

export const updateListing = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new APIError("Unauthorized", 401);

  const id = req.params.id as string;

  const existingListing = await getListingByIdService(id);

  if (!existingListing) {
    throw new APIError("Listing not found", 404);
  }

  if (existingListing.hostId !== req.user.userId && req.user.role !== Role.ADMIN) {
    logger.warn("Unauthorized listing update attempt", {
      userId: req.user.userId,
      listingId: id
    });

    throw new APIError("You can only edit your own listings", 403);
  }

  const updatedListing = await updateListingService(id, req.body);

  logger.info("Listing updated", {
    listingId: id,
    userId: req.user.userId
  });

  res.status(200).json({
    success: true,
    message: "Listing updated successfully",
    data: updatedListing
  });
});

export const deleteListing = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new APIError("Unauthorized", 401);

  const id = req.params.id as string;

  const existingListing = await getListingByIdService(id);

  if (!existingListing) {
    throw new APIError("Listing not found", 404);
  }

  if (existingListing.hostId !== req.user.userId && req.user.role !== Role.ADMIN) {
    logger.warn("Unauthorized listing delete attempt", {
      userId: req.user.userId,
      listingId: id
    });

    throw new APIError("You can only delete your own listings", 403);
  }

  const deletedListing = await deleteListingService(id);

  logger.info("Listing deleted", {
    listingId: id,
    userId: req.user.userId
  });

  res.status(200).json({
    success: true,
    message: "Listing deleted successfully",
    data: deletedListing
  });
});

export const getListingStats = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new APIError("Unauthorized", 401);

  if (req.user.role !== Role.ADMIN) {
    throw new APIError("Access denied: admins only", 403);
  }

  const stats = await getListingStatsService();

  res.status(200).json({
    success: true,
    message: "Listing stats retrieved successfully",
    data: stats
  });
});

export const uploadCoverImageListing = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw new APIError("Unauthorized", 401);

    if (!req.file) {
      throw new APIError("Image is required", 400);
    }

    const id = req.params.id as string;

    const existingList = await getListingImageDataService(id);

    if (!existingList) {
      throw new APIError("Listing not found", 404);
    }

    if (existingList.hostId !== req.user.userId && req.user.role !== Role.ADMIN) {
      logger.warn("Unauthorized cover image upload attempt", {
        userId: req.user.userId,
        listingId: id
      });

      throw new APIError("You can only edit your own listing", 403);
    }

    if (existingList.coverImagePublicId) {
      await deleteFromCloudinary(existingList.coverImagePublicId);
    }

    const uploadedCoverImage = await uploadBufferToCloudinary(
      req.file.buffer,
      "Listing-Images/Cover-Images"
    );

    const updatedCoverImage = await updateListingCoverImageService(
      id,
      uploadedCoverImage.url,
      uploadedCoverImage.publicId
    );

    logger.info("Cover image uploaded", {
      listingId: id,
      userId: req.user.userId
    });

    res.status(200).json({
      success: true,
      message: "Cover image uploaded successfully",
      data: updatedCoverImage
    });
  }
);

export const deleteCoverImageListing = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw new APIError("Unauthorized", 401);

    const id = req.params.id as string;

    const existingList = await getListingImageDataService(id);

    if (!existingList) {
      throw new APIError("Listing not found", 404);
    }

    if (existingList.hostId !== req.user.userId && req.user.role !== Role.ADMIN) {
      logger.warn("Unauthorized cover image delete attempt", {
        userId: req.user.userId,
        listingId: id
      });

      throw new APIError("You can only edit your own listing", 403);
    }

    if (existingList.coverImagePublicId) {
      await deleteFromCloudinary(existingList.coverImagePublicId);
    }

    const updatedListing = await deleteListingCoverImageService(id);

    logger.info("Cover image deleted", {
      listingId: id,
      userId: req.user.userId
    });

    res.status(200).json({
      success: true,
      message: "Cover image deleted successfully",
      data: updatedListing
    });
  }
);

export const uploadListingImages = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw new APIError("Unauthorized", 401);

    const id = req.params.id as string;
    const files = req.files as Express.Multer.File[] | undefined;

    if (!files || files.length === 0) {
      throw new APIError("At least one image is required", 400);
    }

    const existingList = await getListingImageDataService(id);

    if (!existingList) {
      throw new APIError("Listing not found", 404);
    }

    if (existingList.hostId !== req.user.userId && req.user.role !== Role.ADMIN) {
      logger.warn("Unauthorized listing images upload attempt", {
        userId: req.user.userId,
        listingId: id
      });

      throw new APIError("You can only edit your own listing", 403);
    }

    const uploadedImages: {
      url: string;
      publicId: string;
    }[] = [];

    try {
      for (const file of files) {
        const uploadedImage = await uploadBufferToCloudinary(
          file.buffer,
          "Listing-Images"
        );

        uploadedImages.push(uploadedImage);
      }

      const imageUrls = uploadedImages.map((image) => image.url);
      const imagePublicIds = uploadedImages.map((image) => image.publicId);

      const updatedListing = await uploadListingImagesService(
        id,
        [...existingList.images, ...imageUrls],
        [...existingList.imagesPublicIds, ...imagePublicIds]
      );

      logger.info("Listing images uploaded", {
        listingId: id,
        userId: req.user.userId,
        uploadedCount: uploadedImages.length
      });

      res.status(200).json({
        success: true,
        message: "Listing images uploaded successfully",
        data: updatedListing
      });
    } catch (error) {
      await Promise.all(
        uploadedImages.map((image) => deleteFromCloudinary(image.publicId))
      );

      logger.error("Listing images upload failed", {
        listingId: id,
        userId: req.user.userId,
        error
      });

      throw error;
    }
  }
);

export const deleteAllListingImages = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw new APIError("Unauthorized", 401);

    const id = req.params.id as string;

    const existingList = await getListingImageDataService(id);

    if (!existingList) {
      throw new APIError("Listing not found", 404);
    }

    if (existingList.hostId !== req.user.userId && req.user.role !== Role.ADMIN) {
      logger.warn("Unauthorized all listing images delete attempt", {
        userId: req.user.userId,
        listingId: id
      });

      throw new APIError("You can only edit your own listing", 403);
    }

    if (existingList.imagesPublicIds.length > 0) {
      await Promise.all(
        existingList.imagesPublicIds.map((publicId) =>
          deleteFromCloudinary(publicId)
        )
      );
    }

    const updatedListing = await deleteAllListingImagesService(id);

    logger.info("All listing images deleted", {
      listingId: id,
      userId: req.user.userId
    });

    res.status(200).json({
      success: true,
      message: "All listing images deleted successfully",
      data: updatedListing
    });
  }
);

export const deleteSingleListingImage = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw new APIError("Unauthorized", 401);

    const id = req.params.id as string;
    const publicId = decodeURIComponent(req.params.publicId as string);

    const existingList = await getListingImageDataService(id);

    if (!existingList) {
      throw new APIError("Listing not found", 404);
    }

    if (existingList.hostId !== req.user.userId && req.user.role !== Role.ADMIN) {
      logger.warn("Unauthorized single listing image delete attempt", {
        userId: req.user.userId,
        listingId: id
      });

      throw new APIError("You can only edit your own listing", 403);
    }

    const imageIndex = existingList.imagesPublicIds.indexOf(publicId);

    if (imageIndex === -1) {
      throw new APIError("Image not found on this listing", 404);
    }

    await deleteFromCloudinary(publicId);

    const updatedImages = existingList.images.filter(
      (_, index) => index !== imageIndex
    );

    const updatedImagePublicIds = existingList.imagesPublicIds.filter(
      (_, index) => index !== imageIndex
    );

    const updatedListing = await deleteSingleListingImageService(
      id,
      updatedImages,
      updatedImagePublicIds
    );

    logger.info("Single listing image deleted", {
      listingId: id,
      userId: req.user.userId
    });

    res.status(200).json({
      success: true,
      message: "Listing image deleted successfully",
      data: updatedListing
    });
  }
);