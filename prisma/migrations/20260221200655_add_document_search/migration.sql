-- Delete existing documents (confirmed ok by user)
DELETE FROM "Document";

-- Add description column
ALTER TABLE "Document" ADD COLUMN "description" TEXT NOT NULL;

-- Add search_vector column
ALTER TABLE "Document" ADD COLUMN "search_vector" tsvector;

-- Create GIN index for full-text search
CREATE INDEX "Document_search_vector_idx" ON "Document" USING GIN ("search_vector");

-- Trigger function: rebuilds search_vector on INSERT/UPDATE
CREATE OR REPLACE FUNCTION document_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(array_to_string(NEW.tags, ' '), '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to Document table
CREATE TRIGGER document_search_vector_trigger
  BEFORE INSERT OR UPDATE OF name, description, tags
  ON "Document"
  FOR EACH ROW
  EXECUTE FUNCTION document_search_vector_update();
