import { z } from "zod";

export const saveVersionSchema = z.object({
  name: z.string().max(100).trim().optional(),
  description: z.string().max(500).trim().optional(),
});

export type SaveVersionInput = z.infer<typeof saveVersionSchema>;

export const versionIdSchema = z.object({
  versionId: z.string().cuid(),
});

export type VersionIdInput = z.infer<typeof versionIdSchema>;
