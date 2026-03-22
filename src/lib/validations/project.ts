import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(100).trim(),
  template: z.enum(["BLANK"]).default("BLANK").optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const deleteProjectSchema = z.object({
  confirmName: z.string().min(1, "Please type the project name to confirm"),
});

export type DeleteProjectInput = z.infer<typeof deleteProjectSchema>;
