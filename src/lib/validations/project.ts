import { z } from "zod";
import { VALID_PROJECT_ICONS } from "@/lib/constants/projectIcons";

export const createProjectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(100).trim(),
  location: z.string().min(1, "Location is required").max(200).trim(),
  icon: z.enum(VALID_PROJECT_ICONS).default("building").optional(),
  imageUrl: z.string().url().optional(),
  template: z.enum(["BLANK"]).default("BLANK").optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const deleteProjectSchema = z.object({
  confirmName: z.string().min(1, "Please type the project name to confirm"),
});

export type DeleteProjectInput = z.infer<typeof deleteProjectSchema>;
