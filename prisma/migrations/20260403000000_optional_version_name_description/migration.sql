-- AlterTable
ALTER TABLE "ScheduleVersion" ALTER COLUMN "name" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ScheduleVersion" ADD COLUMN "description" TEXT;
