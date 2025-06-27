import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

import { GeminiUploadClient } from "./gemini-client";
import {
  FinalizeUploadRequestSchema,
  InitiateUploadRequestSchema,
  UploadChunkRequestSchema,
} from "./types";

// Environment variables
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is required");
}

// Initialize Gemini client
const geminiClient = new GeminiUploadClient(GEMINI_API_KEY);

/**
 * AWS Lambda handler for Gemini file upload operations (Function URL)
 */
export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  console.log("🚀 Lambda invocation:", {
    httpMethod: event.httpMethod,
    queryStringParameters: event.queryStringParameters,
    headers: event.headers,
    body: event.body ? "present" : "empty",
  });

  // Set CORS headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
  };

  try {
    // Handle preflight OPTIONS request
    if (event.httpMethod === "OPTIONS") {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: "",
      };
    }

    // Parse request body
    const body = event.body ? JSON.parse(event.body) : {};

    // Get action from query parameter or request body
    const action =
      event.queryStringParameters?.action ||
      body.action ||
      body.path?.replace("/", "");

    if (!action) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          error: "Missing action",
          message:
            "Specify action in query param (?action=initiate-upload) or request body",
        }),
      };
    }

    // Route requests based on action
    if (action === "initiate-upload" && event.httpMethod === "POST") {
      return await handleInitiateUpload(body, corsHeaders);
    }

    if (action === "upload-chunk" && event.httpMethod === "POST") {
      return await handleUploadChunk(body, corsHeaders);
    }

    if (action === "finalize-upload" && event.httpMethod === "POST") {
      return await handleFinalizeUpload(body, corsHeaders);
    }

    // Route not found
    return {
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({
        error: "Action not found",
        action: action,
        supportedActions: [
          "initiate-upload",
          "upload-chunk",
          "finalize-upload",
        ],
      }),
    };
  } catch (error) {
    console.error("❌ Lambda handler error:", error);

    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
    };
  }
};

/**
 * Handle upload session initiation
 */
async function handleInitiateUpload(
  body: unknown,
  headers: Record<string, string>,
): Promise<APIGatewayProxyResult> {
  try {
    console.log("📥 Initiating upload:", body);

    // Validate request
    const request = InitiateUploadRequestSchema.parse(body);

    // Create upload session
    const response = await geminiClient.createUploadSession(
      request.fileName,
      request.mimeType,
      request.fileSize,
    );

    console.log("✅ Upload session created:", response);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response),
    };
  } catch (error) {
    console.error("❌ Failed to initiate upload:", error);

    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        error: "Failed to initiate upload",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
    };
  }
}

/**
 * Handle chunk upload
 */
async function handleUploadChunk(
  body: unknown,
  headers: Record<string, string>,
): Promise<APIGatewayProxyResult> {
  try {
    console.log("📤 Processing chunk upload");

    // Validate request
    const request = UploadChunkRequestSchema.parse(body);

    // Process chunk
    const response = await geminiClient.processChunk(
      request.sessionId,
      request.chunkData,
      request.isLastChunk,
    );

    console.log("✅ Chunk processed:", {
      sessionId: request.sessionId,
      bytesUploaded: response.bytesUploaded,
      percentage: response.percentage,
      hasFileUri: !!response.fileUri,
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response),
    };
  } catch (error) {
    console.error("❌ Failed to process chunk:", error);

    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        error: "Failed to process chunk",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
    };
  }
}

/**
 * Handle upload finalization
 */
async function handleFinalizeUpload(
  body: unknown,
  headers: Record<string, string>,
): Promise<APIGatewayProxyResult> {
  try {
    console.log("🏁 Finalizing upload:", body);

    // Validate request
    const request = FinalizeUploadRequestSchema.parse(body);

    // Finalize upload
    const response = await geminiClient.finalizeUpload(request.sessionId);

    console.log("✅ Upload finalized:", response);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response),
    };
  } catch (error) {
    console.error("❌ Failed to finalize upload:", error);

    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        error: "Failed to finalize upload",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
    };
  }
}
