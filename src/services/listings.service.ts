import { prisma } from "../lib/prisma.js";
import { ListingType, Prisma } from "../generated/prisma/client.js";

type CreateListingData =  Prisma.ListingUncheckedCreateInput;

type UpdateListingData = Prisma.ListingUncheckedUpdateInput;

type GetListingsOptions = {
  skip: number;
  limit: number;
  where?: Prisma.ListingWhereInput;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

export const createListingService = async (data: CreateListingData) => {
  return await prisma.listing.create({
    data
  });
};

export const getAllListingsService = async ({
  skip,
  limit,
  where = {},
  sortBy = "createdAt",
  sortOrder = "desc"
}: GetListingsOptions) => {
  return await prisma.listing.findMany({
    skip,
    take: limit,
    where,
    orderBy: {
      [sortBy]: sortOrder
    },
    include: {
      host: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      _count: {
        select: {
          bookings: true,
          reviews: true
        }
      }
    }
  });
};

export const countListingsService = async (
  where?: Prisma.ListingWhereInput
) => {
  return await prisma.listing.count({
    where
  });
};

export const getListingByIdService = async (id: string) => {
  return await prisma.listing.findUnique({
    where: { id },
    include: {
      host: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      bookings: true,
      reviews: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          }
        }
      }
    }
  });
};

export const getListingsByHostService = async (hostId: string) => {
  return await prisma.listing.findMany({
    where: { hostId },
    include: {
      _count: {
        select: {
          bookings: true,
          reviews: true
        }
      }
    }
  });
};

export const updateListingService = async (
  id: string,
  data: UpdateListingData
) => {
  return await prisma.listing.update({
    where: { id },
    data
  });
};

export const deleteListingService = async (id: string) => {
  return await prisma.listing.delete({
    where: { id }
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
      imagesPublicIds: true
    }
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
      coverImagePublicId
    }
  });
};

export const deleteListingCoverImageService = async (id: string) => {
  return await prisma.listing.update({
    where: { id },
    data: {
      coverImage: null,
      coverImagePublicId: null
    }
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
      imagesPublicIds
    }
  });
};

export const deleteAllListingImagesService = async (id: string) => {
  return await prisma.listing.update({
    where: { id },
    data: {
      images: [],
      imagesPublicIds: []
    }
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
      imagesPublicIds
    }
  });
};


export const getListingStatsService = async () => {

    const totalListings = await prisma.listing.count();

    const priceStats = await prisma.listing.aggregate({
        _avg: {
            pricePerNight: true
        },
        _min: {
            pricePerNight: true
        },
        _max: {
            pricePerNight: true
        },
        _count: {
            pricePerNight: true
        }
    });

    const listingsByType = await prisma.listing.groupBy({
        by: ["type"],
        _count: {
            type: true 
        }
    });

    const listingsByLocation = await prisma.listing.groupBy({
        by: ["location"],
        _count: {
            location: true
         }
    });

    return {
        totalListings,
        averagePricePerNight: priceStats._avg.pricePerNight,
        minPricePerNight: priceStats._min.pricePerNight,
        maxPricePerNight: priceStats._max.pricePerNight,
        listingsByType: listingsByType.map(item => ({
            type: item.type,
            count: item._count.type
        })),
        listingsByLocation: listingsByLocation.map(item => ({
            location: item.location,
            count: item._count.location
        })),
    }
}