import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { del } from "@vercel/blob";
import type { PrismaClient, Prisma } from "../../../../generated/prisma";
import { createTRPCRouter, orgProcedure } from "@/server/api/trpc";
import { embedQuery, toVectorSql } from "@/server/services/embeddings";
import { expandAcronyms } from "@/lib/constants/constructionAcronyms";
import { documentProxyUrl } from "@/lib/blobProxy";

interface LinkedTask {
  id: string;
  name: string;
  csiCode: string | null;
}

/**
 * Document.taskId references GanttTask without a Prisma relation, so we resolve
 * the linked task name + CSI code with a single batched lookup and attach it to
 * each result. Used by both the fuzzy and AI search paths so the explorer cards
 * can show "linked to <task>" and the CSI filter has something to read from.
 */
async function attachTasks<T extends { taskId: string | null }>(
  db: PrismaClient,
  projectId: string,
  results: T[],
): Promise<(T & { task: LinkedTask | null })[]> {
  const taskIds = [
    ...new Set(results.map((r) => r.taskId).filter((id): id is string => !!id)),
  ];
  if (taskIds.length === 0) {
    return results.map((r) => ({ ...r, task: null }));
  }
  const tasks = await db.ganttTask.findMany({
    where: { id: { in: taskIds }, projectId },
    select: { id: true, name: true, csiCode: true },
  });
  const byId = new Map<string, LinkedTask>(tasks.map((t) => [t.id, t]));
  return results.map((r) => ({
    ...r,
    task: r.taskId ? (byId.get(r.taskId) ?? null) : null,
  }));
}

const advancedFilterSchema = {
  taskId: z.string().optional(),
  csiCode: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
};

type AdvancedFilterInput = {
  taskId?: string;
  csiCode?: string;
  dateFrom?: string;
  dateTo?: string;
};

/**
 * Builds the Prisma `where` fragment for the Task / CSI code / Date-uploaded
 * filters. CSI code lives on GanttTask, so it resolves matching task ids first
 * and filters documents by `taskId IN (...)`. A sentinel id guarantees an empty
 * result when a CSI code matches no tasks (rather than silently dropping it).
 */
async function buildAdvancedFilters(
  db: PrismaClient,
  projectId: string,
  input: AdvancedFilterInput,
): Promise<Prisma.DocumentWhereInput> {
  const where: Prisma.DocumentWhereInput = {};

  if (input.dateFrom || input.dateTo) {
    const createdAt: Prisma.DateTimeFilter = {};
    if (input.dateFrom) createdAt.gte = new Date(input.dateFrom);
    if (input.dateTo) {
      const end = new Date(input.dateTo);
      end.setHours(23, 59, 59, 999);
      createdAt.lte = end;
    }
    where.createdAt = createdAt;
  }

  if (input.csiCode) {
    const tasks = await db.ganttTask.findMany({
      where: { projectId, csiCode: input.csiCode },
      select: { id: true },
    });
    const csiTaskIds = tasks.map((t) => t.id);
    if (input.taskId) {
      // Both Task and CSI selected: keep the task only if it carries the code.
      where.taskId = csiTaskIds.includes(input.taskId) ? input.taskId : "__none__";
    } else {
      where.taskId = { in: csiTaskIds.length ? csiTaskIds : ["__none__"] };
    }
  } else if (input.taskId) {
    where.taskId = input.taskId;
  }

  return where;
}

function hasAdvancedFilters(input: AdvancedFilterInput): boolean {
  return !!(input.taskId || input.csiCode || input.dateFrom || input.dateTo);
}

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
  approvalStatus: string;
  approvedById: string | null;
  approvedAt: Date | null;
  rank: number;
  total_count: bigint;
  uploader_id: string;
  uploader_name: string | null;
  uploader_email: string;
  approver_id: string | null;
  approver_name: string | null;
  approver_email: string | null;
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
    approvalStatus: r.approvalStatus,
    approvedById: r.approvedById,
    approvedAt: r.approvedAt,
    rank: r.rank,
    uploadedBy: {
      id: r.uploader_id,
      name: r.uploader_name,
      email: r.uploader_email,
    },
    approvedBy: r.approver_id
      ? {
          id: r.approver_id,
          name: r.approver_name,
          email: r.approver_email ?? "",
        }
      : null,
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
          approvedBy: {
            select: { id: true, name: true, email: true },
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
          approvedBy: {
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
        by: ["folderId", "approvalStatus"],
        where: {
          projectId: input.projectId,
          taskId: input.taskId,
        },
        _count: { _all: true },
      });

      const result: Record<string, { total: number; approved: number }> = {};
      for (const row of grouped) {
        if (!row.folderId) continue;
        const bucket = result[row.folderId] ?? { total: 0, approved: 0 };
        bucket.total += row._count._all;
        if (row.approvalStatus === "approved") bucket.approved += row._count._all;
        result[row.folderId] = bucket;
      }
      return result;
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
        ...advancedFilterSchema,
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
      const advanced = await buildAdvancedFilters(ctx.db, input.projectId, input);
      const orderBy = buildOrderBy(input.sortBy);

      // Case-insensitive contains match on document name (skipped when empty)
      const nameFilter = trimmed
        ? { name: { contains: trimmed, mode: "insensitive" as const } }
        : {};

      const where = {
        projectId: input.projectId,
        ...nameFilter,
        ...folderFilter,
        ...linkCondition,
        ...advanced,
      };

      const [results, total] = await Promise.all([
        ctx.db.document.findMany({
          where,
          include: {
            uploadedBy: {
              select: { id: true, name: true, email: true },
            },
            approvedBy: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy,
          take: input.limit,
          skip: input.offset,
        }),
        ctx.db.document.count({ where }),
      ]);

      return {
        results: await attachTasks(ctx.db, input.projectId, results.map(toClientBlobUrl)),
        total,
      };
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
        ...advancedFilterSchema,
      })
    )
    .query(async ({ ctx, input }) => {
      const project = await ctx.db.project.findFirst({
        where: { id: input.projectId, organizationId: ctx.organization.id },
      });
      if (!project) return { results: [], total: 0 };

      // The hybrid SQL function doesn't understand non-default sorts or the
      // Task/CSI/Date filters, so fall back to a standard Prisma query in those
      // cases (avoids modifying the SQL function / a migration).
      const needsFallback =
        (input.sortBy !== "relevance" && input.sortBy !== "createdAt_desc") ||
        hasAdvancedFilters(input);

      if (needsFallback) {
        const folderFilter = input.folderIds?.length
          ? { folderId: { in: input.folderIds } }
          : {};
        const linkCondition = buildLinkCondition(input.linkFilter);
        const advanced = await buildAdvancedFilters(ctx.db, input.projectId, input);
        const where = {
          projectId: input.projectId,
          ...folderFilter,
          ...linkCondition,
          ...advanced,
          OR: [
            { name: { contains: input.query, mode: "insensitive" as const } },
            { description: { contains: input.query, mode: "insensitive" as const } },
          ],
        };
        const [results, total] = await Promise.all([
          ctx.db.document.findMany({
            where,
            include: {
              uploadedBy: { select: { id: true, name: true, email: true } },
              approvedBy: { select: { id: true, name: true, email: true } },
            },
            orderBy: buildOrderBy(input.sortBy),
            take: input.limit,
            skip: input.offset,
          }),
          ctx.db.document.count({ where }),
        ]);
        return {
          results: await attachTasks(ctx.db, input.projectId, results.map(toClientBlobUrl)),
          total,
        };
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
      return {
        results: await attachTasks(ctx.db, input.projectId, shapeResults(rows)),
        total,
      };
    }),

  // Options for the Task / CSI-code filter dropdowns: only tasks that actually
  // have at least one document, so the filters never offer an empty result.
  filterOptions: orgProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const project = await ctx.db.project.findFirst({
        where: { id: input.projectId, organizationId: ctx.organization.id },
        select: { id: true },
      });
      if (!project) return { tasks: [], csiCodes: [] };

      const grouped = await ctx.db.document.groupBy({
        by: ["taskId"],
        where: { projectId: input.projectId, taskId: { not: null } },
      });
      const taskIds = grouped
        .map((g) => g.taskId)
        .filter((id): id is string => !!id);

      if (taskIds.length === 0) return { tasks: [], csiCodes: [] };

      const tasks = await ctx.db.ganttTask.findMany({
        where: { id: { in: taskIds }, projectId: input.projectId },
        select: { id: true, name: true, csiCode: true },
        orderBy: { name: "asc" },
      });

      const csiCodes = [
        ...new Set(
          tasks
            .map((t) => t.csiCode)
            .filter((c): c is string => !!c),
        ),
      ].sort();

      return { tasks, csiCodes };
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
