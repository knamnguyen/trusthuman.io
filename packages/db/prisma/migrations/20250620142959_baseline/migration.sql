-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "AccessType" AS ENUM ('TRIAL', 'FREE', 'LIFETIME', 'MONTHLY', 'YEARLY');

-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(256) NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "username" TEXT,
    "primaryEmailAddress" TEXT,
    "imageUrl" TEXT,
    "clerkUserProperties" JSONB,
    "stripeCustomerId" TEXT,
    "accessType" "AccessType" NOT NULL DEFAULT 'FREE',
    "stripeUserProperties" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SampleVideo" (
    "id" TEXT NOT NULL,
    "webpageUrl" TEXT NOT NULL,
    "s3Url" TEXT NOT NULL,
    "hookEndTimestamp" TEXT NOT NULL,
    "hookCutConfidence" TEXT,
    "hookCutUrl" TEXT,
    "hookInfo" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "searchEmbedding" vector(768),
    "views" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "durationSeconds" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SampleVideo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_primaryEmailAddress_key" ON "User"("primaryEmailAddress");

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeCustomerId_key" ON "User"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "SampleVideo_webpageUrl_key" ON "SampleVideo"("webpageUrl");

-- CreateIndex
CREATE INDEX "SampleVideo_webpageUrl_idx" ON "SampleVideo"("webpageUrl");

