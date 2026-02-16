-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "BrowserInstanceStatus" AS ENUM ('INITIALIZING', 'RUNNING', 'STOPPED', 'ERROR');

-- CreateEnum
CREATE TYPE "BrowserJobStatus" AS ENUM ('QUEUED', 'RUNNING', 'TERMINATED', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "CommentStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'QUEUED', 'POSTING', 'POSTED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LinkedInAccountStatus" AS ENUM ('DISABLED', 'REGISTERED', 'CONNECTING', 'CONNECTED');

-- CreateEnum
CREATE TYPE "ImportStatus" AS ENUM ('NOT_STARTED', 'RUNNING', 'FINISHED');

-- CreateEnum
CREATE TYPE "SocialPlatform" AS ENUM ('X', 'LINKEDIN', 'THREADS', 'FACEBOOK');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('VERIFYING', 'VERIFIED', 'FAILED', 'REVOKED');

-- CreateEnum
CREATE TYPE "AwardType" AS ENUM ('EARNED_DAYS', 'STRIPE_CREDIT');

-- CreateEnum
CREATE TYPE "TargetListStatus" AS ENUM ('BUILDING', 'COMPLETED');

-- CreateEnum
CREATE TYPE "BuildTargetListJobStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "LinkedInAnalyticsDaily" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "followers" INTEGER NOT NULL,
    "invites" INTEGER NOT NULL,
    "comments" INTEGER NOT NULL,
    "contentReach" INTEGER NOT NULL,
    "profileViews" INTEGER NOT NULL,
    "engageReach" INTEGER NOT NULL,

    CONSTRAINT "LinkedInAnalyticsDaily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserEmailPreferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weeklyAnalyticsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "unsubscribedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserEmailPreferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBrowserState" (
    "userId" TEXT NOT NULL,
    "state" TEXT NOT NULL,

    CONSTRAINT "UserBrowserState_pkey" PRIMARY KEY ("userId")
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
CREATE TABLE "AutoCommentRun" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "liveUrl" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "error" TEXT,
    "status" TEXT NOT NULL,
    "hitlMode" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT,

    CONSTRAINT "AutoCommentRun_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "CommentGenerateSetting" (
    "accountId" TEXT NOT NULL,
    "commentStyleId" TEXT,
    "dynamicChooseStyleEnabled" BOOLEAN NOT NULL DEFAULT false,
    "adjacentCommentsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommentGenerateSetting_pkey" PRIMARY KEY ("accountId")
);

-- CreateTable
CREATE TABLE "CommentStyle" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "maxWords" INTEGER DEFAULT 100,
    "creativity" DOUBLE PRECISION DEFAULT 1.0,

    CONSTRAINT "CommentStyle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostLoadSetting" (
    "accountId" TEXT NOT NULL,
    "targetListEnabled" BOOLEAN NOT NULL DEFAULT false,
    "targetListIds" TEXT[],
    "discoverySetEnabled" BOOLEAN NOT NULL DEFAULT false,
    "discoverySetIds" TEXT[],
    "timeFilterEnabled" BOOLEAN NOT NULL DEFAULT false,
    "minPostAge" INTEGER,
    "skipFriendActivitiesEnabled" BOOLEAN NOT NULL DEFAULT false,
    "skipCompanyPagesEnabled" BOOLEAN NOT NULL DEFAULT true,
    "skipPromotedPostsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "skipBlacklistEnabled" BOOLEAN NOT NULL DEFAULT false,
    "blacklistId" TEXT,
    "skipFirstDegree" BOOLEAN NOT NULL DEFAULT false,
    "skipSecondDegree" BOOLEAN NOT NULL DEFAULT false,
    "skipThirdDegree" BOOLEAN NOT NULL DEFAULT false,
    "skipFollowing" BOOLEAN NOT NULL DEFAULT false,
    "skipCommentsLoading" BOOLEAN NOT NULL DEFAULT true,
    "skipIfUserCommented" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PostLoadSetting_pkey" PRIMARY KEY ("accountId")
);

-- CreateTable
CREATE TABLE "SubmitCommentSetting" (
    "accountId" TEXT NOT NULL,
    "submitDelayRange" TEXT NOT NULL DEFAULT '4-6',
    "likePostEnabled" BOOLEAN NOT NULL DEFAULT false,
    "likeCommentEnabled" BOOLEAN NOT NULL DEFAULT false,
    "tagPostAuthorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "attachPictureEnabled" BOOLEAN NOT NULL DEFAULT false,
    "defaultPictureAttachUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubmitCommentSetting_pkey" PRIMARY KEY ("accountId")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "postUrn" TEXT NOT NULL DEFAULT '',
    "postUrl" TEXT NOT NULL DEFAULT '',
    "postCreatedAt" TIMESTAMP(3),
    "postFullCaption" TEXT NOT NULL,
    "postComments" JSONB,
    "authorName" TEXT,
    "authorProfileUrl" TEXT,
    "authorAvatarUrl" TEXT,
    "authorHeadline" TEXT,
    "postAlternateUrns" TEXT[] DEFAULT ARRAY['']::TEXT[],
    "peakTouchScore" INTEGER,
    "comment" TEXT NOT NULL,
    "commentUrn" TEXT,
    "commentUrl" TEXT,
    "originalAiComment" TEXT,
    "commentedAt" TIMESTAMP(3),
    "isAutoCommented" BOOLEAN NOT NULL DEFAULT true,
    "status" "CommentStatus" NOT NULL DEFAULT 'DRAFT',
    "schedulePostAt" TIMESTAMP(3),
    "accountId" TEXT NOT NULL,
    "autoCommentRunId" TEXT,
    "autoCommentError" TEXT,
    "commentStyleId" TEXT,
    "styleSnapshot" JSONB,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscoverySet" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keywords" TEXT[],
    "keywordsMode" TEXT NOT NULL DEFAULT 'OR',
    "excluded" TEXT[],
    "authorJobTitle" TEXT,
    "authorIndustries" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscoverySet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LinkedInAccount" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT,
    "organizationId" TEXT,
    "status" "LinkedInAccountStatus" NOT NULL DEFAULT 'DISABLED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "staticIpId" TEXT,
    "browserProfileId" TEXT NOT NULL,
    "browserLocation" TEXT,
    "profileUrl" TEXT,
    "profileSlug" TEXT,
    "profileUrn" TEXT,
    "autocommentEnabled" BOOLEAN NOT NULL DEFAULT false,
    "runDailyAt" TEXT,
    "isRunning" BOOLEAN NOT NULL DEFAULT false,
    "dailyAIcomments" INTEGER NOT NULL DEFAULT 0,
    "dailyAIcommentsRefreshedAt" TIMESTAMP(3),
    "registrationStatus" TEXT,
    "name" TEXT,
    "email" TEXT,

    CONSTRAINT "LinkedInAccount_pkey" PRIMARY KEY ("id")
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
    "objectUrn" TEXT,
    "openToWork" BOOLEAN,
    "hiring" BOOLEAN,
    "premium" BOOLEAN,
    "influencer" BOOLEAN,
    "memorialized" BOOLEAN,
    "verified" BOOLEAN,
    "location" JSONB,
    "profilePictureUrl" TEXT,
    "coverPictureUrl" TEXT,
    "profilePictureSizes" JSONB,
    "coverPictureSizes" JSONB,
    "websites" JSONB,
    "currentPosition" JSONB,
    "profileActions" JSONB,
    "moreProfiles" JSONB,
    "experience" JSONB,
    "education" JSONB,
    "certifications" JSONB,
    "volunteering" JSONB,
    "receivedRecommendations" JSONB,
    "causes" JSONB,
    "featured" JSONB,
    "services" JSONB,
    "topSkills" TEXT,
    "connectionsCount" INTEGER,
    "followerCount" INTEGER,
    "registeredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LinkedInProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExtensionDeploymentMeta" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExtensionDeploymentMeta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "orgSlug" TEXT,
    "purchasedSlots" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "payerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "subscriptionTier" TEXT NOT NULL DEFAULT 'FREE',
    "subscriptionExpiresAt" TIMESTAMP(3),
    "earnedPremiumExpiresAt" TIMESTAMP(3),

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationMember" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "isOrgActive" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "linkedInAccountId" TEXT,

    CONSTRAINT "OrganizationMember_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "SocialSubmission" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "platform" "SocialPlatform" NOT NULL,
    "postUrl" TEXT NOT NULL,
    "urlNormalized" TEXT NOT NULL,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'VERIFYING',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedAt" TIMESTAMP(3),
    "lastScannedAt" TIMESTAMP(3),
    "nextScanAt" TIMESTAMP(3),
    "scanCount" INTEGER NOT NULL DEFAULT 0,
    "rescanWorkflowId" TEXT,
    "containsKeyword" BOOLEAN NOT NULL DEFAULT false,
    "postText" TEXT,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "daysAwarded" INTEGER NOT NULL DEFAULT 0,
    "awardType" "AwardType",
    "creditAmountCents" INTEGER,

    CONSTRAINT "SocialSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TargetList" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "TargetListStatus" NOT NULL,

    CONSTRAINT "TargetList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TargetListProfile" (
    "id" TEXT NOT NULL,
    "listId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,

    CONSTRAINT "TargetListProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TargetProfile" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "linkedinUrl" TEXT NOT NULL,
    "profileUrn" TEXT,
    "name" TEXT,
    "profileSlug" TEXT,
    "headline" TEXT,
    "photoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TargetProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlacklistedProfile" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "profileUrn" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlacklistedProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuildTargetListJob" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "listId" TEXT NOT NULL,
    "status" "BuildTargetListJobStatus" NOT NULL,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "BuildTargetListJob_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "HumanVerification" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "verified" BOOLEAN NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "faceCount" INTEGER NOT NULL,
    "rawResponse" JSONB NOT NULL,
    "actionType" TEXT NOT NULL DEFAULT 'linkedin_comment',
    "actionUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HumanVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "username" TEXT,
    "primaryEmailAddress" TEXT NOT NULL,
    "imageUrl" TEXT,
    "clerkUserProperties" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "stripeCustomerId" TEXT,
    "dailyAIcomments" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LinkedInAnalyticsDaily_accountId_idx" ON "LinkedInAnalyticsDaily"("accountId");

-- CreateIndex
CREATE INDEX "LinkedInAnalyticsDaily_date_idx" ON "LinkedInAnalyticsDaily"("date");

-- CreateIndex
CREATE UNIQUE INDEX "LinkedInAnalyticsDaily_accountId_date_key" ON "LinkedInAnalyticsDaily"("accountId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "UserEmailPreferences_userId_key" ON "UserEmailPreferences"("userId");

-- CreateIndex
CREATE INDEX "UserEmailPreferences_userId_idx" ON "UserEmailPreferences"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "BrowserInstance_hyperbrowserSessionId_key" ON "BrowserInstance"("hyperbrowserSessionId");

-- CreateIndex
CREATE INDEX "BrowserJob_status_idx" ON "BrowserJob"("status");

-- CreateIndex
CREATE UNIQUE INDEX "CommentGenerateSetting_commentStyleId_key" ON "CommentGenerateSetting"("commentStyleId");

-- CreateIndex
CREATE UNIQUE INDEX "PostLoadSetting_blacklistId_key" ON "PostLoadSetting"("blacklistId");

-- CreateIndex
CREATE INDEX "Comment_postUrn_idx" ON "Comment"("postUrn");

-- CreateIndex
CREATE INDEX "Comment_commentStyleId_idx" ON "Comment"("commentStyleId");

-- CreateIndex
CREATE INDEX "Comment_commentedAt_idx" ON "Comment"("commentedAt");

-- CreateIndex
CREATE INDEX "Comment_status_idx" ON "Comment"("status");

-- CreateIndex
CREATE INDEX "Comment_postAlternateUrns_idx" ON "Comment" USING GIN ("postAlternateUrns");

-- CreateIndex
CREATE INDEX "Comment_accountId_status_peakTouchScore_idx" ON "Comment"("accountId", "status", "peakTouchScore");

-- CreateIndex
CREATE INDEX "Comment_accountId_status_commentedAt_idx" ON "Comment"("accountId", "status", "commentedAt");

-- CreateIndex
CREATE INDEX "Comment_accountId_status_authorProfileUrl_idx" ON "Comment"("accountId", "status", "authorProfileUrl");

-- CreateIndex
CREATE INDEX "DiscoverySet_accountId_idx" ON "DiscoverySet"("accountId");

-- CreateIndex
CREATE INDEX "DiscoverySet_accountId_createdAt_idx" ON "DiscoverySet"("accountId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "LinkedInAccount_profileUrl_key" ON "LinkedInAccount"("profileUrl");

-- CreateIndex
CREATE UNIQUE INDEX "LinkedInAccount_profileSlug_key" ON "LinkedInAccount"("profileSlug");

-- CreateIndex
CREATE UNIQUE INDEX "LinkedInAccount_profileUrn_key" ON "LinkedInAccount"("profileUrn");

-- CreateIndex
CREATE INDEX "LinkedInAccount_organizationId_idx" ON "LinkedInAccount"("organizationId");

-- CreateIndex
CREATE INDEX "LinkedInAccount_ownerId_idx" ON "LinkedInAccount"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "LinkedInProfile_urn_key" ON "LinkedInProfile"("urn");

-- CreateIndex
CREATE INDEX "LinkedInProfile_linkedinUrl_idx" ON "LinkedInProfile"("linkedinUrl");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_stripeSubscriptionId_key" ON "Organization"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "OrganizationMember_userId_idx" ON "OrganizationMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationMember_orgId_userId_key" ON "OrganizationMember"("orgId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "SocialSubmission_urlNormalized_key" ON "SocialSubmission"("urlNormalized");

-- CreateIndex
CREATE INDEX "SocialSubmission_organizationId_idx" ON "SocialSubmission"("organizationId");

-- CreateIndex
CREATE INDEX "SocialSubmission_status_idx" ON "SocialSubmission"("status");

-- CreateIndex
CREATE INDEX "SocialSubmission_platform_idx" ON "SocialSubmission"("platform");

-- CreateIndex
CREATE INDEX "TargetList_accountId_idx" ON "TargetList"("accountId");

-- CreateIndex
CREATE INDEX "TargetList_name_idx" ON "TargetList"("name");

-- CreateIndex
CREATE UNIQUE INDEX "TargetListProfile_listId_profileId_accountId_key" ON "TargetListProfile"("listId", "profileId", "accountId");

-- CreateIndex
CREATE UNIQUE INDEX "TargetProfile_accountId_linkedinUrl_key" ON "TargetProfile"("accountId", "linkedinUrl");

-- CreateIndex
CREATE UNIQUE INDEX "BlacklistedProfile_accountId_profileUrn_key" ON "BlacklistedProfile"("accountId", "profileUrn");

-- CreateIndex
CREATE UNIQUE INDEX "BuildTargetListJob_listId_key" ON "BuildTargetListJob"("listId");

-- CreateIndex
CREATE INDEX "BuildTargetListJob_status_idx" ON "BuildTargetListJob"("status");

-- CreateIndex
CREATE INDEX "CommentAnalysis_userId_idx" ON "CommentAnalysis"("userId");

-- CreateIndex
CREATE INDEX "CommentAnalysis_createdAt_idx" ON "CommentAnalysis"("createdAt");

-- CreateIndex
CREATE INDEX "LinkedInPostPreview_userId_idx" ON "LinkedInPostPreview"("userId");

-- CreateIndex
CREATE INDEX "LinkedInPostPreview_createdAt_idx" ON "LinkedInPostPreview"("createdAt");

-- CreateIndex
CREATE INDEX "HumanVerification_userId_idx" ON "HumanVerification"("userId");

-- CreateIndex
CREATE INDEX "HumanVerification_createdAt_idx" ON "HumanVerification"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_primaryEmailAddress_key" ON "User"("primaryEmailAddress");

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeCustomerId_key" ON "User"("stripeCustomerId");

-- AddForeignKey
ALTER TABLE "LinkedInAnalyticsDaily" ADD CONSTRAINT "LinkedInAnalyticsDaily_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "LinkedInAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserEmailPreferences" ADD CONSTRAINT "UserEmailPreferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBrowserState" ADD CONSTRAINT "UserBrowserState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrowserInstance" ADD CONSTRAINT "BrowserInstance_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "LinkedInAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrowserJob" ADD CONSTRAINT "BrowserJob_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "LinkedInAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutoCommentRun" ADD CONSTRAINT "AutoCommentRun_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "LinkedInAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutoCommentRun" ADD CONSTRAINT "AutoCommentRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutoCommentConfig" ADD CONSTRAINT "AutoCommentConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutoCommentConfig" ADD CONSTRAINT "AutoCommentConfig_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "LinkedInAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutoCommentConfig" ADD CONSTRAINT "AutoCommentConfig_commentStyleId_fkey" FOREIGN KEY ("commentStyleId") REFERENCES "CommentStyle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentGenerateSetting" ADD CONSTRAINT "CommentGenerateSetting_commentStyleId_fkey" FOREIGN KEY ("commentStyleId") REFERENCES "CommentStyle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentGenerateSetting" ADD CONSTRAINT "CommentGenerateSetting_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "LinkedInAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentStyle" ADD CONSTRAINT "CommentStyle_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "LinkedInAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostLoadSetting" ADD CONSTRAINT "PostLoadSetting_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "LinkedInAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostLoadSetting" ADD CONSTRAINT "PostLoadSetting_blacklistId_fkey" FOREIGN KEY ("blacklistId") REFERENCES "TargetList"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmitCommentSetting" ADD CONSTRAINT "SubmitCommentSetting_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "LinkedInAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "LinkedInAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_autoCommentRunId_fkey" FOREIGN KEY ("autoCommentRunId") REFERENCES "AutoCommentRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_commentStyleId_fkey" FOREIGN KEY ("commentStyleId") REFERENCES "CommentStyle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscoverySet" ADD CONSTRAINT "DiscoverySet_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "LinkedInAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LinkedInAccount" ADD CONSTRAINT "LinkedInAccount_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LinkedInAccount" ADD CONSTRAINT "LinkedInAccount_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_payerId_fkey" FOREIGN KEY ("payerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_linkedInAccountId_fkey" FOREIGN KEY ("linkedInAccountId") REFERENCES "LinkedInAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileImportRun" ADD CONSTRAINT "ProfileImportRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialSubmission" ADD CONSTRAINT "SocialSubmission_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TargetList" ADD CONSTRAINT "TargetList_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "LinkedInAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TargetListProfile" ADD CONSTRAINT "TargetListProfile_listId_fkey" FOREIGN KEY ("listId") REFERENCES "TargetList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TargetListProfile" ADD CONSTRAINT "TargetListProfile_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "TargetProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TargetListProfile" ADD CONSTRAINT "TargetListProfile_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "LinkedInAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TargetProfile" ADD CONSTRAINT "TargetProfile_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "LinkedInAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlacklistedProfile" ADD CONSTRAINT "BlacklistedProfile_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "LinkedInAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuildTargetListJob" ADD CONSTRAINT "BuildTargetListJob_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "LinkedInAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuildTargetListJob" ADD CONSTRAINT "BuildTargetListJob_listId_fkey" FOREIGN KEY ("listId") REFERENCES "TargetList"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentAnalysis" ADD CONSTRAINT "CommentAnalysis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LinkedInPostPreview" ADD CONSTRAINT "LinkedInPostPreview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HumanVerification" ADD CONSTRAINT "HumanVerification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

