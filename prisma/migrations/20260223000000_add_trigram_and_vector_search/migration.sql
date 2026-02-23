-- Trigram fuzzy search on document names
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX "Document_name_trgm_idx" ON "Document" USING GIN ("name" gin_trgm_ops);

-- Vector embeddings for semantic search
CREATE EXTENSION IF NOT EXISTS vector;
ALTER TABLE "Document" ADD COLUMN "embedding" vector(1024);
