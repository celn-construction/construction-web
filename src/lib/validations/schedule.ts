import { z } from "zod";

export const saveVersionSchema = z.object({
  name: z.string().min(1, "Version name is required").max(100).trim(),
}).strict();

export type SaveVersionInput = z.infer<typeof saveVersionSchema>;

export const versionIdSchema = z.object({
  versionId: z.string().cuid(),
}).strict();

export type VersionIdInput = z.infer<typeof versionIdSchema>;
