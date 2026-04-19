import { z } from "zod";
import { createOrganizationSchema } from "./onboarding";

export const updateOrganizationSchema = createOrganizationSchema.partial();

export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
