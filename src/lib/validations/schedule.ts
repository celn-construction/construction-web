import { z } from "zod";

/** Schema for the Bryntum inlineData snapshot sent from the client. */
export const clientSnapshotSchema = z.object({
  tasks: z.array(z.record(z.unknown())),
  dependencies: z.array(z.record(z.unknown())),
  resources: z.array(z.record(z.unknown())),
  assignments: z.array(z.record(z.unknown())),
  timeRanges: z.array(z.record(z.unknown())),
});

export const saveVersionSchema = z.object({
  name: z.string().max(100).trim().optional(),
  description: z.string().max(500).trim().optional(),
  /** Full Bryntum inlineData from the client — used to build the snapshot
   *  and reconcile the DB, bypassing CrudManager dirty tracking bugs. */
  clientSnapshot: clientSnapshotSchema.optional(),
});

export type SaveVersionInput = z.infer<typeof saveVersionSchema>;

export const versionIdSchema = z.object({
  versionId: z.string().cuid(),
});

export type VersionIdInput = z.infer<typeof versionIdSchema>;
