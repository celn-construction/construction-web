-- Drop lingering search_vector trigger, index, and column (left from prior drift)
DROP TRIGGER IF EXISTS document_search_vector_trigger ON "Document";
DROP FUNCTION IF EXISTS document_search_vector_update();
DROP INDEX IF EXISTS "Document_search_vector_idx";
ALTER TABLE "Document" DROP COLUMN IF EXISTS search_vector;

-- Null out all existing embeddings (incompatible with new model/dimensions)
UPDATE "Document" SET embedding = NULL;

-- Change embedding column from vector(1024) to vector(1536) for OpenAI text-embedding-3-small
ALTER TABLE "Document" ALTER COLUMN embedding TYPE vector(1536) USING NULL;
