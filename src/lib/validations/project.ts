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
  template: z.enum(["BLANK"]).default("BLANK").optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = createProjectSchema
  .pick({ name: true, location: true, latitude: true, longitude: true, icon: true, color: true, imageUrl: true })
  .partial()
  .extend({
    location: z.string().max(200).trim().optional(),
    // Project start date = the Gantt scheduling floor. Wire format is the native
    // date input's "yyyy-MM-dd" string (or "" / null to clear); the update
    // handler parses it to a Date. Keeping the wire type a string avoids the
    // Date-vs-string friction between react-hook-form and z.coerce.date().
    startDate: z
      .string()
      .trim()
      .nullable()
      .optional()
      .refine((v) => v == null || v === "" || !Number.isNaN(Date.parse(v)), {
        message: "Invalid date",
      }),
  });
// NOTE: do NOT add `.strict()` here. This schema is the `.input()` of a
// `projectProcedure`, which separately injects `{ projectId }`. tRPC runs each
// input parser against the full raw input, so a strict schema would reject the
// injected `projectId` with "Unrecognized key(s): 'projectId'". Unknown keys
// are stripped by Zod's default behavior, which is what we want here.

export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

export const deleteProjectSchema = z.object({
  confirmName: z.string().min(1, "Please type the project name to confirm"),
});

export type DeleteProjectInput = z.infer<typeof deleteProjectSchema>;
