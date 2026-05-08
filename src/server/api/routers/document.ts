import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { del } from "@vercel/blob";
import { createTRPCRouter, orgProcedure } from "@/server/api/trpc";
import { embedQuery, toVectorSql } from "@/server/services/embeddings";
import { expandAcronyms } from "@/lib/constants/constructionAcronyms";
import { documentProxyUrl } from "@/lib/blobProxy";

interface RawDocumentRow {
  id: string;
  name: string;
  blobUrl: string;
  mimeType: string;
  size: number;
  tags: string[];
  description: string;
  taskId: string | null;
  folderId: string | null;
  projectId: string;
  uploadedById: string;
  createdAt: Date;
  rank: number;
  total_count: bigint;
  uploader_id: string;
  uploader_name: string | null;
  uploader_email: string;
}

function toClientBlobUrl<T extends { id: string }>(doc: T): T & { blobUrl: string } {
  return { ...doc, blobUrl: documentProxyUrl(doc.id) };
}

function shapeResults(rows: RawDocumentRow[]) {
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    blobUrl: documentProxyUrl(r.id),
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

const sortBySchema = z
  .enum([
    "createdAt_desc",
    "createdAt_asc",
    "name_asc",
    "name_desc",
    "size_desc",
    "size_asc",
    "relevance",
  ])
  .default("createdAt_desc");

function buildOrderBy(sortBy: z.infer<typeof sortBySchema>) {
  switch (sortBy) {
    case "createdAt_asc":
      return { createdAt: "asc" as const };
    case "name_asc":
      return { name: "asc" as const };
    case "name_desc":
      return { name: "desc" as const };
    case "size_desc":
      return { size: "desc" as const };
    case "size_asc":
      return { size: "asc" as const };
    default:
      return { createdAt: "desc" as const };
  }
}

function buildLinkCondition(linkFilter: z.infer<typeof linkFilterSchema>) {
  if (linkFilter === "linked") return { taskId: { not: null } };
  if (linkFilter === "unlinked") return { taskId: null };
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

      return documents.map(toClientBlobUrl);
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

      const documents = await ctx.db.document.findMany({
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

      return documents.map(toClientBlobUrl);
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
        sortBy: sortBySchema,
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
      const orderBy = buildOrderBy(input.sortBy);

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
            orderBy,
            take: input.limit,
            skip: input.offset,
          }),
          ctx.db.document.count({ where }),
        ]);
        return { results: results.map(toClientBlobUrl), total };
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
          orderBy,
          take: input.limit,
          skip: input.offset,
        }),
        ctx.db.document.count({ where }),
      ]);

      return { results: results.map(toClientBlobUrl), total };
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
        sortBy: sortBySchema,
      })
    )
    .query(async ({ ctx, input }) => {
      const project = await ctx.db.project.findFirst({
        where: { id: input.projectId, organizationId: ctx.organization.id },
      });
      if (!project) return { results: [], total: 0 };

      // Non-relevance sort: fall back to standard Prisma query (avoids modifying the SQL function)
      if (input.sortBy !== "relevance" && input.sortBy !== "createdAt_desc") {
        const folderFilter = input.folderIds?.length
          ? { folderId: { in: input.folderIds } }
          : {};
        const linkCondition = buildLinkCondition(input.linkFilter);
        const where = {
          projectId: input.projectId,
          ...folderFilter,
          ...linkCondition,
          OR: [
            { name: { contains: input.query, mode: "insensitive" as const } },
            { description: { contains: input.query, mode: "insensitive" as const } },
          ],
        };
        const [results, total] = await Promise.all([
          ctx.db.document.findMany({
            where,
            include: { uploadedBy: { select: { id: true, name: true, email: true } } },
            orderBy: buildOrderBy(input.sortBy),
            take: input.limit,
            skip: input.offset,
          }),
          ctx.db.document.count({ where }),
        ]);
        return { results: results.map(toClientBlobUrl), total };
      }

      const queryEmbedding = await embedQuery(input.query);
      const vectorSql = toVectorSql(queryEmbedding);
      const keywordQuery = expandAcronyms(input.query);

      const rows = await ctx.db.$queryRaw<RawDocumentRow[]>`
        SELECT * FROM hybrid_document_search(
          ${vectorSql}::vector,
          ${keywordQuery},
          ${input.projectId},
          ${input.folderIds ?? null}::text[],
          ${input.linkFilter},
          ${input.limit}::int,
          ${input.offset}::int
        )
      `;

      const total = Number(rows[0]?.total_count ?? 0);
      return { results: shapeResults(rows), total };
    }),

  countUnassigned: orgProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const project = await ctx.db.project.findFirst({
        where: { id: input.projectId, organizationId: ctx.organization.id },
        select: { id: true },
      });
      if (!project) return 0;
      return ctx.db.document.count({
        where: { projectId: input.projectId, taskId: null },
      });
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
