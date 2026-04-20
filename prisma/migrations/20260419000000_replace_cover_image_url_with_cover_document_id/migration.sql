-- DropColumn
ALTER TABLE "GanttTask" DROP COLUMN "coverImageUrl";

-- AddColumn
ALTER TABLE "GanttTask" ADD COLUMN "coverDocumentId" TEXT;

-- AddForeignKey
ALTER TABLE "GanttTask" ADD CONSTRAINT "GanttTask_coverDocumentId_fkey" FOREIGN KEY ("coverDocumentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;
