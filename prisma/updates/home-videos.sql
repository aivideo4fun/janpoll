-- Additive, PostgreSQL only. Does not modify Poll, Vote, Article or users.
BEGIN;
CREATE TABLE IF NOT EXISTS "HomeVideo" (
  "id" TEXT PRIMARY KEY,
  "title" VARCHAR(180) NOT NULL,
  "videoId" VARCHAR(11) NOT NULL,
  "description" VARCHAR(600) NOT NULL DEFAULT '',
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "published" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HomeVideo_videoId_format" CHECK ("videoId" ~ '^[A-Za-z0-9_-]{11}$')
);
CREATE INDEX IF NOT EXISTS "HomeVideo_published_sortOrder_idx" ON "HomeVideo" ("published", "sortOrder");
COMMIT;
