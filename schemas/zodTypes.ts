import { SUBSCRIPTION_PLANS } from "@/lib/constants/subscription";
import { USER_ROLES } from "@/lib/constants/user";
import { NOTE_PRIORITIES } from "@/lib/constants/notes";
import { z } from "zod";

export const signupInput = z.object({
  firstName: z.string().min(1, "First name is required").trim(),
  lastName: z.string().trim().optional(),
  email: z.string().email("Invalid email").trim(),
  password: z.string().min(6, "Password must be at least 6 characters").trim(),
  tenantName: z.string().min(1, "Tenant name is required").trim(),
  tenantSlug: z.string()
    .trim()
    .regex(/^[a-z0-9-]+$/, {
      message: "Tenant slug must contain only lowercase letters, numbers, and hyphens"
    }),
});

export const signinInput = z.object({
  email: z.string().email("Invalid email").trim(),
  password: z.string().min(1, "Password is required").trim(),
});

export const notesInput = z.object({
  title: z.string().min(1, "Title is required").trim(),
  content: z.string().min(1, "Content is required").trim(),
  priority: z.enum([NOTE_PRIORITIES.LOW, NOTE_PRIORITIES.MEDIUM, NOTE_PRIORITIES.HIGH])
  .default(NOTE_PRIORITIES.MEDIUM),
  assignedTo: z.string().trim().optional(),
});

export const tenantCreationInput = z.object({
  name: z.string().min(1, "Tenant name is required").trim(),
  slug: z.string()
    .trim()
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase, numbers or hyphens"),
  subscriptionPlan: z.enum([SUBSCRIPTION_PLANS.FREE, SUBSCRIPTION_PLANS.PRO]).default(SUBSCRIPTION_PLANS.FREE),
});

export const userCreationInput = z.object({
  firstName: z.string().min(1, "First name is required").trim(),
  lastName: z.string().trim().optional(),
  email: z.string().email("Invalid email").trim(),
  password: z.string().min(6, "Password must be at least 6 characters").trim().optional(),
  role:  z.enum([USER_ROLES.ADMIN, USER_ROLES.MEMBER]).default(USER_ROLES.MEMBER),
});

