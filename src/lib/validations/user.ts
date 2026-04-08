import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100).trim(),
  phone: z.string().max(20).trim().optional().or(z.literal("")),
  image: z
    .string()
    .url()
    .startsWith("https://api.dicebear.com/", "Must be a DiceBear avatar URL")
    .optional()
    .or(z.literal("")),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
