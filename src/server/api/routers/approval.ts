import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, orgProcedure } from "@/server/api/trpc";
import { canApproveDocuments } from "@/lib/permissions";
import { APPROVABLE_FOLDER_ID_LIST, expandFolderIds } from "@/lib/folders";
import { documentProxyUrl } from "@/lib/blobProxy";
import type { SlotKind } from "@/lib/validations/gantt";
import type { PrismaClient } from "../../../../generated/prisma";

const approvalStatusSchema = z.enum(["unapproved", "approved", "all"]).default("all");
const categorySchema = z.enum(["all", "submittals", "inspections"]).default("all");

function categoryFolderIds(category: z.infer<typeof categorySchema>): string[] {
  if (category === "submittals") return expandFolderIds("submittals");
  if (category === "inspections") return expandFolderIds("inspections");
  return APPROVABLE_FOLDER_ID_LIST;
}

export const approvalRouter = createTRPCRouter({
  /**
   * List all submittal/inspection documents in a project, optionally
   * filtered by approval status and/or category. Returns uploader and
   * approver user details for the queue UI.
   */
  listAll: orgProcedure
    .input(
      z.object({
        projectId: z.string(),
        status: approvalStatusSchema,
        category: categorySchema,
      }),
    )
    .query(async ({ ctx, input }) => {
      const project = await ctx.db.project.findFirst({
        where: { id: input.projectId, organizationId: ctx.organization.id },
        select: { id: true, name: true },
      });
      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      }

      const folderIds = categoryFolderIds(input.category);
      const where = {
        projectId: input.projectId,
        folderId: { in: folderIds },
        ...(input.status !== "all" ? { approvalStatus: input.status } : {}),
      };

      const docs = await ctx.db.document.findMany({
        where,
        include: {
          uploadedBy: { select: { id: true, name: true, email: true } },
          approvedBy: { select: { id: true, name: true, email: true } },
        },
        orderBy: [{ approvalStatus: "asc" }, { createdAt: "desc" }],
      });

      return {
        project,
        documents: docs.map((d) => ({
          ...d,
          blobUrl: documentProxyUrl(d.id),
        })),
      };
    }),

  /**
   * Counts of pending and approved submittals/inspections for the
   * Review Queue header / sidebar badge. Also includes overdue slot count
   * (slots with a passed dueDate that don't have an upload yet).
   */
  summary: orgProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const project = await ctx.db.project.findFirst({
        where: { id: input.projectId, organizationId: ctx.organization.id },
        select: { id: true },
      });
      if (!project) return { pending: 0, approved: 0, overdue: 0 };

      const [grouped, overdue] = await Promise.all([
        ctx.db.document.groupBy({
          by: ["approvalStatus"],
          where: {
            projectId: input.projectId,
            folderId: { in: APPROVABLE_FOLDER_ID_LIST },
          },
          _count: { _all: true },
        }),
        countOverdueSlots(ctx.db, input.projectId),
      ]);

      let pending = 0;
      let approved = 0;
      for (const row of grouped) {
        if (row.approvalStatus === "approved") approved = row._count._all;
        else if (row.approvalStatus === "unapproved") pending = row._count._all;
      }
      return { pending, approved, overdue };
    }),

  /**
   * Slots whose dueDate has passed and don't yet have an upload mapped to them.
   * Maps a slot to "filled" by index: if N docs exist under the kind's folder
   * for that task, slots 0..N-1 are filled. Mirrors the per-task popover logic.
   */
  listOverdueSlots: orgProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const project = await ctx.db.project.findFirst({
        where: { id: input.projectId, organizationId: ctx.organization.id },
        select: { id: true },
      });
      if (!project) return [];

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const candidates = await ctx.db.taskRequirementSlot.findMany({
        where: {
          dueDate: { not: null, lt: today },
          task: { projectId: input.projectId },
        },
        orderBy: { dueDate: "asc" },
        include: {
          task: { select: { id: true, name: true } },
          approver: { select: { id: true, name: true, email: true, image: true } },
        },
      });

      if (candidates.length === 0) return [];

      const taskIds = Array.from(new Set(candidates.map((c) => c.task.id)));
      const submittalIds = expandFolderIds("submittals");
      const inspectionIds = expandFolderIds("inspections");

      const grouped = await ctx.db.document.groupBy({
        by: ["taskId", "folderId"],
        where: {
          projectId: input.projectId,
          taskId: { in: taskIds },
          folderId: { in: [...submittalIds, ...inspectionIds] },
        },
        _count: { _all: true },
      });

      // count[taskId][kind] = number of docs uploaded under that folder family
      const counts = new Map<string, { submittal: number; inspection: number }>();
      for (const row of grouped) {
        // The where clause constrains taskId/folderId to non-null IN-lists, so guards are belt-and-suspenders.
        if (!row.taskId || !row.folderId) continue;
        const bucket = counts.get(row.taskId) ?? { submittal: 0, inspection: 0 };
        if (submittalIds.includes(row.folderId)) bucket.submittal += row._count._all;
        if (inspectionIds.includes(row.folderId)) bucket.inspection += row._count._all;
        counts.set(row.taskId, bucket);
      }

      return candidates
        .filter((slot) => {
          const c = counts.get(slot.task.id) ?? { submittal: 0, inspection: 0 };
          const filledForKind = slot.kind === "submittal" ? c.submittal : c.inspection;
          return slot.index >= filledForKind;
        })
        .map((slot) => ({
          id: slot.id,
          taskId: slot.task.id,
          taskName: slot.task.name,
          kind: slot.kind as SlotKind,
          index: slot.index,
          name: slot.name,
          dueDate: slot.dueDate!,
          approver: slot.approver,
        }));
    }),

  /**
   * Toggle a document between approved and unapproved. Gated to roles
   * with APPROVE_DOCUMENTS. Notifies the uploader on status change.
   */
  setStatus: orgProcedure
    .input(
      z.object({
        documentId: z.string(),
        approved: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!canApproveDocuments(ctx.membership.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to approve documents",
        });
      }

      const document = await ctx.db.document.findFirst({
        where: { id: input.documentId },
        select: {
          id: true,
          name: true,
          folderId: true,
          uploadedById: true,
          projectId: true,
          project: { select: { organizationId: true } },
        },
      });

      if (!document || document.project.organizationId !== ctx.organization.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Document not found or access denied",
        });
      }

      if (!document.folderId || !APPROVABLE_FOLDER_ID_LIST.includes(document.folderId)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This document type does not require approval",
        });
      }

      const newStatus = input.approved ? "approved" : "unapproved";
      const actor = ctx.session.user;

      const updated = await ctx.db.$transaction(async (tx) => {
        const result = await tx.document.update({
          where: { id: document.id },
          data: {
            approvalStatus: newStatus,
            approvedById: input.approved ? actor.id : null,
            approvedAt: input.approved ? new Date() : null,
          },
          include: {
            approvedBy: { select: { id: true, name: true, email: true } },
          },
        });

        // Notify the uploader (skip self-approvals)
        if (document.uploadedById !== actor.id) {
          const approverName = actor.name ?? actor.email;
          await tx.notification.create({
            data: {
              type: input.approved ? "DOCUMENT_APPROVED" : "DOCUMENT_UNAPPROVED",
              message: input.approved
                ? `${approverName} approved your upload "${document.name}"`
                : `${approverName} marked "${document.name}" as needing review`,
              userId: document.uploadedById,
              organizationId: ctx.organization.id,
              actorId: actor.id,
            },
          });
        }

        return result;
      });

      return {
        id: updated.id,
        approvalStatus: updated.approvalStatus,
        approvedById: updated.approvedById,
        approvedAt: updated.approvedAt,
        approvedBy: updated.approvedBy,
      };
    }),
});

/**
 * Returns the number of slots whose dueDate has passed and which don't yet
 * have an upload covering them. Used by `summary` for the overdue badge.
 */
async function countOverdueSlots(db: PrismaClient, projectId: string): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const candidates = await db.taskRequirementSlot.findMany({
    where: {
      dueDate: { not: null, lt: today },
      task: { projectId },
    },
    select: { id: true, taskId: true, kind: true, index: true },
  });
  if (candidates.length === 0) return 0;

  const taskIds = Array.from(new Set(candidates.map((c) => c.taskId)));
  const submittalIds = expandFolderIds("submittals");
  const inspectionIds = expandFolderIds("inspections");

  const grouped = await db.document.groupBy({
    by: ["taskId", "folderId"],
    where: {
      projectId,
      taskId: { in: taskIds },
      folderId: { in: [...submittalIds, ...inspectionIds] },
    },
    _count: { _all: true },
  });

  const counts = new Map<string, { submittal: number; inspection: number }>();
  for (const row of grouped) {
    if (!row.taskId || !row.folderId) continue;
    const bucket = counts.get(row.taskId) ?? { submittal: 0, inspection: 0 };
    if (submittalIds.includes(row.folderId)) bucket.submittal += row._count._all;
    if (inspectionIds.includes(row.folderId)) bucket.inspection += row._count._all;
    counts.set(row.taskId, bucket);
  }

  return candidates.filter((slot) => {
    const c = counts.get(slot.taskId) ?? { submittal: 0, inspection: 0 };
    const filledForKind = slot.kind === "submittal" ? c.submittal : c.inspection;
    return slot.index >= filledForKind;
  }).length;
}
