import { GoogleGenAI } from "@google/genai";
import { Hono } from "hono";
import { z } from "zod";

const geminiUpload = new Hono();

// Validation schema
const GeminiUploadResponseSchema = z.object({
  fileUri: z.string(),
  mimeType: z.string(),
  name: z.string(),
  state: z.string(),
});

// Initialize Gemini client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is required");
  }
  return new GoogleGenAI({ apiKey });
};

geminiUpload.post("/gemini", async (c) => {
  try {
    console.log("🚀 Starting Gemini file upload...");

    // Get the uploaded file from the request
    const body = await c.req.parseBody();
    const file = body.file as File;

    if (!file) {
      return c.json({ error: "No file provided" }, 400);
    }

    console.log("📁 File received:", {
      name: file.name,
      type: file.type,
      size: file.size,
    });

    // Validate file type (videos only)
    if (!file.type.startsWith("video/")) {
      return c.json({ error: "Only video files are supported" }, 400);
    }

    // Initialize Gemini client
    const genAI = getGeminiClient();

    console.log("📤 Uploading to Gemini Files API...");

    // Upload file to Gemini
    const uploadResult = await genAI.files.upload({
      file,
    });

    console.log("✅ Upload completed:", uploadResult.name);

    // Validate upload result
    if (!uploadResult.name) {
      console.error("❌ Upload failed: No file name returned");
      return c.json({ error: "Upload failed: No file name returned" }, 500);
    }

    // Wait for file to be processed
    console.log("⏳ Waiting for file processing...");
    let fileInfo = await genAI.files.get({ name: uploadResult.name });

    // Poll until file is ready (with timeout)
    const maxWaitTime = 60000; // 60 seconds
    const pollInterval = 2000; // 2 seconds
    let waitTime = 0;

    while (fileInfo.state === "PROCESSING" && waitTime < maxWaitTime) {
      console.log("🔄 File still processing...");
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
      waitTime += pollInterval;
      fileInfo = await genAI.files.get({ name: uploadResult.name });
    }

    if (fileInfo.state === "FAILED") {
      console.error("❌ Gemini file processing failed");
      return c.json({ error: "File processing failed" }, 500);
    }

    if (fileInfo.state === "PROCESSING") {
      console.error("⏰ File processing timeout");
      return c.json({ error: "File processing timeout" }, 408);
    }

    // Validate and return response
    const response = GeminiUploadResponseSchema.parse({
      fileUri: fileInfo.uri,
      mimeType: fileInfo.mimeType,
      name: fileInfo.name,
      state: fileInfo.state,
    });

    console.log("✅ Gemini upload successful:", response.name);

    return c.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("❌ Gemini upload failed:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return c.json(
      {
        error: "Upload failed",
        message: errorMessage,
      },
      500,
    );
  }
});

export { geminiUpload as geminiUploadRoute };
