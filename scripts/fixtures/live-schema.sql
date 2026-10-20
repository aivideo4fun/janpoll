-- CreateTable
CREATE TABLE "Poll" (
    "id" TEXT NOT NULL,
    "slug" VARCHAR(500),
    "question" VARCHAR(500) NOT NULL,
    "creatorName" VARCHAR(100),
    "creatorEmail" VARCHAR(255),
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "creatorIp" VARCHAR(45),
    "deadlineDays" INTEGER NOT NULL DEFAULT 3,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "districtName" VARCHAR(100),
    "samitiName" VARCHAR(100),
    "gramPanchayatName" VARCHAR(100),
    "gramPanchayatId" TEXT,
    "electionType" VARCHAR(50) DEFAULT 'sarpanch',
    "districtId" TEXT,
    "samitiId" TEXT,
    "samitiWardId" TEXT,
    "zilaWardId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Poll_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PollOption" (
    "id" TEXT NOT NULL,
    "pollId" TEXT NOT NULL,
    "text" VARCHAR(255) NOT NULL,
    "voteCount" INTEGER NOT NULL DEFAULT 0,
    "order" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PollOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vote" (
    "id" TEXT NOT NULL,
    "pollId" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "anonymousUserId" VARCHAR(100) NOT NULL,
    "ipAddress" VARCHAR(45),
    "deviceSig" VARCHAR(64),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactMessage" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "whatsapp" VARCHAR(20),
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "District" (
    "id" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameHi" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "District_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ZilaParishadWard" (
    "id" TEXT NOT NULL,
    "wardNo" INTEGER NOT NULL,
    "nameHi" TEXT NOT NULL,
    "districtId" TEXT NOT NULL,

    CONSTRAINT "ZilaParishadWard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tehsil" (
    "id" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameHi" TEXT NOT NULL,
    "districtId" TEXT NOT NULL,

    CONSTRAINT "Tehsil_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PanchayatSamiti" (
    "id" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameHi" TEXT NOT NULL,
    "districtId" TEXT NOT NULL,
    "tehsilId" TEXT,

    CONSTRAINT "PanchayatSamiti_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SamitiWard" (
    "id" TEXT NOT NULL,
    "wardNo" INTEGER NOT NULL,
    "nameHi" TEXT NOT NULL,
    "samitiId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SamitiWard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Village" (
    "id" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameHi" TEXT NOT NULL,
    "wardId" TEXT NOT NULL,

    CONSTRAINT "Village_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GramPanchayat" (
    "id" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameHi" TEXT NOT NULL,
    "districtId" TEXT NOT NULL,
    "samitiId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GramPanchayat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsletterSubscriber" (
    "id" TEXT NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NewsletterSubscriber_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Poll_active_idx" ON "Poll"("active");

-- CreateIndex
CREATE INDEX "Poll_createdAt_idx" ON "Poll"("createdAt");

-- CreateIndex
CREATE INDEX "Poll_districtName_idx" ON "Poll"("districtName");

-- CreateIndex
CREATE INDEX "Poll_samitiName_idx" ON "Poll"("samitiName");

-- CreateIndex
CREATE INDEX "Poll_gramPanchayatName_idx" ON "Poll"("gramPanchayatName");

-- CreateIndex
CREATE INDEX "Poll_gramPanchayatId_idx" ON "Poll"("gramPanchayatId");

-- CreateIndex
CREATE INDEX "Poll_electionType_idx" ON "Poll"("electionType");

-- CreateIndex
CREATE INDEX "Poll_districtId_idx" ON "Poll"("districtId");

-- CreateIndex
CREATE INDEX "Poll_samitiId_idx" ON "Poll"("samitiId");

-- CreateIndex
CREATE INDEX "Poll_samitiWardId_idx" ON "Poll"("samitiWardId");

-- CreateIndex
CREATE INDEX "Poll_zilaWardId_idx" ON "Poll"("zilaWardId");

-- CreateIndex
CREATE INDEX "PollOption_pollId_idx" ON "PollOption"("pollId");

-- CreateIndex
CREATE INDEX "Vote_pollId_ipAddress_idx" ON "Vote"("pollId", "ipAddress");

-- CreateIndex
CREATE INDEX "Vote_pollId_idx" ON "Vote"("pollId");

-- CreateIndex
CREATE INDEX "Vote_optionId_idx" ON "Vote"("optionId");

-- CreateIndex
CREATE INDEX "Vote_anonymousUserId_idx" ON "Vote"("anonymousUserId");

-- CreateIndex
CREATE INDEX "Vote_createdAt_idx" ON "Vote"("createdAt");

-- CreateIndex
CREATE INDEX "Vote_pollId_createdAt_idx" ON "Vote"("pollId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Vote_pollId_anonymousUserId_key" ON "Vote"("pollId", "anonymousUserId");

-- CreateIndex
CREATE INDEX "ContactMessage_createdAt_idx" ON "ContactMessage"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "District_nameEn_key" ON "District"("nameEn");

-- CreateIndex
CREATE INDEX "District_nameEn_idx" ON "District"("nameEn");

-- CreateIndex
CREATE INDEX "ZilaParishadWard_districtId_idx" ON "ZilaParishadWard"("districtId");

-- CreateIndex
CREATE UNIQUE INDEX "ZilaParishadWard_districtId_wardNo_key" ON "ZilaParishadWard"("districtId", "wardNo");

-- CreateIndex
CREATE INDEX "Tehsil_districtId_idx" ON "Tehsil"("districtId");

-- CreateIndex
CREATE UNIQUE INDEX "Tehsil_districtId_nameEn_key" ON "Tehsil"("districtId", "nameEn");

-- CreateIndex
CREATE INDEX "PanchayatSamiti_districtId_idx" ON "PanchayatSamiti"("districtId");

-- CreateIndex
CREATE INDEX "PanchayatSamiti_tehsilId_idx" ON "PanchayatSamiti"("tehsilId");

-- CreateIndex
CREATE UNIQUE INDEX "PanchayatSamiti_districtId_nameEn_key" ON "PanchayatSamiti"("districtId", "nameEn");

-- CreateIndex
CREATE INDEX "SamitiWard_samitiId_idx" ON "SamitiWard"("samitiId");

-- CreateIndex
CREATE UNIQUE INDEX "SamitiWard_samitiId_wardNo_key" ON "SamitiWard"("samitiId", "wardNo");

-- CreateIndex
CREATE INDEX "Village_wardId_idx" ON "Village"("wardId");

-- CreateIndex
CREATE UNIQUE INDEX "Village_wardId_nameEn_key" ON "Village"("wardId", "nameEn");

-- CreateIndex
CREATE INDEX "GramPanchayat_districtId_idx" ON "GramPanchayat"("districtId");

-- CreateIndex
CREATE INDEX "GramPanchayat_samitiId_idx" ON "GramPanchayat"("samitiId");

-- CreateIndex
CREATE UNIQUE INDEX "GramPanchayat_samitiId_nameEn_key" ON "GramPanchayat"("samitiId", "nameEn");

-- CreateIndex
CREATE UNIQUE INDEX "NewsletterSubscriber_email_key" ON "NewsletterSubscriber"("email");

-- CreateIndex
CREATE INDEX "NewsletterSubscriber_createdAt_idx" ON "NewsletterSubscriber"("createdAt");

-- AddForeignKey
ALTER TABLE "Poll" ADD CONSTRAINT "Poll_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Poll" ADD CONSTRAINT "Poll_samitiId_fkey" FOREIGN KEY ("samitiId") REFERENCES "PanchayatSamiti"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Poll" ADD CONSTRAINT "Poll_samitiWardId_fkey" FOREIGN KEY ("samitiWardId") REFERENCES "SamitiWard"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Poll" ADD CONSTRAINT "Poll_zilaWardId_fkey" FOREIGN KEY ("zilaWardId") REFERENCES "ZilaParishadWard"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PollOption" ADD CONSTRAINT "PollOption_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "Poll"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "Poll"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "PollOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ZilaParishadWard" ADD CONSTRAINT "ZilaParishadWard_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tehsil" ADD CONSTRAINT "Tehsil_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PanchayatSamiti" ADD CONSTRAINT "PanchayatSamiti_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PanchayatSamiti" ADD CONSTRAINT "PanchayatSamiti_tehsilId_fkey" FOREIGN KEY ("tehsilId") REFERENCES "Tehsil"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SamitiWard" ADD CONSTRAINT "SamitiWard_samitiId_fkey" FOREIGN KEY ("samitiId") REFERENCES "PanchayatSamiti"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Village" ADD CONSTRAINT "Village_wardId_fkey" FOREIGN KEY ("wardId") REFERENCES "SamitiWard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GramPanchayat" ADD CONSTRAINT "GramPanchayat_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GramPanchayat" ADD CONSTRAINT "GramPanchayat_samitiId_fkey" FOREIGN KEY ("samitiId") REFERENCES "PanchayatSamiti"("id") ON DELETE CASCADE ON UPDATE CASCADE;

