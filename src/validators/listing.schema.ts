import { z } from "zod";
import { registry } from "../docs/registry.js";

const ListingTypeEnum = z.enum(["APARTMENT", "HOUSE", "CABIN", "VILLA"]);

const ListingCategoryEnum = z.enum([
  "BEACH",
  "MOUNTAIN",
  "CITY",
  "COUNTRYSIDE",
]);

const amenitiesSchema = z.preprocess((value) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return value;
}, z.array(z.string()).min(1, {
  message: "At least one amenity is required",
}));

const availableFromSchema = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }

  return value;
}, z.coerce.date().optional());

export const createListingSchema = z.object({
  body: registry.register(
    "createListingInput",
    z.object({
      title: z.string().min(5, {
        message: "Title must be at least 5 characters",
      }),

      description: z.string().min(10, {
        message: "Description must have at least 10 characters",
      }),

      location: z.string().min(2, {
        message: "Location is required",
      }),

      latitude: z.coerce.number().optional(),
      longitude: z.coerce.number().optional(),

      pricePerNight: z.coerce.number().positive({
        message: "Price must be a positive number",
      }),

      guests: z.coerce.number().int().min(1, {
        message: "Must allow at least 1 guest",
      }),

      type: ListingTypeEnum,

      amenities: amenitiesSchema,

      rating: z.coerce.number().min(0).max(5).optional(),

      available: z.coerce.boolean().optional(),

      availableFrom: availableFromSchema,

      category: ListingCategoryEnum.optional(),

      superhost: z.coerce.boolean().optional(),
    })
  ),
});

export const updateListingSchema = z.object({
  body: registry.register(
    "updateListingInput",
    z.object({
      title: z.string().min(5).optional(),
      description: z.string().min(10).optional(),
      location: z.string().min(2).optional(),
      latitude: z.coerce.number().optional(),
      longitude: z.coerce.number().optional(),

      pricePerNight: z.coerce.number().positive().optional(),
      guests: z.coerce.number().int().min(1).optional(),
      type: ListingTypeEnum.optional(),

      amenities: amenitiesSchema.optional(),

      rating: z.coerce.number().min(0).max(5).optional(),

      available: z.coerce.boolean().optional(),

      availableFrom: availableFromSchema,

      category: ListingCategoryEnum.optional(),

      superhost: z.coerce.boolean().optional(),
    })
  ),
});