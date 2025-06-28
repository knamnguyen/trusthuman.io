#!/usr/bin/env bun

export {}; // Make this file a module

const LAMBDA_URL = process.env.NEXT_PUBLIC_GEMINI_UPLOAD_LAMBDA_URL;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!LAMBDA_URL) {
  console.error("❌ NEXT_PUBLIC_GEMINI_UPLOAD_LAMBDA_URL not set");
  process.exit(1);
}

if (!GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY not set");
  process.exit(1);
}

console.log("🧪 Testing Lambda Function URL with streaming upload...");
console.log("🌐 Lambda URL:", LAMBDA_URL);

// Test 1: CORS preflight for upload endpoint
try {
  console.log("🔍 Testing CORS preflight...");
  const corsResponse = await fetch(`${LAMBDA_URL}/upload`, {
    method: "OPTIONS",
  });
  console.log("✅ CORS preflight response:", {
    status: corsResponse.status,
    headers: Object.fromEntries(corsResponse.headers.entries()),
  });
} catch (error) {
  console.error("❌ CORS test failed:", error);
}

// Test 2: Create a small test file and upload
try {
  console.log("🔍 Testing streaming upload with small test file...");

  // Create a small test video file (just some binary data)
  const testContent = new Uint8Array(1024); // 1KB test file
  testContent.fill(65); // Fill with 'A' characters

  const testFile = new File([testContent], "test-video.mp4", {
    type: "video/mp4",
  });

  const formData = new FormData();
  formData.append("file", testFile);

  console.log("📤 Uploading test file:", {
    name: testFile.name,
    size: testFile.size,
    type: testFile.type,
  });

  const uploadResponse = await fetch(`${LAMBDA_URL}/upload`, {
    method: "POST",
    body: formData,
  });

  console.log("📡 Upload response:", {
    status: uploadResponse.status,
    headers: Object.fromEntries(uploadResponse.headers.entries()),
  });

  if (uploadResponse.ok) {
    const result = await uploadResponse.json();
    console.log("✅ Upload successful:", result);
  } else {
    const errorText = await uploadResponse.text();
    console.error("❌ Upload failed:", errorText);
  }
} catch (error) {
  console.error("❌ Upload test failed:", error);
}

console.log("🎉 Lambda tests completed!");
