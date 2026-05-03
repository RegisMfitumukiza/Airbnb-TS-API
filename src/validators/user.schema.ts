import { z } from "zod";
import { registry } from '../docs/registry.js';

const RoleEnum = z.enum(["GUEST", "HOST"]);

export const createUserSchema = z.object({
  body: registry.register("createUserInput", z.object({
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
    role: RoleEnum.default("GUEST"),
    avatar: z.url({
      message: "Avatar must be a valid URL"
    }).optional(),
    bio: z.string().max(500, {
      message: "Bio must be less than 500 characters"
    }).optional()
  }))
});

export const updateUserSchema = z.object({
  body: registry.register("updateUserInput", z.object({
    name: z.string().min(3).optional(),
    email: z.email().optional(),
    username: z.string().min(3).optional(),
    phone: z.string().min(10).optional(),
    role: RoleEnum.optional(),
    avatar: z.url().optional(),
    bio: z.string().max(500).optional()
  }))
});