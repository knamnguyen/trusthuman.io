-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateTable
CREATE TABLE "HumanVerification" (
    "id" TEXT NOT NULL,
    "trustProfileId" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "faceCount" INTEGER NOT NULL,
    "rawResponse" JSONB,
    "activityType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HumanVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformLink" (
    "id" TEXT NOT NULL,
    "trustProfileId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "profileUrl" TEXT NOT NULL,
    "profileHandle" TEXT NOT NULL,
    "displayName" TEXT,
    "avatarUrl" TEXT,
    "autoDetected" BOOLEAN NOT NULL DEFAULT true,
    "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrustProfile" (
    "id" TEXT NOT NULL,
    "humanNumber" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "displayName" TEXT,
    "avatarUrl" TEXT,
    "bio" VARCHAR(160),
    "totalVerifications" INTEGER NOT NULL DEFAULT 0,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastVerifiedAt" TIMESTAMP(3),
    "lastStreakDate" TIMESTAMP(3),
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "defaultLayout" TEXT NOT NULL DEFAULT 'horizontal',
    "badgeImageStyle" TEXT NOT NULL DEFAULT 'logo',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrustProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "username" TEXT,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerifiedFacebookActivity" (
    "id" TEXT NOT NULL,
    "trustProfileId" TEXT NOT NULL,
    "commentText" TEXT NOT NULL,
    "commentUrl" TEXT,
    "parentUrl" TEXT,
    "parentAuthorName" TEXT NOT NULL,
    "parentAuthorAvatarUrl" TEXT NOT NULL,
    "parentTextSnippet" TEXT NOT NULL,
    "verificationId" TEXT NOT NULL,
    "activityAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerifiedFacebookActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerifiedGitHubActivity" (
    "id" TEXT NOT NULL,
    "trustProfileId" TEXT NOT NULL,
    "commentText" TEXT NOT NULL,
    "commentUrl" TEXT,
    "parentUrl" TEXT,
    "parentAuthorName" TEXT NOT NULL,
    "parentAuthorAvatarUrl" TEXT NOT NULL,
    "parentTextSnippet" TEXT NOT NULL,
    "verificationId" TEXT NOT NULL,
    "activityAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerifiedGitHubActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerifiedHNActivity" (
    "id" TEXT NOT NULL,
    "trustProfileId" TEXT NOT NULL,
    "commentText" TEXT NOT NULL,
    "commentUrl" TEXT,
    "parentUrl" TEXT,
    "parentAuthorName" TEXT NOT NULL,
    "parentAuthorAvatarUrl" TEXT NOT NULL,
    "parentTextSnippet" TEXT NOT NULL,
    "verificationId" TEXT NOT NULL,
    "activityAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerifiedHNActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerifiedLinkedInActivity" (
    "id" TEXT NOT NULL,
    "trustProfileId" TEXT NOT NULL,
    "commentText" TEXT NOT NULL,
    "commentUrl" TEXT,
    "parentUrl" TEXT,
    "parentAuthorName" TEXT NOT NULL,
    "parentAuthorAvatarUrl" TEXT NOT NULL,
    "parentTextSnippet" TEXT NOT NULL,
    "verificationId" TEXT NOT NULL,
    "activityAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerifiedLinkedInActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerifiedPHActivity" (
    "id" TEXT NOT NULL,
    "trustProfileId" TEXT NOT NULL,
    "commentText" TEXT NOT NULL,
    "commentUrl" TEXT,
    "parentUrl" TEXT,
    "parentAuthorName" TEXT NOT NULL,
    "parentAuthorAvatarUrl" TEXT NOT NULL,
    "parentTextSnippet" TEXT NOT NULL,
    "verificationId" TEXT NOT NULL,
    "activityAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerifiedPHActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerifiedRedditActivity" (
    "id" TEXT NOT NULL,
    "trustProfileId" TEXT NOT NULL,
    "commentText" TEXT NOT NULL,
    "commentUrl" TEXT,
    "parentUrl" TEXT,
    "parentAuthorName" TEXT NOT NULL,
    "parentAuthorAvatarUrl" TEXT NOT NULL,
    "parentTextSnippet" TEXT NOT NULL,
    "verificationId" TEXT NOT NULL,
    "activityAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerifiedRedditActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerifiedThreadsActivity" (
    "id" TEXT NOT NULL,
    "trustProfileId" TEXT NOT NULL,
    "commentText" TEXT NOT NULL,
    "commentUrl" TEXT,
    "parentUrl" TEXT,
    "parentAuthorName" TEXT NOT NULL,
    "parentAuthorAvatarUrl" TEXT NOT NULL,
    "parentTextSnippet" TEXT NOT NULL,
    "verificationId" TEXT NOT NULL,
    "activityAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerifiedThreadsActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerifiedXActivity" (
    "id" TEXT NOT NULL,
    "trustProfileId" TEXT NOT NULL,
    "commentText" TEXT NOT NULL,
    "commentUrl" TEXT,
    "parentUrl" TEXT,
    "parentAuthorName" TEXT NOT NULL,
    "parentAuthorAvatarUrl" TEXT NOT NULL,
    "parentTextSnippet" TEXT NOT NULL,
    "verificationId" TEXT NOT NULL,
    "activityAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerifiedXActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HumanVerification_trustProfileId_idx" ON "HumanVerification"("trustProfileId");

-- CreateIndex
CREATE INDEX "HumanVerification_createdAt_idx" ON "HumanVerification"("createdAt");

-- CreateIndex
CREATE INDEX "PlatformLink_platform_profileHandle_idx" ON "PlatformLink"("platform", "profileHandle");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformLink_trustProfileId_platform_key" ON "PlatformLink"("trustProfileId", "platform");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformLink_platform_profileUrl_key" ON "PlatformLink"("platform", "profileUrl");

-- CreateIndex
CREATE UNIQUE INDEX "TrustProfile_humanNumber_key" ON "TrustProfile"("humanNumber");

-- CreateIndex
CREATE UNIQUE INDEX "TrustProfile_userId_key" ON "TrustProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TrustProfile_username_key" ON "TrustProfile"("username");

-- CreateIndex
CREATE INDEX "TrustProfile_userId_idx" ON "TrustProfile"("userId");

-- CreateIndex
CREATE INDEX "TrustProfile_username_idx" ON "TrustProfile"("username");

-- CreateIndex
CREATE INDEX "TrustProfile_humanNumber_idx" ON "TrustProfile"("humanNumber");

-- CreateIndex
CREATE INDEX "TrustProfile_totalVerifications_idx" ON "TrustProfile"("totalVerifications");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "VerifiedFacebookActivity_verificationId_key" ON "VerifiedFacebookActivity"("verificationId");

-- CreateIndex
CREATE INDEX "VerifiedFacebookActivity_trustProfileId_idx" ON "VerifiedFacebookActivity"("trustProfileId");

-- CreateIndex
CREATE INDEX "VerifiedFacebookActivity_createdAt_idx" ON "VerifiedFacebookActivity"("createdAt");

-- CreateIndex
CREATE INDEX "VerifiedFacebookActivity_activityAt_idx" ON "VerifiedFacebookActivity"("activityAt");

-- CreateIndex
CREATE UNIQUE INDEX "VerifiedGitHubActivity_verificationId_key" ON "VerifiedGitHubActivity"("verificationId");

-- CreateIndex
CREATE INDEX "VerifiedGitHubActivity_trustProfileId_idx" ON "VerifiedGitHubActivity"("trustProfileId");

-- CreateIndex
CREATE INDEX "VerifiedGitHubActivity_createdAt_idx" ON "VerifiedGitHubActivity"("createdAt");

-- CreateIndex
CREATE INDEX "VerifiedGitHubActivity_activityAt_idx" ON "VerifiedGitHubActivity"("activityAt");

-- CreateIndex
CREATE UNIQUE INDEX "VerifiedHNActivity_verificationId_key" ON "VerifiedHNActivity"("verificationId");

-- CreateIndex
CREATE INDEX "VerifiedHNActivity_trustProfileId_idx" ON "VerifiedHNActivity"("trustProfileId");

-- CreateIndex
CREATE INDEX "VerifiedHNActivity_createdAt_idx" ON "VerifiedHNActivity"("createdAt");

-- CreateIndex
CREATE INDEX "VerifiedHNActivity_activityAt_idx" ON "VerifiedHNActivity"("activityAt");

-- CreateIndex
CREATE UNIQUE INDEX "VerifiedLinkedInActivity_verificationId_key" ON "VerifiedLinkedInActivity"("verificationId");

-- CreateIndex
CREATE INDEX "VerifiedLinkedInActivity_trustProfileId_idx" ON "VerifiedLinkedInActivity"("trustProfileId");

-- CreateIndex
CREATE INDEX "VerifiedLinkedInActivity_createdAt_idx" ON "VerifiedLinkedInActivity"("createdAt");

-- CreateIndex
CREATE INDEX "VerifiedLinkedInActivity_activityAt_idx" ON "VerifiedLinkedInActivity"("activityAt");

-- CreateIndex
CREATE UNIQUE INDEX "VerifiedPHActivity_verificationId_key" ON "VerifiedPHActivity"("verificationId");

-- CreateIndex
CREATE INDEX "VerifiedPHActivity_trustProfileId_idx" ON "VerifiedPHActivity"("trustProfileId");

-- CreateIndex
CREATE INDEX "VerifiedPHActivity_createdAt_idx" ON "VerifiedPHActivity"("createdAt");

-- CreateIndex
CREATE INDEX "VerifiedPHActivity_activityAt_idx" ON "VerifiedPHActivity"("activityAt");

-- CreateIndex
CREATE UNIQUE INDEX "VerifiedRedditActivity_verificationId_key" ON "VerifiedRedditActivity"("verificationId");

-- CreateIndex
CREATE INDEX "VerifiedRedditActivity_trustProfileId_idx" ON "VerifiedRedditActivity"("trustProfileId");

-- CreateIndex
CREATE INDEX "VerifiedRedditActivity_createdAt_idx" ON "VerifiedRedditActivity"("createdAt");

-- CreateIndex
CREATE INDEX "VerifiedRedditActivity_activityAt_idx" ON "VerifiedRedditActivity"("activityAt");

-- CreateIndex
CREATE UNIQUE INDEX "VerifiedThreadsActivity_verificationId_key" ON "VerifiedThreadsActivity"("verificationId");

-- CreateIndex
CREATE INDEX "VerifiedThreadsActivity_trustProfileId_idx" ON "VerifiedThreadsActivity"("trustProfileId");

-- CreateIndex
CREATE INDEX "VerifiedThreadsActivity_createdAt_idx" ON "VerifiedThreadsActivity"("createdAt");

-- CreateIndex
CREATE INDEX "VerifiedThreadsActivity_activityAt_idx" ON "VerifiedThreadsActivity"("activityAt");

-- CreateIndex
CREATE UNIQUE INDEX "VerifiedXActivity_verificationId_key" ON "VerifiedXActivity"("verificationId");

-- CreateIndex
CREATE INDEX "VerifiedXActivity_trustProfileId_idx" ON "VerifiedXActivity"("trustProfileId");

-- CreateIndex
CREATE INDEX "VerifiedXActivity_createdAt_idx" ON "VerifiedXActivity"("createdAt");

-- CreateIndex
CREATE INDEX "VerifiedXActivity_activityAt_idx" ON "VerifiedXActivity"("activityAt");

-- AddForeignKey
ALTER TABLE "HumanVerification" ADD CONSTRAINT "HumanVerification_trustProfileId_fkey" FOREIGN KEY ("trustProfileId") REFERENCES "TrustProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformLink" ADD CONSTRAINT "PlatformLink_trustProfileId_fkey" FOREIGN KEY ("trustProfileId") REFERENCES "TrustProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrustProfile" ADD CONSTRAINT "TrustProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerifiedFacebookActivity" ADD CONSTRAINT "VerifiedFacebookActivity_trustProfileId_fkey" FOREIGN KEY ("trustProfileId") REFERENCES "TrustProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerifiedFacebookActivity" ADD CONSTRAINT "VerifiedFacebookActivity_verificationId_fkey" FOREIGN KEY ("verificationId") REFERENCES "HumanVerification"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerifiedGitHubActivity" ADD CONSTRAINT "VerifiedGitHubActivity_trustProfileId_fkey" FOREIGN KEY ("trustProfileId") REFERENCES "TrustProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerifiedGitHubActivity" ADD CONSTRAINT "VerifiedGitHubActivity_verificationId_fkey" FOREIGN KEY ("verificationId") REFERENCES "HumanVerification"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerifiedHNActivity" ADD CONSTRAINT "VerifiedHNActivity_trustProfileId_fkey" FOREIGN KEY ("trustProfileId") REFERENCES "TrustProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerifiedHNActivity" ADD CONSTRAINT "VerifiedHNActivity_verificationId_fkey" FOREIGN KEY ("verificationId") REFERENCES "HumanVerification"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerifiedLinkedInActivity" ADD CONSTRAINT "VerifiedLinkedInActivity_trustProfileId_fkey" FOREIGN KEY ("trustProfileId") REFERENCES "TrustProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerifiedLinkedInActivity" ADD CONSTRAINT "VerifiedLinkedInActivity_verificationId_fkey" FOREIGN KEY ("verificationId") REFERENCES "HumanVerification"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerifiedPHActivity" ADD CONSTRAINT "VerifiedPHActivity_trustProfileId_fkey" FOREIGN KEY ("trustProfileId") REFERENCES "TrustProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerifiedPHActivity" ADD CONSTRAINT "VerifiedPHActivity_verificationId_fkey" FOREIGN KEY ("verificationId") REFERENCES "HumanVerification"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerifiedRedditActivity" ADD CONSTRAINT "VerifiedRedditActivity_trustProfileId_fkey" FOREIGN KEY ("trustProfileId") REFERENCES "TrustProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerifiedRedditActivity" ADD CONSTRAINT "VerifiedRedditActivity_verificationId_fkey" FOREIGN KEY ("verificationId") REFERENCES "HumanVerification"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerifiedThreadsActivity" ADD CONSTRAINT "VerifiedThreadsActivity_trustProfileId_fkey" FOREIGN KEY ("trustProfileId") REFERENCES "TrustProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerifiedThreadsActivity" ADD CONSTRAINT "VerifiedThreadsActivity_verificationId_fkey" FOREIGN KEY ("verificationId") REFERENCES "HumanVerification"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerifiedXActivity" ADD CONSTRAINT "VerifiedXActivity_trustProfileId_fkey" FOREIGN KEY ("trustProfileId") REFERENCES "TrustProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerifiedXActivity" ADD CONSTRAINT "VerifiedXActivity_verificationId_fkey" FOREIGN KEY ("verificationId") REFERENCES "HumanVerification"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

