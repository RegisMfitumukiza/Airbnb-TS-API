import { z } from "zod";
import { registry } from "../docs/registry.js";

const ListingTypeEnum = z.enum(["APARTMENT", "HOUSE", "VILLA", "CABIN"]);

export const naturalLanguageSearchSchema = z.object({
  body: registry.register(
    "naturalLanguageSearchInput",
    z.object({
      query: z.string().min(5).max(300)
    })
  )
});

export const generateListingDescriptionSchema = z.object({
  body: registry.register(
    "generateListingDescriptionInput",
    z.object({
      title: z.string().min(5).max(120),
      location: z.string().min(2).max(100),
      type: ListingTypeEnum,
      guests: z.coerce.number().int().min(1).max(50),
      amenities: z.array(z.string().min(2).max(40)).min(1).max(20),
      price: z.coerce.number().positive().max(10000)
    })
  )
});

export const aiChatSchema = z.object({
  body: registry.register(
    "aiChatInput",
    z.object({
      message: z.string().min(2).max(500),
      sessionId: z.string().min(3).max(100)
    })
  )
});