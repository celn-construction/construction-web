-- AddColumn: approval fields on Document
ALTER TABLE "Document" ADD COLUMN "approvalStatus" TEXT NOT NULL DEFAULT 'unapproved';
ALTER TABLE "Document" ADD COLUMN "approvedById" TEXT;
ALTER TABLE "Document" ADD COLUMN "approvedAt" TIMESTAMP(3);

-- AddForeignKey: approvedById references User
ALTER TABLE "Document" ADD CONSTRAINT "Document_approvedById_fkey"
    FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex: speed up the approval queue listing query
CREATE INDEX "Document_projectId_approvalStatus_idx"
    ON "Document"("projectId", "approvalStatus");

-- ReplaceFunction: extend hybrid_document_search to return approval fields.
-- Must DROP first because RETURNS TABLE columns are part of the function signature
-- and CREATE OR REPLACE cannot change the return shape.
DROP FUNCTION IF EXISTS hybrid_document_search(vector, text, text, text[], text, int, int, float);

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
  "approvalStatus" text, "approvedById" text, "approvedAt" timestamptz,
  rank float, total_count bigint,
  uploader_id text, uploader_name text, uploader_email text,
  approver_id text, approver_name text, approver_email text
) LANGUAGE sql STABLE AS $$
  WITH base_ids AS (
    SELECT d.id
    FROM "Document" d
    WHERE d."projectId" = p_project_id
      AND (p_folder_ids IS NULL OR d."folderId" = ANY(p_folder_ids))
      AND (p_link_filter = 'all'
        OR (p_link_filter = 'linked' AND d."taskId" != '')
        OR (p_link_filter = 'unlinked' AND d."taskId" = ''))
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
    d."approvalStatus", d."approvedById", d."approvedAt",
    r.rrf_score AS rank,
    r.total_count,
    u.id AS uploader_id, u.name AS uploader_name, u.email AS uploader_email,
    a.id AS approver_id, a.name AS approver_name, a.email AS approver_email
  FROM ranked r
  JOIN "Document" d ON d.id = r.id
  JOIN "User" u ON u.id = d."uploadedById"
  LEFT JOIN "User" a ON a.id = d."approvedById"
  ORDER BY r.rrf_score DESC;
$$;
