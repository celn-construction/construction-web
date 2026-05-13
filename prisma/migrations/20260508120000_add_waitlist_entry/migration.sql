-- Backfills the WaitlistEntry table that was added to schema.prisma in PR #40
-- without an accompanying migration. The /api/waitlist route has been calling
-- into a non-existent table since then.
--
-- IF NOT EXISTS is intentional: some shared local dev databases may already
-- have this table from a stray `prisma db push` run, while production and
-- preview Neon DBs do not. The defensive form lets this migration apply
-- cleanly to either state without per-workspace `prisma migrate resolve` toil.

-- CreateTable
CREATE TABLE IF NOT EXISTS "WaitlistEntry" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WaitlistEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "WaitlistEntry_email_key" ON "WaitlistEntry"("email");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "WaitlistEntry_email_idx" ON "WaitlistEntry"("email");
