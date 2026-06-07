import { TRPCError } from "@trpc/server";
import { createTRPCRouter, projectProcedure } from "@/server/api/trpc";
import { canManageProjects } from "@/lib/permissions";
import { documentProxyUrl } from "@/lib/blobProxy";
import {
  getCsiSpecSchema,
  attachCsiSpecSchema,
  detachCsiSpecSchema,
} from "@/lib/validations/csiSpec";

// Shape a Document into the client `PreviewDoc` form (proxied blobUrl). CSI spec
// docs are unassigned, so folderId is normalized to "".
const docInclude = {
  uploadedBy: { select: { id: true, name: true, email: true } },
  approvedBy: { select: { id: true, name: true, email: true } },
} as const;

interface ShapeableDoc {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  createdAt: Date;
  folderId: string | null;
  approvalStatus: string;
  approvedAt: Date | null;
  uploadedBy: { id: string; name: string | null; email: string } | null;
  approvedBy: { id: string; name: string | null; email: string } | null;
}

function shapeDoc(doc: ShapeableDoc) {
  return {
    id: doc.id,
    name: doc.name,
    blobUrl: documentProxyUrl(doc.id),
    mimeType: doc.mimeType,
    size: doc.size,
    createdAt: doc.createdAt,
    folderId: doc.folderId ?? "",
    approvalStatus: doc.approvalStatus,
    approvedAt: doc.approvedAt,
    uploadedBy: doc.uploadedBy,
    approvedBy: doc.approvedBy,
  };
}

export const csiSpecRouter = createTRPCRouter({
  // The spec document linked to a (project, csiCode), or null.
  getForCode: projectProcedure
    .input(getCsiSpecSchema)
    .query(async ({ ctx, input }) => {
      const link = await ctx.db.csiSpecDocument.findUnique({
        where: {
          projectId_csiCode: { projectId: ctx.project.id, csiCode: input.csiCode },
        },
        include: { document: { include: docInclude } },
      });
      return link ? shapeDoc(link.document) : null;
    }),

  // All CSI codes in the project that currently have a spec document attached.
  // Used to render "has document" indicators across the picker tree.
  listForProject: projectProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db.csiSpecDocument.findMany({
      where: { projectId: ctx.project.id },
      select: { csiCode: true },
    });
    return rows.map((r) => r.csiCode);
  }),

  // Link an already-uploaded document to a CSI code. Replaces any existing link
  // for that code (the previously linked document stays in the explorer).
  attach: projectProcedure
    .input(attachCsiSpecSchema)
    .mutation(async ({ ctx, input }) => {
      if (!canManageProjects(ctx.projectMember.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to attach CSI documents",
        });
      }

      const document = await ctx.db.document.findFirst({
        where: { id: input.documentId, projectId: ctx.project.id },
        include: docInclude,
      });
      if (!document) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Document not found" });
      }

      await ctx.db.$transaction(async (tx) => {
        // Clear any existing link for this code, and any prior link for this
        // document, so the unique constraints can't collide.
        await tx.csiSpecDocument.deleteMany({
          where: {
            OR: [
              { projectId: ctx.project.id, csiCode: input.csiCode },
              { documentId: input.documentId },
            ],
          },
        });
        await tx.csiSpecDocument.create({
          data: {
            projectId: ctx.project.id,
            csiCode: input.csiCode,
            documentId: input.documentId,
          },
        });
      });

      return shapeDoc(document);
    }),

  // Unlink the document from a CSI code (the document itself is kept).
  detach: projectProcedure
    .input(detachCsiSpecSchema)
    .mutation(async ({ ctx, input }) => {
      if (!canManageProjects(ctx.projectMember.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to remove CSI documents",
        });
      }
      await ctx.db.csiSpecDocument.deleteMany({
        where: { projectId: ctx.project.id, csiCode: input.csiCode },
      });
      return { success: true };
    }),
});
