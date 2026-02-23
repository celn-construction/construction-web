import { z } from "zod";
import { Prisma } from "../../../../generated/prisma";
import { TRPCError } from "@trpc/server";
import { del } from "@vercel/blob";
import { createTRPCRouter, orgProcedure } from "@/server/api/trpc";
import { embedQuery, toVectorSql } from "@/server/services/embeddings";

interface RawDocumentRow {
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
  total_count: bigint;
  uploader_id: string;
  uploader_name: string | null;
  uploader_email: string;
}

function shapeResults(rows: RawDocumentRow[]) {
  return rows.map((r) => ({
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
}

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
      const project = await ctx.db.project.findFirst({
        where: {
          id: input.projectId,
          organizationId: input.organizationId,
        },
      });

      if (!project) {
        return [];
      }

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
      const project = await ctx.db.project.findFirst({
        where: {
          id: input.projectId,
          organizationId: input.organizationId,
        },
      });

      if (!project) {
        return {};
      }

      const documents = await ctx.db.document.findMany({
        where: {
          projectId: input.projectId,
          taskId: input.taskId,
        },
        select: {
          folderId: true,
        },
      });

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
        folderIds: z.array(z.string()).optional(),
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
      const folderFilter = input.folderIds?.length
        ? { folderId: { in: input.folderIds } }
        : {};
      const folderSqlFilter = input.folderIds?.length
        ? Prisma.sql`AND d."folderId" = ANY(${input.folderIds})`
        : Prisma.empty;

      // Empty query: return recent documents
      if (!trimmed) {
        const [results, total] = await Promise.all([
          ctx.db.document.findMany({
            where: { projectId: input.projectId, ...folderFilter },
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
            where: { projectId: input.projectId, ...folderFilter },
          }),
        ]);
        return { results, total };
      }

      // Short queries (< 3 chars): use ILIKE prefix match
      // Trigrams need 3-char windows, so short queries would return garbage
      if (trimmed.length < 3) {
        const prefix = `${trimmed}%`;
        const rows = await ctx.db.$queryRaw<RawDocumentRow[]>`
          SELECT
            d.id, d.name, d."blobUrl", d."mimeType", d.size, d.tags,
            d.description, d."taskId", d."folderId", d."projectId",
            d."uploadedById", d."createdAt",
            1.0::float AS rank,
            COUNT(*) OVER () AS total_count,
            u.id AS uploader_id, u.name AS uploader_name, u.email AS uploader_email
          FROM "Document" d
            JOIN "User" u ON u.id = d."uploadedById"
          WHERE d."projectId" = ${input.projectId}
            AND d.name ILIKE ${prefix}
            ${folderSqlFilter}
          ORDER BY d."createdAt" DESC
          LIMIT ${input.limit} OFFSET ${input.offset}
        `;

        const total = Number(rows[0]?.total_count ?? 0);
        return { results: shapeResults(rows), total };
      }

      // Hybrid fuzzy (pg_trgm) + full-text search
      // Wrap in $transaction so SET LOCAL persists for the query
      const rows = await ctx.db.$transaction(async (tx) => {
        await tx.$executeRaw`SET LOCAL pg_trgm.similarity_threshold = 0.3`;

        return tx.$queryRaw<RawDocumentRow[]>`
          SELECT
            d.id, d.name, d."blobUrl", d."mimeType", d.size, d.tags,
            d.description, d."taskId", d."folderId", d."projectId",
            d."uploadedById", d."createdAt",
            GREATEST(
              s.sim,
              CASE WHEN q.tsq::text != '' AND d.search_vector @@ q.tsq
                THEN ts_rank_cd('{0.1, 0.4, 0.8, 1.0}', d.search_vector, q.tsq)
                ELSE 0
              END
            ) AS rank,
            COUNT(*) OVER () AS total_count,
            u.id AS uploader_id, u.name AS uploader_name, u.email AS uploader_email
          FROM "Document" d
            CROSS JOIN LATERAL (SELECT similarity(d.name, ${trimmed}) AS sim) s
            CROSS JOIN LATERAL (SELECT websearch_to_tsquery('english', ${trimmed}) AS tsq) q
            JOIN "User" u ON u.id = d."uploadedById"
          WHERE d."projectId" = ${input.projectId}
            AND (d.name % ${trimmed} OR (q.tsq::text != '' AND d.search_vector @@ q.tsq))
            ${folderSqlFilter}
          ORDER BY rank DESC
          LIMIT ${input.limit} OFFSET ${input.offset}
        `;
      });

      const total = Number(rows[0]?.total_count ?? 0);
      return { results: shapeResults(rows), total };
    }),

  aiSearch: orgProcedure
    .input(
      z.object({
        organizationId: z.string(),
        projectId: z.string(),
        query: z.string().min(1).max(500),
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().min(0).default(0),
        folderIds: z.array(z.string()).optional(),
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

      const folderSqlFilter = input.folderIds?.length
        ? Prisma.sql`AND d."folderId" = ANY(${input.folderIds})`
        : Prisma.empty;

      // Embed the user's query
      const queryEmbedding = await embedQuery(input.query);
      const vectorSql = toVectorSql(queryEmbedding);

      // Cosine similarity search using pgvector
      const rows = await ctx.db.$queryRaw<RawDocumentRow[]>`
        SELECT
          d.id, d.name, d."blobUrl", d."mimeType", d.size, d.tags,
          d.description, d."taskId", d."folderId", d."projectId",
          d."uploadedById", d."createdAt",
          (1 - (d.embedding <=> ${vectorSql}::vector))::float AS rank,
          COUNT(*) OVER () AS total_count,
          u.id AS uploader_id, u.name AS uploader_name, u.email AS uploader_email
        FROM "Document" d
          JOIN "User" u ON u.id = d."uploadedById"
        WHERE d."projectId" = ${input.projectId}
          AND d.embedding IS NOT NULL
          ${folderSqlFilter}
        ORDER BY d.embedding <=> ${vectorSql}::vector
        LIMIT ${input.limit} OFFSET ${input.offset}
      `;

      const total = Number(rows[0]?.total_count ?? 0);
      return { results: shapeResults(rows), total };
    }),

  delete: orgProcedure
    .input(
      z.object({
        documentId: z.string(),
        organizationId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
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
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Document not found or access denied",
        });
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
