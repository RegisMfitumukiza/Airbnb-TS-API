-- AlterTable
ALTER TABLE "Listing" ADD COLUMN     "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "imagesPublicIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
