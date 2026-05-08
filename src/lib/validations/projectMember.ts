import { z } from "zod";
import { ASSIGNABLE_ROLES } from "./invitation";

export const bulkAddProjectMembersSchema = z.object({
  members: z
    .array(
      z.object({
        userId: z.string(),
        role: z.enum(ASSIGNABLE_ROLES, {
          errorMap: () => ({ message: "Please select a valid role" }),
        }),
      })
    )
    .min(1, "Select at least one teammate"),
});

export type BulkAddProjectMembersInput = z.infer<
  typeof bulkAddProjectMembersSchema
>;
