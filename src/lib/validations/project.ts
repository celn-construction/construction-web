import { z } from "zod";
import { VALID_PROJECT_ICONS } from "@/lib/constants/projectIcons";
import { VALID_PROJECT_COLORS } from "@/lib/constants/projectColors";

export const createProjectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(100).trim(),
  location: z.string().min(1, "Location is required").max(200).trim(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  icon: z.enum(VALID_PROJECT_ICONS).default("building").optional(),
  color: z.enum(VALID_PROJECT_COLORS).optional(),
  imageUrl: z.string().url().optional(),
  template: z.enum(["BLANK", "RESIDENTIAL"]).default("BLANK").optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = createProjectSchema
  .pick({ name: true, location: true, latitude: true, longitude: true, icon: true, color: true, imageUrl: true })
  .partial()
  .extend({ location: z.string().max(200).trim().optional() })
  .strict();

export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

export const deleteProjectSchema = z.object({
  confirmName: z.string().min(1, "Please type the project name to confirm"),
});

export type DeleteProjectInput = z.infer<typeof deleteProjectSchema>;
