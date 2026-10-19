-- Additive local update. Existing polls and vote totals are not changed.
ALTER TABLE "Poll" ADD COLUMN IF NOT EXISTS "creatorReference" VARCHAR(32);
ALTER TABLE "Poll" ADD COLUMN IF NOT EXISTS "deletionStatus" VARCHAR(30) NOT NULL DEFAULT 'NONE';
ALTER TABLE "Poll" ADD COLUMN IF NOT EXISTS "deletionRequestedAt" TIMESTAMP(3);
CREATE UNIQUE INDEX IF NOT EXISTS "Poll_creatorReference_key" ON "Poll"("creatorReference");
