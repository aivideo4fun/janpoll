-- Additive only. Does not rewrite users, votes, or polls.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS mobile VARCHAR(20);
