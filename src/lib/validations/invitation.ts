import { z } from "zod";

/**
 * Shared validation schema for creating invitations
 * Used by both frontend forms and backend tRPC routes
 */
export const createInvitationSchema = z.object({
  organizationId: z.string(),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  role: z
    .string()
    .min(1, "Role is required")
    .default("member"),
});

export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;
