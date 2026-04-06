-- Hybrid search: add tsvector generated column + hybrid search function (vector + keyword + RRF)

-- Wrapper needed because array_to_string is STABLE, but generated columns require IMMUTABLE
CREATE OR REPLACE FUNCTION immutable_array_to_string(arr text[], sep text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT array_to_string(arr, sep);
$$;

-- Generated column auto-populates on INSERT/UPDATE — zero application code
ALTER TABLE "Document" ADD COLUMN "searchVector" tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english',
      coalesce(name, '') || ' ' ||
      coalesce(description, '') || ' ' ||
      coalesce(immutable_array_to_string(tags, ' '), '')
    )
  ) STORED;

CREATE INDEX idx_document_search_vector ON "Document" USING GIN ("searchVector");

-- The hybrid search function: vector + keyword + RRF in one call
CREATE OR REPLACE FUNCTION hybrid_document_search(
  p_query_vector vector(1536),
  p_query_text text,
  p_project_id text,
  p_folder_ids text[] DEFAULT NULL,
  p_link_filter text DEFAULT 'all',
  p_limit int DEFAULT 20,
  p_offset int DEFAULT 0
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
        OR (p_link_filter = 'linked' AND d."taskId" != '')
        OR (p_link_filter = 'unlinked' AND d."taskId" = ''))
  ),
  vec AS (
    SELECT d.id, ROW_NUMBER() OVER (ORDER BY d.embedding <=> p_query_vector) AS vrank
    FROM "Document" d
    WHERE d.id IN (SELECT id FROM base_ids) AND d.embedding IS NOT NULL
    LIMIT 100
  ),
  kw AS (
    SELECT d.id, ROW_NUMBER() OVER (
      ORDER BY ts_rank(d."searchVector", websearch_to_tsquery('english', p_query_text)) DESC
    ) AS krank
    FROM "Document" d
    WHERE d.id IN (SELECT id FROM base_ids)
      AND d."searchVector" @@ websearch_to_tsquery('english', p_query_text)
    LIMIT 100
  ),
  merged AS (
    SELECT
      COALESCE(v.id, k.id) AS id,
      (COALESCE(1.0 / (60 + v.vrank), 0) + COALESCE(1.0 / (60 + k.krank), 0))::float AS rrf_score
    FROM vec v
    FULL OUTER JOIN kw k ON v.id = k.id
  ),
  ranked AS (
    SELECT m.id, m.rrf_score, COUNT(*) OVER() AS total_count
    FROM merged m
    ORDER BY m.rrf_score DESC
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
