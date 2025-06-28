#!/usr/bin/env bun

export {}; // Make this file a module

const LAMBDA_URL =
  "https://xbmtuub6svrqosafjbsh4st23y0roxxe.lambda-url.us-west-2.on.aws";
const CHUNK_SIZE = 4 * 1024 * 1024; // 4MB chunks - Lambda will buffer to 8MB for Gemini

interface InitiateUploadResponse {
  success: boolean;
  sessionId?: string;
  uploadUrl?: string;
  message?: string;
}

interface UploadChunkResponse {
  success: boolean;
  fileUri?: string;
  uploadedBytes?: number;
  message?: string;
}

async function testResumableUpload() {
  console.log("🧪 Testing resumable upload to Lambda...");

  // Create a test file
  const testContent = "Hello, this is a test file for resumable upload!";
  const testBuffer = Buffer.from(testContent);

  const fileName = "test-resumable.txt";
  const mimeType = "text/plain";
  const fileSize = testBuffer.length;

  try {
    // Step 1: Initiate resumable upload
    console.log("🚀 Step 1: Initiating resumable upload...");
    const initResponse = await fetch(`${LAMBDA_URL}/initiate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileName,
        mimeType,
        fileSize,
      }),
    });

    console.log("Response status:", initResponse.status);
    console.log(
      "Response headers:",
      Object.fromEntries(initResponse.headers.entries()),
    );

    if (!initResponse.ok) {
      const errorText = await initResponse.text();
      throw new Error(
        `Failed to initiate upload: ${initResponse.status} ${errorText}`,
      );
    }

    const initData = (await initResponse.json()) as InitiateUploadResponse;
    console.log("✅ Initiate response:", initData);

    if (!initData.success || !initData.sessionId) {
      throw new Error(initData.message || "Failed to get session ID");
    }

    // Step 2: Upload chunks
    console.log("📤 Step 2: Uploading chunks...");
    const totalChunks = Math.ceil(fileSize / CHUNK_SIZE);
    console.log(`Total chunks needed: ${totalChunks}`);

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, fileSize);
      const chunk = testBuffer.slice(start, end);
      const isLastChunk = chunkIndex === totalChunks - 1;

      console.log(`📤 Uploading chunk ${chunkIndex + 1}/${totalChunks}:`, {
        start,
        end,
        chunkSize: chunk.length,
        isLastChunk,
      });

      // Create form data for chunk
      const formData = new FormData();
      formData.append("sessionId", initData.sessionId);
      formData.append("chunkOffset", start.toString());
      formData.append("isLastChunk", isLastChunk.toString());
      formData.append("chunk", new Blob([chunk], { type: mimeType }), fileName);

      const chunkResponse = await fetch(`${LAMBDA_URL}/upload-chunk`, {
        method: "POST",
        body: formData,
      });

      console.log(
        `Chunk ${chunkIndex + 1} response status:`,
        chunkResponse.status,
      );

      if (!chunkResponse.ok) {
        const errorText = await chunkResponse.text();
        throw new Error(
          `Failed to upload chunk ${chunkIndex + 1}: ${chunkResponse.status} ${errorText}`,
        );
      }

      const chunkData = (await chunkResponse.json()) as UploadChunkResponse;
      console.log(`✅ Chunk ${chunkIndex + 1} response:`, chunkData);

      if (!chunkData.success) {
        throw new Error(
          chunkData.message || `Failed to upload chunk ${chunkIndex + 1}`,
        );
      }

      // If this is the last chunk, we should have the final file URI
      if (isLastChunk) {
        if (chunkData.fileUri) {
          console.log("🎉 Resumable upload completed successfully!");
          console.log("📁 Final file URI:", chunkData.fileUri);
          return chunkData.fileUri;
        } else {
          throw new Error("Upload completed but no file URI received");
        }
      }
    }
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
}

async function testCORS() {
  console.log("🧪 Testing CORS...");

  try {
    const response = await fetch(`${LAMBDA_URL}/initiate`, {
      method: "OPTIONS",
    });

    console.log("CORS Response status:", response.status);
    console.log(
      "CORS Response headers:",
      Object.fromEntries(response.headers.entries()),
    );

    if (response.status === 200) {
      console.log("✅ CORS test passed");
    } else {
      console.log("❌ CORS test failed");
    }
  } catch (error) {
    console.error("❌ CORS test error:", error);
  }
}

async function main() {
  console.log("🚀 Testing Lambda deployment...");
  console.log("Lambda URL:", LAMBDA_URL);

  await testCORS();
  console.log();
  await testResumableUpload();
}

main().catch(console.error);
