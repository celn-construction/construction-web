-- Phase 3 — Slot ↔ Document FK binding
--
-- Replaces positional slot↔doc pairing (slot N matched upload N) with an
-- explicit FK on Document.slotId. After this migration:
--   - Documents in submittal/inspection folders may point to a specific slot.
--   - Backfill preserves the visible pairings the UI showed before: for each
--     (task, kind), the i-th oldest document (by createdAt) binds to slot
--     index i.
--   - Tasks whose requiredSubmittals/requiredInspections were set but whose
--     slot rows were never lazily backfilled by gantt.listSlots get their
--     missing rows created here so the doc↔slot join can find them.
--   - ON DELETE SET NULL on the FK means deleting a slot does NOT delete its
--     bound document — the doc just becomes unbound (slotId = NULL), same as
--     an excess upload with no slot.

-- 1) Schema: add nullable slotId, FK to TaskRequirementSlot, and index.
ALTER TABLE "Document" ADD COLUMN "slotId" TEXT;

ALTER TABLE "Document"
    ADD CONSTRAINT "Document_slotId_fkey"
    FOREIGN KEY ("slotId") REFERENCES "TaskRequirementSlot"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Document_slotId_idx" ON "Document"("slotId");

-- 2) Pre-create any slot rows implied by the legacy count columns but not
--    yet materialized. Phase 1 introduced TaskRequirementSlot and populated
--    rows lazily on first read via gantt.listSlots; tasks no one has opened
--    the popover/drawer for since then only have count integers.
INSERT INTO "TaskRequirementSlot" ("id", "taskId", "kind", "index", "name", "createdAt", "updatedAt")
SELECT
    gen_random_uuid()::text,
    t.id,
    'submittal',
    gs.idx,
    NULL,
    NOW(),
    NOW()
FROM "GanttTask" t
CROSS JOIN LATERAL generate_series(0, t."requiredSubmittals" - 1) AS gs(idx)
WHERE t."requiredSubmittals" IS NOT NULL
  AND t."requiredSubmittals" > 0
  AND NOT EXISTS (
    SELECT 1 FROM "TaskRequirementSlot" trs
    WHERE trs."taskId" = t.id AND trs.kind = 'submittal'
  );

INSERT INTO "TaskRequirementSlot" ("id", "taskId", "kind", "index", "name", "createdAt", "updatedAt")
SELECT
    gen_random_uuid()::text,
    t.id,
    'inspection',
    gs.idx,
    NULL,
    NOW(),
    NOW()
FROM "GanttTask" t
CROSS JOIN LATERAL generate_series(0, t."requiredInspections" - 1) AS gs(idx)
WHERE t."requiredInspections" IS NOT NULL
  AND t."requiredInspections" > 0
  AND NOT EXISTS (
    SELECT 1 FROM "TaskRequirementSlot" trs
    WHERE trs."taskId" = t.id AND trs.kind = 'inspection'
  );

-- 3) Positional backfill: pair existing docs to slots by upload order. Kind
--    is derived from folder family (matches the drawer's view, which is the
--    inclusive one). For each (task, kind), the i-th oldest doc binds to
--    slot at index i. Excess docs (more docs than slots) stay unbound.
WITH classified_docs AS (
    SELECT
        d.id AS doc_id,
        d."taskId",
        d."createdAt",
        CASE
            WHEN d."folderId" IN ('submittals', 'submittals-product', 'submittals-shop', 'submittals-certs')
                THEN 'submittal'
            WHEN d."folderId" IN ('inspections', 'inspections-structural', 'inspections-mep', 'inspections-safety')
                THEN 'inspection'
        END AS kind
    FROM "Document" d
    WHERE d."taskId" IS NOT NULL
      AND d."folderId" IN (
        'submittals', 'submittals-product', 'submittals-shop', 'submittals-certs',
        'inspections', 'inspections-structural', 'inspections-mep', 'inspections-safety'
      )
),
ranked_docs AS (
    SELECT
        doc_id,
        "taskId",
        kind,
        ROW_NUMBER() OVER (
            PARTITION BY "taskId", kind
            ORDER BY "createdAt" ASC, doc_id ASC
        ) - 1 AS pos
    FROM classified_docs
)
UPDATE "Document"
SET "slotId" = pairs.slot_id
FROM (
    SELECT rd.doc_id, trs.id AS slot_id
    FROM ranked_docs rd
    JOIN "TaskRequirementSlot" trs
      ON trs."taskId" = rd."taskId"
     AND trs.kind = rd.kind
     AND trs.index = rd.pos
) pairs
WHERE "Document".id = pairs.doc_id;
