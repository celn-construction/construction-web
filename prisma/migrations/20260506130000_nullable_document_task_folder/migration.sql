-- Make Document.taskId and Document.folderId nullable.
-- A NULL taskId means the document is project-scoped but not yet assigned to a Gantt task ("unassigned").
-- This replaces a previously-aspirational empty-string convention used by buildLinkCondition() and
-- the hybrid_document_search() function.

ALTER TABLE "Document" ALTER COLUMN "taskId" DROP NOT NULL;
ALTER TABLE "Document" ALTER COLUMN "folderId" DROP NOT NULL;

-- Backfill any rows that were stored with the empty-string sentinel.
-- In practice the upload route blocked these from being created, so this is defensive.
UPDATE "Document" SET "taskId" = NULL WHERE "taskId" = '';
UPDATE "Document" SET "folderId" = NULL WHERE "folderId" = '';

-- Recreate hybrid_document_search() to compare with IS NULL / IS NOT NULL instead of = ''.
-- Function signature is unchanged so callers don't need updating.
CREATE OR REPLACE FUNCTION hybrid_document_search(
  p_query_vector vector(1536),
  p_query_text text,
  p_project_id text,
  p_folder_ids text[] DEFAULT NULL,
  p_link_filter text DEFAULT 'all',
  p_limit int DEFAULT 20,
  p_offset int DEFAULT 0,
  p_min_score float DEFAULT 0.015
)
RETURNS TABLE (
  id text, name text, "blobUrl" text, "mimeType" text, size int,
  tags text[], description text, "taskId" text, "folderId" text,
  "projectId" text, "uploadedById" text, "createdAt" timestamptz,
  rank float, total_count bigint,
  uploader_id text, uploader_name text, uploader_email text
) LANGUAGE sql STABLE AS $$
  WITH base_ids AS (
    SELECT d.id
    FROM "Document" d
    WHERE d."projectId" = p_project_id
      AND (p_folder_ids IS NULL OR d."folderId" = ANY(p_folder_ids))
      AND (p_link_filter = 'all'
        OR (p_link_filter = 'linked' AND d."taskId" IS NOT NULL)
        OR (p_link_filter = 'unlinked' AND d."taskId" IS NULL))
  ),
  vec AS (
    SELECT d.id, ROW_NUMBER() OVER (ORDER BY d.embedding <=> p_query_vector) AS vrank
    FROM "Document" d
    WHERE d.id IN (SELECT id FROM base_ids) AND d.embedding IS NOT NULL
    ORDER BY d.embedding <=> p_query_vector
    LIMIT 100
  ),
  kw AS (
    SELECT d.id, ROW_NUMBER() OVER (
      ORDER BY ts_rank(d."searchVector", websearch_to_tsquery('english', p_query_text)) DESC
    ) AS krank
    FROM "Document" d
    WHERE d.id IN (SELECT id FROM base_ids)
      AND d."searchVector" @@ websearch_to_tsquery('english', p_query_text)
    ORDER BY ts_rank(d."searchVector", websearch_to_tsquery('english', p_query_text)) DESC
    LIMIT 100
  ),
  merged AS (
    SELECT
      COALESCE(v.id, k.id) AS id,
      (COALESCE(1.0 / (60 + v.vrank), 0) + COALESCE(1.0 / (60 + k.krank), 0))::float AS rrf_score
    FROM vec v
    FULL OUTER JOIN kw k ON v.id = k.id
  ),
  filtered AS (
    SELECT m.id, m.rrf_score
    FROM merged m
    WHERE m.rrf_score >= p_min_score
      AND m.rrf_score >= (SELECT MAX(rrf_score) FROM merged) * 0.5
  ),
  ranked AS (
    SELECT f.id, f.rrf_score, COUNT(*) OVER() AS total_count
    FROM filtered f
    ORDER BY f.rrf_score DESC
    LIMIT p_limit OFFSET p_offset
  )
  SELECT
    d.id, d.name, d."blobUrl", d."mimeType", d.size, d.tags,
    d.description, d."taskId", d."folderId", d."projectId",
    d."uploadedById", d."createdAt",
    r.rrf_score AS rank,
    r.total_count,
    u.id AS uploader_id, u.name AS uploader_name, u.email AS uploader_email
  FROM ranked r
  JOIN "Document" d ON d.id = r.id
  JOIN "User" u ON u.id = d."uploadedById"
  ORDER BY r.rrf_score DESC;
$$;
