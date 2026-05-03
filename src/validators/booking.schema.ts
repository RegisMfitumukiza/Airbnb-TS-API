import { z } from "zod";
import { registry } from '../docs/registry.js';

const BookingStatusEnum = z.enum(["PENDING", "CONFIRMED", "CANCELLED"]);

const isFutureDate = (date: string) => {
  return new Date(date) > new Date();
};

export const createBookingSchema = z.object({
  body: registry.register("createBookingInput", z
    .object({
      checkIn: z.iso.datetime({
        message: "checkIn must be a valid date"
      }),

      checkOut: z.iso.datetime({
        message: "checkOut must be a valid date"
      }),

      listingId: z.uuid({
        message: "listingId must be a valid UUID"
      })
    })
    .refine((data) => isFutureDate(data.checkIn), {
      message: "checkIn must be a future date",
      path: ["checkIn"]
    })
    .refine((data) => new Date(data.checkOut) > new Date(data.checkIn), {
      message: "checkOut must be after checkIn",
      path: ["checkOut"]
    }))
});

export const updateBookingSchema = z.object({
  body: registry.register("updateBookingInput", z
    .object({
      checkIn: z.iso.datetime().optional(),
      checkOut: z.iso.datetime().optional(),
      listingId: z.uuid().optional()
    })
    .refine(
      (data) => {
        if (data.checkIn) {
          return isFutureDate(data.checkIn);
        }

        return true;
      },
      {
        message: "checkIn must be a future date",
        path: ["checkIn"]
      }
    )
    .refine(
      (data) => {
        if (data.checkIn && data.checkOut) {
          return new Date(data.checkOut) > new Date(data.checkIn);
        }

        return true;
      },
      {
        message: "checkOut must be after checkIn",
        path: ["checkOut"]
      }
    ))
});

export const updateBookingStatusSchema = z.object({
  body: registry.register("updateBookingStatusInput", z.object({
    status: BookingStatusEnum
  }))
});