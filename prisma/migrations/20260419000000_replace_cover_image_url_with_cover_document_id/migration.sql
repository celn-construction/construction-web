-- AddColumn
ALTER TABLE "GanttTask" ADD COLUMN "coverDocumentId" TEXT;

-- AddForeignKey
ALTER TABLE "GanttTask" ADD CONSTRAINT "GanttTask_coverDocumentId_fkey" FOREIGN KEY ("coverDocumentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- NOTE: "coverImageUrl" is intentionally left in place here to keep this migration
-- additive (see claudedocs/vercel.md PR Checklist: "Migration is additive").
-- It is now an unused column. A follow-up migration can DROP it once we have
-- verified that no rows in preview/production still reference it and that all
-- associated Vercel Blob objects have been reconciled.
