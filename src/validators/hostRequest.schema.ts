import { z } from "zod";
import { registry } from "../docs/registry.js";

export const createHostRequestSchema = z.object({
  body: registry.register(
    "createHostRequestInput",
    z.object({
      message: z
        .string()
        .min(10, "Message must be at least 10 characters")
        .max(500, "Message must not exceed 500 characters")
        .optional()
    })
  )
});

export const rejectHostRequestSchema = z.object({
  body: registry.register(
    "rejectHostRequestInput",
    z.object({
      reason: z
        .string()
        .min(5, "Reason must be at least 5 characters")
        .max(500, "Reason must not exceed 500 characters")
        .optional()
    })
  )
});
