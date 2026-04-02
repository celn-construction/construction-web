import { z } from "zod";

/**
 * Shared validation schema for organization creation
 * Used by both frontend forms and backend tRPC routes
 */
export const createOrganizationSchema = z.object({
  name: z
    .string()
    .min(1, "Company name is required")
    .max(100, "Company name must be less than 100 characters"),
  companyType: z
    .string()
    .min(1, "Company type is required"),
  phone: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length >= 10,
      "Phone number must be at least 10 digits"
    ),
  website: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.startsWith("http://") || val.startsWith("https://"),
      "Website must be a valid URL"
    ),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^\d{5}(-\d{4})?$/.test(val),
      "ZIP code must be in format 12345 or 12345-6789"
    ),
  licenseNumber: z.string().optional(),
  logoUrl: z.string().url().optional(),
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
