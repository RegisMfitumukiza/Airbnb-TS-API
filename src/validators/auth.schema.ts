import { z } from "zod";
import { registry } from "../docs/registry.js";

export const registerSchema = z.object({
  body: registry.register(
    "registerInput",
    z
      .object({
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
        })
      })
      .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"]
      })
  )
});

export const loginSchema = z.object({
  body: registry.register(
    "loginInput",
    z.object({
      email: z.email({
        message: "Invalid email address"
      }),
      password: z.string().min(1, {
        message: "Password is required"
      })
    })
  )
});

export const changePasswordSchema = z.object({
  body: registry.register(
    "changePasswordInput",
    z
      .object({
        currentPassword: z.string().min(1, {
          message: "Current password is required"
        }),
        newPassword: z.string().min(8, {
          message: "New password must have at least 8 characters"
        }),
        confirmNewPassword: z.string().min(1, {
          message: "Confirm new password is required"
        })
      })
      .refine((data) => data.newPassword === data.confirmNewPassword, {
        message: "New passwords do not match",
        path: ["confirmNewPassword"]
      })
      .refine((data) => data.currentPassword !== data.newPassword, {
        message: "New password must be different from current password",
        path: ["newPassword"]
      })
  )
});

export const forgotPasswordSchema = z.object({
  body: registry.register(
    "forgotPasswordInput",
    z.object({
      email: z.email({
        message: "Invalid email address"
      })
    })
  )
});

export const resetPasswordSchema = z.object({
  body: registry.register(
    "resetPasswordInput",
    z
      .object({
        newPassword: z.string().min(8, {
          message: "New password must have at least 8 characters"
        }),
        confirmNewPassword: z.string().min(1, {
          message: "Confirm new password is required"
        })
      })
      .refine((data) => data.newPassword === data.confirmNewPassword, {
        message: "Passwords do not match",
        path: ["confirmNewPassword"]
      })
  )
});