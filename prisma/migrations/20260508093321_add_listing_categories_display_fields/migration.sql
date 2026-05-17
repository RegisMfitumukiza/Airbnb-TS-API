-- CreateEnum
CREATE TYPE "ListingCategory" AS ENUM ('BEACH', 'MOUNTAIN', 'CITY', 'COUNTRYSIDE');

-- AlterTable
ALTER TABLE "Listing" ADD COLUMN     "available" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "availableFrom" TIMESTAMP(3),
ADD COLUMN     "category" "ListingCategory" NOT NULL DEFAULT 'CITY',
ADD COLUMN     "superhost" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Listing_category_idx" ON "Listing"("category");

-- CreateIndex
CREATE INDEX "Listing_available_idx" ON "Listing"("available");
