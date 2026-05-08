-- Backfill migration for GanttTask requirements fields. These columns were
-- added to schema.prisma in PR #73 without a corresponding migration, so
-- environments that bootstrap via `prisma migrate deploy` are missing them.
ALTER TABLE "GanttTask" ADD COLUMN "requiredSubmittals" INTEGER;
ALTER TABLE "GanttTask" ADD COLUMN "requiredInspections" INTEGER;
