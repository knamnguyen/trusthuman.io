-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateTable
CREATE TABLE "HumanVerification" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "trustProfileId" TEXT,
    "verified" BOOLEAN NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "faceCount" INTEGER NOT NULL,
    "rawResponse" JSONB,
    "photoS3Key" TEXT,
    "activityType" TEXT NOT NULL,
    "linkedinCommentId" TEXT,
    "xCommentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HumanVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformLink" (
    "id" TEXT NOT NULL,
    "trustProfileId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "profileUrl" TEXT NOT NULL,
    "profileHandle" TEXT,
    "displayName" TEXT,
    "avatarUrl" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT true,
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrustProfile" (
    "id" TEXT NOT NULL,
    "humanNumber" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "displayName" TEXT,
    "bio" VARCHAR(280),
    "avatarUrl" TEXT,
    "totalVerifications" INTEGER NOT NULL DEFAULT 0,
    "lastVerifiedAt" TIMESTAMP(3),
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "streakFreezeTokens" INTEGER NOT NULL DEFAULT 0,
    "lastStreakDate" TIMESTAMP(3),
    "referralCode" TEXT NOT NULL,
    "referredById" TEXT,
    "referralCount" INTEGER NOT NULL DEFAULT 0,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "cameraMode" TEXT NOT NULL DEFAULT 'capture_on_submit',
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
CREATE TABLE "VerifiedLinkedInComment" (
    "id" TEXT NOT NULL,
    "trustProfileId" TEXT NOT NULL,
    "commentText" TEXT NOT NULL,
    "commentUrn" TEXT,
    "postUrl" TEXT NOT NULL,
    "postUrn" TEXT,
    "postAuthorName" TEXT,
    "postAuthorProfileUrl" TEXT,
    "postAuthorUrn" TEXT,
    "postAuthorAvatarUrl" TEXT,
    "postAuthorHeadline" TEXT,
    "postTextSnippet" VARCHAR(500),
    "postImageUrl" TEXT,
    "scrapedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerifiedLinkedInComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerifiedXComment" (
    "id" TEXT NOT NULL,
    "trustProfileId" TEXT NOT NULL,
    "replyText" TEXT NOT NULL,
    "replyTweetId" TEXT,
    "tweetUrl" TEXT NOT NULL,
    "tweetId" TEXT,
    "conversationId" TEXT,
    "tweetAuthorName" TEXT,
    "tweetAuthorHandle" TEXT,
    "tweetAuthorProfileUrl" TEXT,
    "tweetAuthorAvatarUrl" TEXT,
    "tweetAuthorBio" VARCHAR(280),
    "tweetTextSnippet" VARCHAR(500),
    "tweetImageUrl" TEXT,
    "scrapedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerifiedXComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HumanVerification_linkedinCommentId_key" ON "HumanVerification"("linkedinCommentId");

-- CreateIndex
CREATE UNIQUE INDEX "HumanVerification_xCommentId_key" ON "HumanVerification"("xCommentId");

-- CreateIndex
CREATE INDEX "HumanVerification_userId_idx" ON "HumanVerification"("userId");

-- CreateIndex
CREATE INDEX "HumanVerification_trustProfileId_idx" ON "HumanVerification"("trustProfileId");

-- CreateIndex
CREATE INDEX "HumanVerification_activityType_idx" ON "HumanVerification"("activityType");

-- CreateIndex
CREATE INDEX "HumanVerification_createdAt_idx" ON "HumanVerification"("createdAt");

-- CreateIndex
CREATE INDEX "PlatformLink_trustProfileId_idx" ON "PlatformLink"("trustProfileId");

-- CreateIndex
CREATE INDEX "PlatformLink_platform_profileUrl_idx" ON "PlatformLink"("platform", "profileUrl");

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
CREATE UNIQUE INDEX "TrustProfile_referralCode_key" ON "TrustProfile"("referralCode");

-- CreateIndex
CREATE INDEX "TrustProfile_userId_idx" ON "TrustProfile"("userId");

-- CreateIndex
CREATE INDEX "TrustProfile_username_idx" ON "TrustProfile"("username");

-- CreateIndex
CREATE INDEX "TrustProfile_humanNumber_idx" ON "TrustProfile"("humanNumber");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "VerifiedLinkedInComment_trustProfileId_idx" ON "VerifiedLinkedInComment"("trustProfileId");

-- CreateIndex
CREATE INDEX "VerifiedLinkedInComment_postUrn_idx" ON "VerifiedLinkedInComment"("postUrn");

-- CreateIndex
CREATE INDEX "VerifiedLinkedInComment_createdAt_idx" ON "VerifiedLinkedInComment"("createdAt");

-- CreateIndex
CREATE INDEX "VerifiedXComment_trustProfileId_idx" ON "VerifiedXComment"("trustProfileId");

-- CreateIndex
CREATE INDEX "VerifiedXComment_tweetId_idx" ON "VerifiedXComment"("tweetId");

-- CreateIndex
CREATE INDEX "VerifiedXComment_conversationId_idx" ON "VerifiedXComment"("conversationId");

-- CreateIndex
CREATE INDEX "VerifiedXComment_createdAt_idx" ON "VerifiedXComment"("createdAt");

-- AddForeignKey
ALTER TABLE "HumanVerification" ADD CONSTRAINT "HumanVerification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HumanVerification" ADD CONSTRAINT "HumanVerification_trustProfileId_fkey" FOREIGN KEY ("trustProfileId") REFERENCES "TrustProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HumanVerification" ADD CONSTRAINT "HumanVerification_linkedinCommentId_fkey" FOREIGN KEY ("linkedinCommentId") REFERENCES "VerifiedLinkedInComment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HumanVerification" ADD CONSTRAINT "HumanVerification_xCommentId_fkey" FOREIGN KEY ("xCommentId") REFERENCES "VerifiedXComment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformLink" ADD CONSTRAINT "PlatformLink_trustProfileId_fkey" FOREIGN KEY ("trustProfileId") REFERENCES "TrustProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrustProfile" ADD CONSTRAINT "TrustProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrustProfile" ADD CONSTRAINT "TrustProfile_referredById_fkey" FOREIGN KEY ("referredById") REFERENCES "TrustProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerifiedLinkedInComment" ADD CONSTRAINT "VerifiedLinkedInComment_trustProfileId_fkey" FOREIGN KEY ("trustProfileId") REFERENCES "TrustProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerifiedXComment" ADD CONSTRAINT "VerifiedXComment_trustProfileId_fkey" FOREIGN KEY ("trustProfileId") REFERENCES "TrustProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

