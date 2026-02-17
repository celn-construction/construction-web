import { z } from "zod";

export const ASSIGNABLE_ROLES = ["admin", "project_manager", "member", "viewer"] as const;
export type AssignableRole = typeof ASSIGNABLE_ROLES[number];

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
  role: z.enum(ASSIGNABLE_ROLES, {
    errorMap: () => ({ message: "Please select a valid role" }),
  }),
});

export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;
