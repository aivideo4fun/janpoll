-- CreateTable
CREATE TABLE IF NOT EXISTS "RateLimitBucket" (
    "key" VARCHAR(64) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateLimitBucket_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "VoteAttempt" (
    "id" TEXT NOT NULL,
    "pollId" VARCHAR(100),
    "outcome" VARCHAR(30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VoteAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "TrafficEvent" (
    "id" VARCHAR(36) NOT NULL,
    "path" VARCHAR(500) NOT NULL,
    "referrerHost" VARCHAR(255),
    "deviceType" VARCHAR(20) NOT NULL,
    "sessionHash" VARCHAR(64) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrafficEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "RateLimitBucket_expiresAt_idx" ON "RateLimitBucket"("expiresAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "VoteAttempt_createdAt_outcome_idx" ON "VoteAttempt"("createdAt", "outcome");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "VoteAttempt_pollId_createdAt_idx" ON "VoteAttempt"("pollId", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TrafficEvent_createdAt_path_idx" ON "TrafficEvent"("createdAt", "path");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TrafficEvent_sessionHash_createdAt_idx" ON "TrafficEvent"("sessionHash", "createdAt");

