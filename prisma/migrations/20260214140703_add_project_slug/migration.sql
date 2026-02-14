-- AlterTable
-- Add slug column as nullable first
ALTER TABLE "Project" ADD COLUMN "slug" TEXT;

-- Backfill slugs from project names
UPDATE "Project" SET "slug" =
  LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(name, '[^\w\s-]', '', 'g'),
        '\s+', '-', 'g'
      ),
      '-+', '-', 'g'
    )
  );

-- Handle potential duplicates by appending organizationId suffix
WITH duplicates AS (
  SELECT
    id,
    "organizationId",
    slug,
    ROW_NUMBER() OVER (PARTITION BY "organizationId", slug ORDER BY "createdAt") as rn
  FROM "Project"
)
UPDATE "Project" p
SET slug = d.slug || '-' || (d.rn - 1)
FROM duplicates d
WHERE p.id = d.id AND d.rn > 1;

-- Now make it NOT NULL
ALTER TABLE "Project" ALTER COLUMN "slug" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Project_organizationId_slug_key" ON "Project"("organizationId", "slug");
