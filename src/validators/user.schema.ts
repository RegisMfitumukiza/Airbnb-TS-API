import { z } from "zod";
import { registry } from "../docs/registry.js";

const RoleEnum = z.enum(["GUEST", "HOST", "ADMIN"]);

export const createUserSchema = z.object({
  body: registry.register(
    "createUserInput",
    z.object({
      name: z.string().min(3, {
        message: "Name must have at least 3 characters"
      }),
      email: z.email({
        message: "Invalid email address"
      }),
      username: z.string().min(3, {
        message: "Username must have at least 3 characters"
      }),
      phone: z.string().min(10, {
        message: "Phone number must have at least 10 characters"
      }),
      password: z.string().min(8, {
        message: "Password must have at least 8 characters"
      }),
      confirmPassword: z.string().min(1, {
        message: "Confirm password is required"
      }),
      role: RoleEnum.default("GUEST"),
      avatar: z.url({
        message: "Avatar must be a valid URL"
      }).optional(),
      bio: z.string().max(500, {
        message: "Bio must be less than 500 characters"
      }).optional()
    }).refine((data) => data.password === data.confirmPassword, {
      message: "Passwords do not match",
      path: ["confirmPassword"]
    })
  )
});

export const updateUserSchema = z.object({
  body: registry.register(
    "updateUserInput",
    z.object({
      name: z.string().min(3).optional(),
      email: z.email().optional(),
      username: z.string().min(3).optional(),
      phone: z.string().min(10).optional(),
      role: RoleEnum.optional(),
      avatar: z.url().optional(),
      bio: z.string().max(500).optional()
    })
  )
});

export const updateMeSchema = z.object({
  body: registry.register(
    "updateMeInput",
    z.object({
      name: z.string().min(3).optional(),
      email: z.email().optional(),
      username: z.string().min(3).optional(),
      phone: z.string().min(10).optional(),
      avatar: z.url().optional(),
      bio: z.string().max(500).optional()
    })
  )
});

export const banUserSchema = z.object({
  body: registry.register(
    "banUserInput",
    z.object({
      reason: z
        .string()
        .min(5, "Ban reason must be at least 5 characters")
        .max(500, "Ban reason must not exceed 500 characters")
        .optional()
    })
  )
});