import { prisma } from "../lib/prisma.js";
import { Prisma } from "../generated/prisma/client.js";

type CreateReviewData = Prisma.ReviewUncheckedCreateInput;

type GetListingReviewsOptions = {
  listingId: string;
  skip: number;
  limit: number;
  where?: Prisma.ReviewWhereInput;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

const updateListingAverageRating = async (listingId: string) => {
  const stats = await prisma.review.aggregate({
    where: { listingId },
    _avg: {
      rating: true,
    },
  });

  await prisma.listing.update({
    where: { id: listingId },
    data: {
      rating: stats._avg.rating,
    },
  });
};

export const createReviewService = async (data: CreateReviewData) => {
  const review = await prisma.review.create({
    data,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
      listing: {
        select: {
          id: true,
          title: true,
          location: true,
        },
      },
    },
  });

  await updateListingAverageRating(review.listingId);

  return review;
};

export const getAllReviewsService = async () => {
  return prisma.review.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
      },
      listing: {
        select: {
          id: true,
          title: true,
          location: true,
        },
      },
    },
  });
};

export const getReviewsByListingService = async ({
  listingId,
  skip,
  limit,
  where = {},
  sortBy = "createdAt",
  sortOrder = "desc",
}: GetListingReviewsOptions) => {
  return prisma.review.findMany({
    where: {
      listingId,
      ...where,
    },
    skip,
    take: limit,
    orderBy: {
      [sortBy]: sortOrder,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
    },
  });
};

export const countReviewsByListingService = async (
  listingId: string,
  where: Prisma.ReviewWhereInput = {}
) => {
  return prisma.review.count({
    where: {
      listingId,
      ...where,
    },
  });
};

export const getReviewByIdService = async (id: string) => {
  return prisma.review.findUnique({
    where: { id },
  });
};

export const deleteReviewService = async (id: string) => {
  const review = await prisma.review.delete({
    where: { id },
  });

  await updateListingAverageRating(review.listingId);

  return review;
};

export const getReviewStatsByListingService = async (listingId: string) => {
  const totalReviews = await prisma.review.count({
    where: { listingId },
  });

  const ratingStats = await prisma.review.aggregate({
    where: { listingId },
    _avg: {
      rating: true,
    },
    _min: {
      rating: true,
    },
    _max: {
      rating: true,
    },
  });

  const reviewsByRating = await prisma.review.groupBy({
    by: ["rating"],
    where: { listingId },
    _count: {
      rating: true,
    },
    orderBy: {
      rating: "desc",
    },
  });

  return {
    totalReviews,
    averageRating: ratingStats._avg.rating,
    minRating: ratingStats._min.rating,
    maxRating: ratingStats._max.rating,
    reviewsByRating: reviewsByRating.map((item) => ({
      rating: item.rating,
      count: item._count.rating,
    })),
  };
};