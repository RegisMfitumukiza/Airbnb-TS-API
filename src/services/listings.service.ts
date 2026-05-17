import { prisma } from "../lib/prisma.js";
import { Prisma } from "../generated/prisma/client.js";

type CreateListingData = Prisma.ListingUncheckedCreateInput;
type UpdateListingData = Prisma.ListingUncheckedUpdateInput;

type GetListingsOptions = {
  skip: number;
  limit: number;
  where?: Prisma.ListingWhereInput;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

const getAverageRating = (reviews: { rating: number }[]) => {
  if (reviews.length === 0) return null;

  return (
    reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
  );
};

const calculateSuperhost = (
  bookingCount: number,
  averageRating: number | null
) => {
  return bookingCount >= 2 && (averageRating ?? 0) >= 4.5;
};

export const createListingService = async (data: CreateListingData) => {
  return await prisma.listing.create({
    data,
  });
};

export const getAllListingsService = async ({
  skip,
  limit,
  where = {},
  sortBy = "createdAt",
  sortOrder = "desc",
}: GetListingsOptions) => {
  const listings = await prisma.listing.findMany({
    skip,
    take: limit,
    where,
    orderBy: {
      [sortBy]: sortOrder,
    },
    include: {
      host: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
      },
      reviews: {
        select: {
          rating: true,
        },
      },
      _count: {
        select: {
          bookings: true,
          reviews: true,
        },
      },
    },
  });

  return listings.map((listing) => {
    const averageRating = getAverageRating(listing.reviews);

    const isSuperhost = calculateSuperhost(
    listing._count.bookings,
    averageRating
  );
    const { reviews, ...rest } = listing;

    return {
      ...rest,
      rating: listing.rating ?? averageRating,
      superhost: listing.superhost || isSuperhost,
    };
  });
};

export const countListingsService = async (
  where?: Prisma.ListingWhereInput
) => {
  return await prisma.listing.count({
    where,
  });
};

export const getListingByIdService = async (id: string) => {
  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      host: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
      },
      bookings: true,
      reviews: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
      },
    },
  });

  if (!listing) return null;

  const averageRating = getAverageRating(listing.reviews);

  const isSuperhost = calculateSuperhost(
  listing.bookings.length,
  averageRating
);

  return {
    ...listing,
    rating: listing.rating ?? averageRating,
    superhost: listing.superhost || isSuperhost,
  };
};

export const getListingsByHostService = async (hostId: string) => {
  const listings = await prisma.listing.findMany({
    where: { hostId },
    include: {
      reviews: {
        select: {
          rating: true,
        },
      },
      _count: {
        select: {
          bookings: true,
          reviews: true,
        },
      },
    },
  });

  return listings.map((listing) => {
    const averageRating = getAverageRating(listing.reviews);

    const isSuperhost = calculateSuperhost(
    listing._count.bookings,
    averageRating
  );

    const { reviews, ...rest } = listing;

    return {
      ...rest,
      rating: listing.rating ?? averageRating,
      superhost: listing.superhost || isSuperhost,
    };
  });
};

export const updateListingService = async (
  id: string,
  data: UpdateListingData
) => {
  return await prisma.listing.update({
    where: { id },
    data,
  });
};

export const deleteListingService = async (id: string) => {
  return await prisma.listing.delete({
    where: { id },
  });
};

export const getListingImageDataService = async (id: string) => {
  return await prisma.listing.findUnique({
    where: { id },
    select: {
      id: true,
      hostId: true,
      coverImage: true,
      coverImagePublicId: true,
      images: true,
      imagesPublicIds: true,
    },
  });
};

export const updateListingCoverImageService = async (
  id: string,
  coverImage: string,
  coverImagePublicId: string
) => {
  return await prisma.listing.update({
    where: { id },
    data: {
      coverImage,
      coverImagePublicId,
    },
  });
};

export const deleteListingCoverImageService = async (id: string) => {
  return await prisma.listing.update({
    where: { id },
    data: {
      coverImage: null,
      coverImagePublicId: null,
    },
  });
};

export const uploadListingImagesService = async (
  id: string,
  images: string[],
  imagesPublicIds: string[]
) => {
  return await prisma.listing.update({
    where: { id },
    data: {
      images,
      imagesPublicIds,
    },
  });
};

export const deleteAllListingImagesService = async (id: string) => {
  return await prisma.listing.update({
    where: { id },
    data: {
      images: [],
      imagesPublicIds: [],
    },
  });
};

export const deleteSingleListingImageService = async (
  id: string,
  images: string[],
  imagesPublicIds: string[]
) => {
  return await prisma.listing.update({
    where: { id },
    data: {
      images,
      imagesPublicIds,
    },
  });
};

export const getListingStatsService = async () => {
  const totalListings = await prisma.listing.count();

  const priceStats = await prisma.listing.aggregate({
    _avg: {
      pricePerNight: true,
    },
    _min: {
      pricePerNight: true,
    },
    _max: {
      pricePerNight: true,
    },
    _count: {
      pricePerNight: true,
    },
  });

  const listingsByType = await prisma.listing.groupBy({
    by: ["type"],
    _count: {
      type: true,
    },
  });

  const listingsByCategory = await prisma.listing.groupBy({
    by: ["category"],
    _count: {
      category: true,
    },
  });

  const listingsByLocation = await prisma.listing.groupBy({
    by: ["location"],
    _count: {
      location: true,
    },
  });

  const availableListings = await prisma.listing.count({
    where: {
      available: true,
    },
  });

  return {
    totalListings,
    availableListings,
    averagePricePerNight: priceStats._avg.pricePerNight,
    minPricePerNight: priceStats._min.pricePerNight,
    maxPricePerNight: priceStats._max.pricePerNight,

    listingsByType: listingsByType.map((item) => ({
      type: item.type,
      count: item._count.type,
    })),

    listingsByCategory: listingsByCategory.map((item) => ({
      category: item.category,
      count: item._count.category,
    })),

    listingsByLocation: listingsByLocation.map((item) => ({
      location: item.location,
      count: item._count.location,
    })),
  };
};