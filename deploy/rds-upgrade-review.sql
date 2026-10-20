-- REVIEW ONLY: compare actual RDS schema with the recorded main schema and test on a restored copy first.
-- Do not run automatically or together with the local incremental SQL files.
BEGIN;

-- CreateEnum
CREATE TYPE "PollScope" AS ENUM ('NATIONAL', 'STATE');

-- AlterTable
ALTER TABLE "Poll" ADD COLUMN     "assemblyId" TEXT,
ADD COLUMN     "categoryType" TEXT NOT NULL DEFAULT 'non-political',
ADD COLUMN     "creatorGuestHash" VARCHAR(64),
ADD COLUMN     "creatorReference" VARCHAR(32),
ADD COLUMN     "deletionRequestedAt" TIMESTAMP(3),
ADD COLUMN     "deletionStatus" VARCHAR(30) NOT NULL DEFAULT 'NONE',
ADD COLUMN     "requiresLogin" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "scope" "PollScope" NOT NULL DEFAULT 'NATIONAL',
ADD COLUMN     "shareCode" VARCHAR(16),
ADD COLUMN     "stateCode" VARCHAR(10),
ADD COLUMN     "termsAcceptedAt" TIMESTAMP(3),
ADD COLUMN     "termsAgreed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "termsVersion" VARCHAR(30),
ADD COLUMN     "topic" VARCHAR(30);

-- AlterTable
ALTER TABLE "Vote" ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "District" ADD COLUMN     "stateCode" VARCHAR(10);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "AssemblyConstituency" (
    "id" TEXT NOT NULL,
    "stateCode" VARCHAR(10) NOT NULL,
    "seatNumber" INTEGER NOT NULL,
    "nameHi" VARCHAR(150) NOT NULL,
    "nameEn" VARCHAR(150),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssemblyConstituency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssemblyDistrict" (
    "assemblyId" TEXT NOT NULL,
    "districtId" TEXT NOT NULL,

    CONSTRAINT "AssemblyDistrict_pkey" PRIMARY KEY ("assemblyId","districtId")
);

-- CreateTable
CREATE TABLE "Article" (
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
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "body" VARCHAR(1000) NOT NULL,
    "href" VARCHAR(500),
    "active" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLimitBucket" (
    "key" VARCHAR(64) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateLimitBucket_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "VoteAttempt" (
    "id" TEXT NOT NULL,
    "pollId" VARCHAR(100),
    "outcome" VARCHAR(30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VoteAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrafficEvent" (
    "id" VARCHAR(36) NOT NULL,
    "path" VARCHAR(500) NOT NULL,
    "referrerHost" VARCHAR(255),
    "deviceType" VARCHAR(20) NOT NULL,
    "sessionHash" VARCHAR(64) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrafficEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE INDEX "AssemblyConstituency_stateCode_nameHi_idx" ON "AssemblyConstituency"("stateCode", "nameHi");

-- CreateIndex
CREATE UNIQUE INDEX "AssemblyConstituency_stateCode_seatNumber_key" ON "AssemblyConstituency"("stateCode", "seatNumber");

-- CreateIndex
CREATE INDEX "AssemblyDistrict_districtId_idx" ON "AssemblyDistrict"("districtId");

-- CreateIndex
CREATE UNIQUE INDEX "Article_slug_key" ON "Article"("slug");

-- CreateIndex
CREATE INDEX "Article_published_publishedAt_idx" ON "Article"("published", "publishedAt");

-- CreateIndex
CREATE INDEX "Announcement_active_createdAt_idx" ON "Announcement"("active", "createdAt");

-- CreateIndex
CREATE INDEX "RateLimitBucket_expiresAt_idx" ON "RateLimitBucket"("expiresAt");

-- CreateIndex
CREATE INDEX "VoteAttempt_createdAt_outcome_idx" ON "VoteAttempt"("createdAt", "outcome");

-- CreateIndex
CREATE INDEX "VoteAttempt_pollId_createdAt_idx" ON "VoteAttempt"("pollId", "createdAt");

-- CreateIndex
CREATE INDEX "TrafficEvent_createdAt_path_idx" ON "TrafficEvent"("createdAt", "path");

-- CreateIndex
CREATE INDEX "TrafficEvent_sessionHash_createdAt_idx" ON "TrafficEvent"("sessionHash", "createdAt");

-- CreateIndex
-- Legacy production contains duplicate slugs; URLs use poll ID, so preserve every slug.
CREATE INDEX "Poll_slug_idx" ON "Poll"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Poll_shareCode_key" ON "Poll"("shareCode");

-- CreateIndex
CREATE UNIQUE INDEX "Poll_creatorReference_key" ON "Poll"("creatorReference");

-- CreateIndex
CREATE INDEX "Poll_scope_stateCode_active_createdAt_idx" ON "Poll"("scope", "stateCode", "active", "createdAt");

-- CreateIndex
CREATE INDEX "Poll_categoryType_idx" ON "Poll"("categoryType");

-- CreateIndex
CREATE INDEX "Poll_requiresLogin_idx" ON "Poll"("requiresLogin");

-- CreateIndex
CREATE INDEX "Poll_assemblyId_idx" ON "Poll"("assemblyId");

-- CreateIndex
CREATE INDEX "Vote_userId_idx" ON "Vote"("userId");

-- AddForeignKey
ALTER TABLE "Poll" ADD CONSTRAINT "Poll_assemblyId_fkey" FOREIGN KEY ("assemblyId") REFERENCES "AssemblyConstituency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssemblyDistrict" ADD CONSTRAINT "AssemblyDistrict_assemblyId_fkey" FOREIGN KEY ("assemblyId") REFERENCES "AssemblyConstituency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssemblyDistrict" ADD CONSTRAINT "AssemblyDistrict_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


ALTER TABLE "Article" ADD COLUMN IF NOT EXISTS "coverImage" VARCHAR(1000);
ALTER TABLE "Article" ADD COLUMN IF NOT EXISTS "coverAlt" VARCHAR(250);
ALTER TABLE "Announcement" ADD COLUMN IF NOT EXISTS "ticker" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Announcement" ADD COLUMN IF NOT EXISTS "tickerOrder" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Announcement" ADD COLUMN IF NOT EXISTS "tickerSpeed" INTEGER NOT NULL DEFAULT 45;

COMMIT;
