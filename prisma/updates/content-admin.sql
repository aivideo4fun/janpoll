-- AlterTable
ALTER TABLE "Poll" ADD COLUMN IF NOT EXISTS "creatorGuestHash" VARCHAR(64);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Article" (
    "id" TEXT NOT NULL,
    "slug" VARCHAR(160) NOT NULL,
    "title" VARCHAR(250) NOT NULL,
    "author" VARCHAR(120) NOT NULL,
    "summary" VARCHAR(600) NOT NULL,
    "content" TEXT NOT NULL,
    "sources" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Announcement" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "body" VARCHAR(1000) NOT NULL,
    "href" VARCHAR(500),
    "active" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Article_slug_key" ON "Article"("slug");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Article_published_publishedAt_idx" ON "Article"("published", "publishedAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Announcement_active_createdAt_idx" ON "Announcement"("active", "createdAt");

