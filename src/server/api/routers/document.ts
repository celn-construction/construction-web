import { z } from "zod";
import { del } from "@vercel/blob";
import { createTRPCRouter, orgProcedure } from "~/server/api/trpc";

export const documentRouter = createTRPCRouter({
  listByFolder: orgProcedure
    .input(
      z.object({
        organizationId: z.string(),
        projectId: z.string(),
        taskId: z.string(),
        folderId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Verify project belongs to organization
      const project = await ctx.db.project.findFirst({
        where: {
          id: input.projectId,
          organizationId: input.organizationId,
        },
      });

      if (!project) {
        return [];
      }

      // Get documents with uploader info
      const documents = await ctx.db.document.findMany({
        where: {
          projectId: input.projectId,
          taskId: input.taskId,
          folderId: input.folderId,
        },
        include: {
          uploadedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return documents;
    }),

  countByTask: orgProcedure
    .input(
      z.object({
        organizationId: z.string(),
        projectId: z.string(),
        taskId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Verify project belongs to organization
      const project = await ctx.db.project.findFirst({
        where: {
          id: input.projectId,
          organizationId: input.organizationId,
        },
      });

      if (!project) {
        return {};
      }

      // Get document counts grouped by folderId
      const documents = await ctx.db.document.findMany({
        where: {
          projectId: input.projectId,
          taskId: input.taskId,
        },
        select: {
          folderId: true,
        },
      });

      // Count documents per folder
      const counts: Record<string, number> = {};
      for (const doc of documents) {
        counts[doc.folderId] = (counts[doc.folderId] || 0) + 1;
      }

      return counts;
    }),

  delete: orgProcedure
    .input(
      z.object({
        documentId: z.string(),
        organizationId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get the document and verify it belongs to a project in the user's organization
      const document = await ctx.db.document.findFirst({
        where: {
          id: input.documentId,
        },
        include: {
          project: {
            select: {
              organizationId: true,
            },
          },
        },
      });

      if (!document || document.project.organizationId !== input.organizationId) {
        throw new Error("Document not found or access denied");
      }

      // Delete from Vercel Blob
      await del(document.blobUrl);

      // Delete from database
      await ctx.db.document.delete({
        where: {
          id: input.documentId,
        },
      });

      return { success: true };
    }),
});
