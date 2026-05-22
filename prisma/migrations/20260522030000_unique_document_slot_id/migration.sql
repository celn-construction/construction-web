-- Phase 3 hardening — enforce one-document-per-slot at the DB layer.
--
-- The Document.slotId FK introduced in 20260522013529 had no uniqueness
-- guarantee, so two concurrent uploads could race past resolveSlotForUpload
-- (auto-link reads "first empty slot", or stale UI passes the same explicit
-- slotId twice) and both land with the same slotId. gantt.listSlots uses
-- take: 1, so the second doc would silently disappear from the UI even
-- though it still exists in blob storage.
--
-- Safety: if any duplicate bindings slipped in during the window between
-- the FK migration and this one, keep the oldest doc bound to each slot
-- and unbind the rest before adding the constraint.

WITH ranked AS (
    SELECT
        id,
        ROW_NUMBER() OVER (
            PARTITION BY "slotId"
            ORDER BY "createdAt" ASC, id ASC
        ) AS rn
    FROM "Document"
    WHERE "slotId" IS NOT NULL
)
UPDATE "Document"
SET "slotId" = NULL
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

CREATE UNIQUE INDEX "Document_slotId_unique"
ON "Document" ("slotId")
WHERE "slotId" IS NOT NULL;
