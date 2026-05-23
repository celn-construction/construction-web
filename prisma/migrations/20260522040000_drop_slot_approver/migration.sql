-- Drop the per-slot approver feature: the FK, its index, and the column.
ALTER TABLE "TaskRequirementSlot" DROP CONSTRAINT IF EXISTS "TaskRequirementSlot_approverId_fkey";
DROP INDEX IF EXISTS "TaskRequirementSlot_approverId_idx";
ALTER TABLE "TaskRequirementSlot" DROP COLUMN IF EXISTS "approverId";
