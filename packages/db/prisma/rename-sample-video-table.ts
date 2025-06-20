#!/usr/bin/env bun

/**
 * Safe Table Rename Script
 * ========================
 *
 * This script safely renames the SampleVideo table to HookViralVideo
 * while preserving all existing data.
 *
 * Usage: bun prisma/rename-sample-video-table.ts
 */
import { PrismaClient } from "../generated/node";

async function main() {
  const prisma = new PrismaClient();

  try {
    console.log("🔄 Starting safe table rename...");

    // Step 1: Check if SampleVideo table exists
    console.log("📊 Checking current tables...");
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('SampleVideo', 'HookViralVideo');
    `;

    console.log("Current tables:", tables);

    // Step 2: Rename SampleVideo to HookViralVideo if needed
    const hasSampleVideo =
      Array.isArray(tables) &&
      tables.some((row: any) => row.table_name === "SampleVideo");

    const hasHookViralVideo =
      Array.isArray(tables) &&
      tables.some((row: any) => row.table_name === "HookViralVideo");

    if (hasSampleVideo && !hasHookViralVideo) {
      console.log("🔄 Renaming SampleVideo table to HookViralVideo...");

      // Rename the table
      await prisma.$executeRaw`
        ALTER TABLE "SampleVideo" RENAME TO "HookViralVideo";
      `;

      console.log("✅ Table renamed successfully!");

      // Check if we need to rename any indexes
      console.log("🔄 Checking and renaming indexes...");

      // Rename the unique index on webpageUrl
      await prisma.$executeRaw`
        ALTER INDEX "SampleVideo_webpageUrl_key" RENAME TO "HookViralVideo_webpageUrl_key";
      `;

      // Rename the regular index on webpageUrl
      await prisma.$executeRaw`
        ALTER INDEX "SampleVideo_webpageUrl_idx" RENAME TO "HookViralVideo_webpageUrl_idx";
      `;

      console.log("✅ Indexes renamed successfully!");
    } else if (hasHookViralVideo) {
      console.log("✅ HookViralVideo table already exists, skipping rename.");
    } else {
      console.log("⚠️ SampleVideo table not found, skipping rename.");
    }

    console.log("🎉 Table rename completed successfully!");
    console.log(
      "💡 Now you can update your schema.prisma and run 'pnpm db:push'.",
    );
  } catch (error) {
    console.error("❌ Table rename failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
