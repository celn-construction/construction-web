-- CreateEnum
CREATE TYPE "ProjectTemplate" AS ENUM ('BLANK');

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "calendarId" TEXT NOT NULL DEFAULT 'general',
ADD COLUMN     "calendars" JSONB,
ADD COLUMN     "daysPerMonth" INTEGER NOT NULL DEFAULT 20,
ADD COLUMN     "daysPerWeek" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "hoursPerDay" INTEGER NOT NULL DEFAULT 24,
ADD COLUMN     "startDate" TIMESTAMP(3),
ADD COLUMN     "template" "ProjectTemplate" NOT NULL DEFAULT 'BLANK';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "activeProjectId" TEXT;

-- CreateTable
CREATE TABLE "GanttTask" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "parentId" TEXT,
    "name" TEXT NOT NULL,
    "percentDone" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "duration" DOUBLE PRECISION,
    "durationUnit" TEXT NOT NULL DEFAULT 'day',
    "effort" DOUBLE PRECISION,
    "effortUnit" TEXT,
    "expanded" BOOLEAN NOT NULL DEFAULT false,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "manuallyScheduled" BOOLEAN NOT NULL DEFAULT false,
    "constraintType" TEXT,
    "constraintDate" TIMESTAMP(3),
    "rollup" BOOLEAN NOT NULL DEFAULT false,
    "cls" TEXT,
    "iconCls" TEXT,
    "note" TEXT,
    "baselines" JSONB,

    CONSTRAINT "GanttTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GanttDependency" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "fromTaskId" TEXT NOT NULL,
    "toTaskId" TEXT NOT NULL,
    "type" INTEGER NOT NULL DEFAULT 2,
    "lag" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lagUnit" TEXT,
    "cls" TEXT,

    CONSTRAINT "GanttDependency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GanttResource" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT,
    "calendar" TEXT,
    "image" TEXT,

    CONSTRAINT "GanttResource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GanttAssignment" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "units" DOUBLE PRECISION NOT NULL DEFAULT 100,

    CONSTRAINT "GanttAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GanttTimeRange" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "duration" DOUBLE PRECISION,
    "durationUnit" TEXT,
    "cls" TEXT,

    CONSTRAINT "GanttTimeRange_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GanttTask_projectId_idx" ON "GanttTask"("projectId");

-- CreateIndex
CREATE INDEX "GanttTask_projectId_parentId_idx" ON "GanttTask"("projectId", "parentId");

-- CreateIndex
CREATE INDEX "GanttTask_parentId_idx" ON "GanttTask"("parentId");

-- CreateIndex
CREATE INDEX "GanttDependency_projectId_idx" ON "GanttDependency"("projectId");

-- CreateIndex
CREATE INDEX "GanttDependency_fromTaskId_idx" ON "GanttDependency"("fromTaskId");

-- CreateIndex
CREATE INDEX "GanttDependency_toTaskId_idx" ON "GanttDependency"("toTaskId");

-- CreateIndex
CREATE INDEX "GanttResource_projectId_idx" ON "GanttResource"("projectId");

-- CreateIndex
CREATE INDEX "GanttAssignment_projectId_idx" ON "GanttAssignment"("projectId");

-- CreateIndex
CREATE INDEX "GanttAssignment_taskId_idx" ON "GanttAssignment"("taskId");

-- CreateIndex
CREATE INDEX "GanttAssignment_resourceId_idx" ON "GanttAssignment"("resourceId");

-- CreateIndex
CREATE UNIQUE INDEX "GanttAssignment_taskId_resourceId_key" ON "GanttAssignment"("taskId", "resourceId");

-- CreateIndex
CREATE INDEX "GanttTimeRange_projectId_idx" ON "GanttTimeRange"("projectId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_activeProjectId_fkey" FOREIGN KEY ("activeProjectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GanttTask" ADD CONSTRAINT "GanttTask_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GanttTask" ADD CONSTRAINT "GanttTask_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "GanttTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GanttDependency" ADD CONSTRAINT "GanttDependency_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GanttDependency" ADD CONSTRAINT "GanttDependency_fromTaskId_fkey" FOREIGN KEY ("fromTaskId") REFERENCES "GanttTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GanttDependency" ADD CONSTRAINT "GanttDependency_toTaskId_fkey" FOREIGN KEY ("toTaskId") REFERENCES "GanttTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GanttResource" ADD CONSTRAINT "GanttResource_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GanttAssignment" ADD CONSTRAINT "GanttAssignment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GanttAssignment" ADD CONSTRAINT "GanttAssignment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "GanttTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GanttAssignment" ADD CONSTRAINT "GanttAssignment_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "GanttResource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GanttTimeRange" ADD CONSTRAINT "GanttTimeRange_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
