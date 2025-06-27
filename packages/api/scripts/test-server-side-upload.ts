#!/usr/bin/env bun

/**
 * Test script for server-side upload functionality
 * Tests the new uploadFile endpoint that bypasses CORS
 */
import { readFileSync } from "fs";
import { join } from "path";

import { db } from "@sassy/db";

import { geminiUploadRouter } from "../src/router/gemini-upload";
import { createCallerFactory } from "../src/trpc";

console.log("🧪 Testing server-side upload functionality...");

const createCaller = createCallerFactory(geminiUploadRouter);
const caller = createCaller({ db });

async function testServerSideUpload() {
  try {
    console.log("\n📤 Testing server-side upload...");

    // Create a small test file buffer (1KB of data)
    const testData = Buffer.alloc(1024, "A"); // 1KB of 'A' characters
    const base64Data = testData.toString("base64");

    console.log("📋 Test file info:", {
      fileName: "test-server-upload.txt",
      mimeType: "text/plain",
      sizeBytes: testData.length,
      base64Size: base64Data.length,
    });

    const result = await caller.uploadFile({
      fileName: "test-server-upload.txt",
      mimeType: "text/plain",
      fileData: base64Data,
    });

    console.log("✅ Server-side upload result:", result);
    return true;
  } catch (error) {
    console.error("❌ Server-side upload failed:", error);
    return false;
  }
}

async function testHealthCheck() {
  try {
    console.log("\n💚 Testing health check...");
    const result = await caller.healthCheck();
    console.log("✅ Health check result:", result);
    return true;
  } catch (error) {
    console.error("❌ Health check failed:", error);
    return false;
  }
}

async function runTests() {
  console.log("🚀 Starting server-side upload tests...\n");

  const healthOk = await testHealthCheck();
  const uploadOk = await testServerSideUpload();

  console.log("\n📋 Test Results:");
  console.log(`Health Check: ${healthOk ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`Server-side Upload: ${uploadOk ? "✅ PASS" : "❌ FAIL"}`);

  if (healthOk && uploadOk) {
    console.log(
      "\n🎉 All tests passed! Server-side upload is working and bypasses CORS.",
    );
  } else {
    console.log("\n⚠️ Some tests failed. Check the logs above.");
    process.exit(1);
  }
}

runTests().catch((error) => {
  console.error("💥 Test runner failed:", error);
  process.exit(1);
});
