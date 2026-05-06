import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, orgProcedure } from "@/server/api/trpc";
import { canApproveDocuments } from "@/lib/permissions";
import { APPROVABLE_FOLDER_ID_LIST, expandFolderIds } from "@/lib/folders";
import { documentProxyUrl } from "@/lib/blobProxy";

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
   * Review Queue header / sidebar badge.
   */
  summary: orgProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const project = await ctx.db.project.findFirst({
        where: { id: input.projectId, organizationId: ctx.organization.id },
        select: { id: true },
      });
      if (!project) return { pending: 0, approved: 0 };

      const grouped = await ctx.db.document.groupBy({
        by: ["approvalStatus"],
        where: {
          projectId: input.projectId,
          folderId: { in: APPROVABLE_FOLDER_ID_LIST },
        },
        _count: { _all: true },
      });

      let pending = 0;
      let approved = 0;
      for (const row of grouped) {
        if (row.approvalStatus === "approved") approved = row._count._all;
        else if (row.approvalStatus === "unapproved") pending = row._count._all;
      }
      return { pending, approved };
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

      if (!APPROVABLE_FOLDER_ID_LIST.includes(document.folderId)) {
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
