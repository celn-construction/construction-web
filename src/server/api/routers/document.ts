import { z } from "zod";
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

const linkFilterSchema = z.enum(["all", "linked", "unlinked"]).default("all");

function buildLinkCondition(linkFilter: z.infer<typeof linkFilterSchema>) {
  if (linkFilter === "linked") return { taskId: { not: "" } };
  if (linkFilter === "unlinked") return { taskId: "" };
  return {};
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
        projectId: z.string(),
        taskId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const project = await ctx.db.project.findFirst({
        where: {
          id: input.projectId,
          organizationId: ctx.organization.id,
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

      const grouped = await ctx.db.document.groupBy({
        by: ["folderId"],
        where: {
          projectId: input.projectId,
          taskId: input.taskId,
        },
        _count: { folderId: true },
      });

      return Object.fromEntries(
        grouped.map((g) => [g.folderId, g._count.folderId])
      );
    }),

  search: orgProcedure
    .input(
      z.object({
        projectId: z.string(),
        query: z.string().max(200),
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().min(0).default(0),
        folderIds: z.array(z.string()).optional(),
        linkFilter: linkFilterSchema,
      })
    )
    .query(async ({ ctx, input }) => {
      const project = await ctx.db.project.findFirst({
        where: {
          id: input.projectId,
          organizationId: ctx.organization.id,
        },
      });

      if (!project) {
        return { results: [], total: 0 };
      }

      const trimmed = input.query.trim();
      const folderFilter = input.folderIds?.length
        ? { folderId: { in: input.folderIds } }
        : {};
      const linkCondition = buildLinkCondition(input.linkFilter);

      // Empty query: return recent documents
      if (!trimmed) {
        const where = { projectId: input.projectId, ...folderFilter, ...linkCondition };
        const [results, total] = await Promise.all([
          ctx.db.document.findMany({
            where,
            include: {
              uploadedBy: {
                select: { id: true, name: true, email: true },
              },
            },
            orderBy: { createdAt: "desc" },
            take: input.limit,
            skip: input.offset,
          }),
          ctx.db.document.count({ where }),
        ]);
        return { results, total };
      }

      // Case-insensitive contains match on document name
      const where = {
        projectId: input.projectId,
        name: { contains: trimmed, mode: "insensitive" as const },
        ...folderFilter,
        ...linkCondition,
      };

      const [results, total] = await Promise.all([
        ctx.db.document.findMany({
          where,
          include: {
            uploadedBy: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { createdAt: "desc" },
          take: input.limit,
          skip: input.offset,
        }),
        ctx.db.document.count({ where }),
      ]);

      return { results, total };
    }),

  aiSearch: orgProcedure
    .input(
      z.object({
        projectId: z.string(),
        query: z.string().min(1).max(500),
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().min(0).default(0),
        folderIds: z.array(z.string()).optional(),
        linkFilter: linkFilterSchema,
      })
    )
    .query(async ({ ctx, input }) => {
      const project = await ctx.db.project.findFirst({
        where: {
          id: input.projectId,
          organizationId: ctx.organization.id,
        },
      });

      if (!project) {
        return { results: [], total: 0 };
      }

      // Embed the user's query
      const queryEmbedding = await embedQuery(input.query);
      const vectorSql = toVectorSql(queryEmbedding);

      // Two branches for folderIds to avoid Prisma.empty (which breaks $queryRaw parameter numbering).
      // linkFilter is passed as a parameterized value — PostgreSQL evaluates the matching branch.
      const rows = input.folderIds?.length
        ? await ctx.db.$queryRaw<RawDocumentRow[]>`
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
              AND d."folderId" = ANY(${input.folderIds})
              AND (${input.linkFilter} = 'all'
                OR (${input.linkFilter} = 'linked' AND d."taskId" != '')
                OR (${input.linkFilter} = 'unlinked' AND d."taskId" = ''))
            ORDER BY d.embedding <=> ${vectorSql}::vector
            LIMIT ${input.limit} OFFSET ${input.offset}
          `
        : await ctx.db.$queryRaw<RawDocumentRow[]>`
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
              AND (${input.linkFilter} = 'all'
                OR (${input.linkFilter} = 'linked' AND d."taskId" != '')
                OR (${input.linkFilter} = 'unlinked' AND d."taskId" = ''))
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
