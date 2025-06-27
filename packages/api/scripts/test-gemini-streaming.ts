#!/usr/bin/env bun
import { db } from "@sassy/db";

import type { TRPCContext } from "../src/trpc";
import { geminiUploadRouter } from "../src/router/gemini-upload";

/**
 * Test script for Gemini streaming upload endpoints
 * Tests the new tRPC streaming approach that bypasses Lambda size limits
 */

async function testGeminiStreaming() {
  console.log("🧪 Testing Gemini streaming upload...");

  // Create test context
  const testContext: TRPCContext = {
    db,
    // user is optional for public procedures
  };

  try {
    // Test 1: Health check
    console.log("\n1️⃣ Testing health check...");
    const healthResult = await geminiUploadRouter
      .createCaller(testContext)
      .healthCheck();

    console.log("Health check result:", healthResult);

    if (!healthResult.success) {
      console.error("❌ Health check failed");
      return;
    }

    console.log("✅ Health check passed");

    // Test 2: Initiate upload
    console.log("\n2️⃣ Testing upload initiation...");
    const fileName = "test-video.mp4";
    const mimeType = "video/mp4";
    const testData = "test chunk data for streaming upload";
    const fileSize = testData.length; // Match actual data size

    const initiateResult = await geminiUploadRouter
      .createCaller(testContext)
      .initiateUpload({
        fileName,
        mimeType,
        fileSize,
      });

    console.log("Initiate result:", initiateResult);

    if (!initiateResult.success) {
      console.error("❌ Upload initiation failed");
      return;
    }

    console.log("✅ Upload initiation successful");
    console.log("Session ID:", initiateResult.sessionId);

    // Test 3: Upload a small chunk
    console.log("\n3️⃣ Testing chunk upload...");
    const base64Data = Buffer.from(testData).toString("base64");

    const chunkResult = await geminiUploadRouter
      .createCaller(testContext)
      .uploadChunk({
        sessionId: initiateResult.sessionId,
        chunkData: base64Data,
        isLastChunk: true,
      });

    console.log("Chunk result:", chunkResult);

    if (!chunkResult.success) {
      console.error("❌ Chunk upload failed");
      return;
    }

    console.log("✅ Chunk upload successful");

    if (chunkResult.fileUri) {
      console.log("🎉 File uploaded successfully!");
      console.log("File URI:", chunkResult.fileUri);
    }
  } catch (error) {
    console.error("❌ Test failed:", error);

    if (error instanceof Error) {
      console.error("Error message:", error.message);
      if (error.stack) {
        console.error("Stack trace:", error.stack);
      }
    }
  }
}

// Run the test
testGeminiStreaming();
