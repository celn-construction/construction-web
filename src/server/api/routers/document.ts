import { z } from "zod";
import { del } from "@vercel/blob";
import { createTRPCRouter, orgProcedure } from "@/server/api/trpc";

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

  listByTask: orgProcedure
    .input(
      z.object({
        organizationId: z.string(),
        projectId: z.string(),
        taskId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const project = await ctx.db.project.findFirst({
        where: {
          id: input.projectId,
          organizationId: input.organizationId,
        },
      });

      if (!project) {
        return [];
      }

      return ctx.db.document.findMany({
        where: {
          projectId: input.projectId,
          taskId: input.taskId,
        },
        include: {
          uploadedBy: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });
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

  search: orgProcedure
    .input(
      z.object({
        organizationId: z.string(),
        projectId: z.string(),
        query: z.string().max(200),
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const project = await ctx.db.project.findFirst({
        where: {
          id: input.projectId,
          organizationId: input.organizationId,
        },
      });

      if (!project) {
        return { results: [], total: 0 };
      }

      const trimmed = input.query.trim();

      // Empty query: return recent documents
      if (!trimmed) {
        const [results, total] = await Promise.all([
          ctx.db.document.findMany({
            where: { projectId: input.projectId },
            include: {
              uploadedBy: {
                select: { id: true, name: true, email: true },
              },
            },
            orderBy: { createdAt: "desc" },
            take: input.limit,
            skip: input.offset,
          }),
          ctx.db.document.count({
            where: { projectId: input.projectId },
          }),
        ]);
        return { results, total };
      }

      // Full-text search with ranking
      const results = await ctx.db.$queryRaw<
        Array<{
          id: string;
          name: string;
          blobUrl: string;
          mimeType: string;
          size: number;
          tags: string[];
          description: string;
          taskId: string;
          folderId: string;
          projectId: string;
          uploadedById: string;
          createdAt: Date;
          rank: number;
          uploader_id: string;
          uploader_name: string | null;
          uploader_email: string;
        }>
      >`
        SELECT
          d.id,
          d.name,
          d."blobUrl",
          d."mimeType",
          d.size,
          d.tags,
          d.description,
          d."taskId",
          d."folderId",
          d."projectId",
          d."uploadedById",
          d."createdAt",
          ts_rank_cd('{0.1, 0.4, 0.8, 1.0}', d.search_vector, query) AS rank,
          u.id AS uploader_id,
          u.name AS uploader_name,
          u.email AS uploader_email
        FROM
          "Document" d
          JOIN "User" u ON u.id = d."uploadedById",
          websearch_to_tsquery('english', ${trimmed}) query
        WHERE
          d."projectId" = ${input.projectId}
          AND d.search_vector @@ query
        ORDER BY rank DESC
        LIMIT ${input.limit}
        OFFSET ${input.offset}
      `;

      const countResult = await ctx.db.$queryRaw<
        Array<{ count: bigint }>
      >`
        SELECT COUNT(*) as count
        FROM "Document" d,
             websearch_to_tsquery('english', ${trimmed}) query
        WHERE d."projectId" = ${input.projectId}
          AND d.search_vector @@ query
      `;

      const total = Number(countResult[0]?.count ?? 0);

      const shaped = results.map((r) => ({
        id: r.id,
        name: r.name,
        blobUrl: r.blobUrl,
        mimeType: r.mimeType,
        size: r.size,
        tags: r.tags,
        description: r.description,
        taskId: r.taskId,
        folderId: r.folderId,
        projectId: r.projectId,
        uploadedById: r.uploadedById,
        createdAt: r.createdAt,
        rank: r.rank,
        uploadedBy: {
          id: r.uploader_id,
          name: r.uploader_name,
          email: r.uploader_email,
        },
      }));

      return { results: shaped, total };
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
