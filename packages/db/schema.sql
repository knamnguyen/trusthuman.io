-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "LinkedInAccountStatus" AS ENUM ('ACTIVE', 'CONNECTING', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "AccessType" AS ENUM ('FREE', 'WEEKLY', 'MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "ImportStatus" AS ENUM ('NOT_STARTED', 'RUNNING', 'FINISHED');

-- CreateEnum
CREATE TYPE "BrowserInstanceStatus" AS ENUM ('INITIALIZING', 'RUNNING', 'STOPPED', 'ERROR');

-- CreateEnum
CREATE TYPE "BrowserJobStatus" AS ENUM ('QUEUED', 'RUNNING', 'TERMINATED', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "username" TEXT,
    "primaryEmailAddress" TEXT NOT NULL,
    "imageUrl" TEXT,
    "clerkUserProperties" JSONB,
    "stripeCustomerId" TEXT,
    "accessType" "AccessType" NOT NULL DEFAULT 'FREE',
    "stripeUserProperties" JSONB,
    "dailyAIcomments" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "stripeCustomerId" TEXT,
    "purchasedSlots" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationMember" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrganizationMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LinkedInAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" "LinkedInAccountStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "staticIpId" TEXT,
    "browserProfileId" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "name" TEXT,
    "autocommentEnabled" BOOLEAN NOT NULL DEFAULT false,
    "runDailyAt" TEXT,
    "isRunning" BOOLEAN NOT NULL DEFAULT false,
    "organizationId" TEXT,
    "profileUrl" TEXT,
    "profileSlug" TEXT,
    "registrationStatus" TEXT,

    CONSTRAINT "LinkedInAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfileImportRun" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "urls" TEXT[],
    "status" "ImportStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "urlsSucceeded" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "urlsFailed" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfileImportRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LinkedInProfile" (
    "id" TEXT NOT NULL,
    "linkedinUrl" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "headline" TEXT NOT NULL,
    "urn" TEXT NOT NULL,
    "profilePic" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "connections" INTEGER,
    "followers" INTEGER,
    "email" TEXT,
    "mobileNumber" TEXT,
    "jobTitle" TEXT,
    "companyName" TEXT,
    "companyIndustry" TEXT,
    "companyWebsite" TEXT,
    "companyLinkedin" TEXT,
    "companyFoundedIn" INTEGER,
    "companySize" TEXT,
    "currentJobDuration" TEXT,
    "currentJobDurationInYrs" DOUBLE PRECISION,
    "topSkillsByEndorsements" TEXT,
    "addressCountryOnly" TEXT,
    "addressWithCountry" TEXT,
    "addressWithoutCountry" TEXT,
    "profilePicHighQuality" TEXT,
    "about" TEXT,
    "publicIdentifier" TEXT,
    "openConnection" BOOLEAN,
    "experiences" JSONB,
    "updates" JSONB,
    "skills" JSONB,
    "profilePicAllDimensions" JSONB,
    "educations" JSONB,
    "licenseAndCertificates" JSONB,
    "honorsAndAwards" JSONB,
    "languages" JSONB,
    "volunteerAndAwards" JSONB,
    "verifications" JSONB,
    "promos" JSONB,
    "highlights" JSONB,
    "projects" JSONB,
    "publications" JSONB,
    "patents" JSONB,
    "courses" JSONB,
    "testScores" JSONB,
    "organizations" JSONB,
    "volunteerCauses" JSONB,
    "interests" JSONB,
    "recommendations" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LinkedInProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserComment" (
    "id" TEXT NOT NULL,
    "postUrn" TEXT NOT NULL,
    "postContentHtml" TEXT,
    "hash" TEXT,
    "autoCommentRunId" TEXT,
    "autoCommentError" TEXT,
    "comment" TEXT NOT NULL,
    "urns" TEXT[],
    "userId" TEXT,
    "accountId" TEXT,
    "commentedAt" TIMESTAMP(3),
    "isDuplicate" BOOLEAN NOT NULL DEFAULT false,
    "isAutoCommented" BOOLEAN NOT NULL DEFAULT true,
    "schedulePostAt" TIMESTAMP(3),

    CONSTRAINT "UserComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutoCommentRun" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "liveUrl" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "error" TEXT,
    "status" TEXT NOT NULL,
    "hitlMode" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "AutoCommentRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBrowserState" (
    "userId" TEXT NOT NULL,
    "state" TEXT NOT NULL,

    CONSTRAINT "UserBrowserState_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "TargetList" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TargetList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TargetProfile" (
    "id" TEXT NOT NULL,
    "listId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "profileUrn" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TargetProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlacklistedProfile" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "profileUrn" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlacklistedProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExtensionDeploymentMeta" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExtensionDeploymentMeta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommentStyle" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommentStyle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutoCommentConfig" (
    "accountId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scrollDuration" INTEGER NOT NULL,
    "commentDelay" INTEGER NOT NULL,
    "maxPosts" INTEGER NOT NULL,
    "duplicateWindow" INTEGER NOT NULL,
    "finishListModeEnabled" BOOLEAN NOT NULL,
    "commentAsCompanyEnabled" BOOLEAN NOT NULL,
    "timeFilterEnabled" BOOLEAN NOT NULL,
    "minPostAge" INTEGER,
    "manualApproveEnabled" BOOLEAN NOT NULL,
    "authenticityBoostEnabled" BOOLEAN NOT NULL,
    "targetListId" TEXT,
    "defaultCommentStyle" TEXT,
    "commentStyleId" TEXT,
    "commentProfileName" TEXT,
    "languageAwareEnabled" BOOLEAN NOT NULL,
    "blacklistEnabled" BOOLEAN NOT NULL,
    "skipPromotedPostsEnabled" BOOLEAN NOT NULL,
    "skipFriendActivitiesEnabled" BOOLEAN NOT NULL,
    "skipCompanyPagesEnabled" BOOLEAN NOT NULL,
    "hitlMode" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutoCommentConfig_pkey" PRIMARY KEY ("accountId")
);

-- CreateTable
CREATE TABLE "BrowserInstance" (
    "id" TEXT NOT NULL,
    "hyperbrowserSessionId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "status" "BrowserInstanceStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BrowserInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LinkedInPostPreview" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "s3Key" TEXT NOT NULL,
    "s3Url" TEXT NOT NULL,
    "contentJson" JSONB NOT NULL,
    "contentText" TEXT NOT NULL,
    "title" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LinkedInPostPreview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrowserJob" (
    "id" TEXT NOT NULL,
    "status" "BrowserJobStatus" NOT NULL,
    "accountId" TEXT NOT NULL,
    "error" TEXT,
    "output" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "lastRunAt" TIMESTAMP(3),

    CONSTRAINT "BrowserJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommentAnalysis" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "commentUrl" TEXT NOT NULL,
    "commentText" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "authorHeadline" TEXT,
    "authorProfileUrl" TEXT,
    "avatarS3Key" TEXT,
    "avatarS3Url" TEXT,
    "analysisJson" JSONB NOT NULL,
    "overallScore" DOUBLE PRECISION NOT NULL,
    "aiScore" DOUBLE PRECISION NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommentAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_primaryEmailAddress_key" ON "User"("primaryEmailAddress");

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeCustomerId_key" ON "User"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_stripeCustomerId_key" ON "Organization"("stripeCustomerId");

-- CreateIndex
CREATE INDEX "OrganizationMember_userId_idx" ON "OrganizationMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationMember_orgId_userId_key" ON "OrganizationMember"("orgId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "LinkedInAccount_email_key" ON "LinkedInAccount"("email");

-- CreateIndex
CREATE UNIQUE INDEX "LinkedInAccount_profileSlug_key" ON "LinkedInAccount"("profileSlug");

-- CreateIndex
CREATE UNIQUE INDEX "LinkedInProfile_urn_key" ON "LinkedInProfile"("urn");

-- CreateIndex
CREATE INDEX "UserComment_hash_idx" ON "UserComment"("hash");

-- CreateIndex
CREATE INDEX "UserComment_postUrn_idx" ON "UserComment"("postUrn");

-- CreateIndex
CREATE INDEX "UserComment_commentedAt_idx" ON "UserComment"("commentedAt");

-- CreateIndex
CREATE INDEX "UserComment_urns_idx" ON "UserComment" USING GIN ("urns");

-- CreateIndex
CREATE UNIQUE INDEX "TargetProfile_profileUrn_key" ON "TargetProfile"("profileUrn");

-- CreateIndex
CREATE UNIQUE INDEX "TargetProfile_listId_profileUrn_key" ON "TargetProfile"("listId", "profileUrn");

-- CreateIndex
CREATE UNIQUE INDEX "BlacklistedProfile_accountId_profileUrn_key" ON "BlacklistedProfile"("accountId", "profileUrn");

-- CreateIndex
CREATE UNIQUE INDEX "BrowserInstance_hyperbrowserSessionId_key" ON "BrowserInstance"("hyperbrowserSessionId");

-- CreateIndex
CREATE INDEX "LinkedInPostPreview_userId_idx" ON "LinkedInPostPreview"("userId");

-- CreateIndex
CREATE INDEX "LinkedInPostPreview_createdAt_idx" ON "LinkedInPostPreview"("createdAt");

-- CreateIndex
CREATE INDEX "BrowserJob_status_idx" ON "BrowserJob"("status");

-- CreateIndex
CREATE INDEX "CommentAnalysis_userId_idx" ON "CommentAnalysis"("userId");

-- CreateIndex
CREATE INDEX "CommentAnalysis_createdAt_idx" ON "CommentAnalysis"("createdAt");

-- AddForeignKey
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LinkedInAccount" ADD CONSTRAINT "LinkedInAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LinkedInAccount" ADD CONSTRAINT "LinkedInAccount_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileImportRun" ADD CONSTRAINT "ProfileImportRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserComment" ADD CONSTRAINT "UserComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserComment" ADD CONSTRAINT "UserComment_autoCommentRunId_fkey" FOREIGN KEY ("autoCommentRunId") REFERENCES "AutoCommentRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserComment" ADD CONSTRAINT "UserComment_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "LinkedInAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutoCommentRun" ADD CONSTRAINT "AutoCommentRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutoCommentRun" ADD CONSTRAINT "AutoCommentRun_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "LinkedInAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBrowserState" ADD CONSTRAINT "UserBrowserState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TargetProfile" ADD CONSTRAINT "TargetProfile_listId_fkey" FOREIGN KEY ("listId") REFERENCES "TargetList"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TargetProfile" ADD CONSTRAINT "TargetProfile_profileUrn_fkey" FOREIGN KEY ("profileUrn") REFERENCES "LinkedInProfile"("urn") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlacklistedProfile" ADD CONSTRAINT "BlacklistedProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlacklistedProfile" ADD CONSTRAINT "BlacklistedProfile_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "LinkedInAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentStyle" ADD CONSTRAINT "CommentStyle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutoCommentConfig" ADD CONSTRAINT "AutoCommentConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutoCommentConfig" ADD CONSTRAINT "AutoCommentConfig_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "LinkedInAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutoCommentConfig" ADD CONSTRAINT "AutoCommentConfig_commentStyleId_fkey" FOREIGN KEY ("commentStyleId") REFERENCES "CommentStyle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrowserInstance" ADD CONSTRAINT "BrowserInstance_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "LinkedInAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LinkedInPostPreview" ADD CONSTRAINT "LinkedInPostPreview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrowserJob" ADD CONSTRAINT "BrowserJob_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "LinkedInAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentAnalysis" ADD CONSTRAINT "CommentAnalysis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

