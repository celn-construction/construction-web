-- Adds the TaskRequirementSlot table for per-slot metadata (name, due date, approver).
-- Existing GanttTask.requiredSubmittals / requiredInspections columns remain as
-- denormalized count fields and are kept in sync by the application's setSlotCount
-- mutation. Slot rows are lazily backfilled from the legacy counts on first read,
-- so no destructive data migration is needed here.

CREATE TABLE "TaskRequirementSlot" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "name" TEXT,
    "dueDate" TIMESTAMP(3),
    "approverId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskRequirementSlot_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TaskRequirementSlot_taskId_kind_index_key"
    ON "TaskRequirementSlot"("taskId", "kind", "index");

CREATE INDEX "TaskRequirementSlot_taskId_kind_idx"
    ON "TaskRequirementSlot"("taskId", "kind");

CREATE INDEX "TaskRequirementSlot_approverId_idx"
    ON "TaskRequirementSlot"("approverId");

CREATE INDEX "TaskRequirementSlot_dueDate_idx"
    ON "TaskRequirementSlot"("dueDate");

ALTER TABLE "TaskRequirementSlot"
    ADD CONSTRAINT "TaskRequirementSlot_taskId_fkey"
    FOREIGN KEY ("taskId") REFERENCES "GanttTask"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TaskRequirementSlot"
    ADD CONSTRAINT "TaskRequirementSlot_approverId_fkey"
    FOREIGN KEY ("approverId") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
