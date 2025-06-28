import type {
  InitiateUploadRequest,
  InitiateUploadResponse,
  LambdaFunctionUrlEvent,
  LambdaFunctionUrlResponse,
  UploadChunkRequest,
  UploadChunkResponse,
} from "./types";
import { GeminiUploadClient } from "./gemini-client";

const geminiClient = new GeminiUploadClient();

export const handler = async (
  event: LambdaFunctionUrlEvent,
): Promise<LambdaFunctionUrlResponse> => {
  console.log("🔥 Lambda handler started:", {
    method: event.requestContext.http.method,
    path: event.requestContext.http.path,
  });

  // AWS Function URL handles CORS automatically - no manual headers needed

  // Handle preflight requests (AWS handles this but return empty response just in case)
  if (event.requestContext.http.method === "OPTIONS") {
    return {
      statusCode: 200,
      body: "",
    };
  }

  try {
    const path = event.requestContext.http.path;
    const method = event.requestContext.http.method;

    // Route to appropriate handler
    if (method === "POST" && path === "/initiate") {
      return await handleInitiateUpload(event);
    } else if (method === "POST" && path === "/upload-chunk") {
      return await handleUploadChunk(event);
    } else {
      return {
        statusCode: 404,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Not found" }),
      };
    }
  } catch (error) {
    console.error("❌ Lambda handler error:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
    };
  }
};

async function handleInitiateUpload(
  event: LambdaFunctionUrlEvent,
): Promise<LambdaFunctionUrlResponse> {
  if (!event.body) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "No body provided" }),
    };
  }

  const request: InitiateUploadRequest = JSON.parse(event.body);

  if (!request.fileName || !request.mimeType || !request.fileSize) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "Missing required fields: fileName, mimeType, fileSize",
      }),
    };
  }

  console.log("🚀 Initiating resumable upload:", request);

  const { sessionId, uploadUrl } = await geminiClient.initiateResumableUpload(
    request.fileName,
    request.mimeType,
    request.fileSize,
  );

  const response: InitiateUploadResponse = {
    success: true,
    sessionId,
    uploadUrl,
    message: "Resumable upload session created",
  };

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(response),
  };
}

async function handleUploadChunk(
  event: LambdaFunctionUrlEvent,
): Promise<LambdaFunctionUrlResponse> {
  if (!event.body) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "No body provided" }),
    };
  }

  // Parse multipart form data for chunk upload
  const contentType = event.headers["content-type"] || "";
  if (!contentType.includes("multipart/form-data")) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Expected multipart/form-data" }),
    };
  }

  // Extract boundary from content-type header
  const boundaryMatch = contentType.match(/boundary=([^;]+)/);
  if (!boundaryMatch) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "No boundary found in content-type" }),
    };
  }

  const boundary = boundaryMatch[1]!;
  const body = event.isBase64Encoded
    ? Buffer.from(event.body!, "base64")
    : Buffer.from(event.body!, "utf-8");

  // Parse multipart data
  const parts = parseMultipartData(body, boundary);

  const sessionIdPart = parts.find((part) => part.name === "sessionId");
  const chunkOffsetPart = parts.find((part) => part.name === "chunkOffset");
  const isLastChunkPart = parts.find((part) => part.name === "isLastChunk");
  const chunkPart = parts.find((part) => part.name === "chunk");

  if (!sessionIdPart || !chunkOffsetPart || !isLastChunkPart || !chunkPart) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error:
          "Missing required fields: sessionId, chunkOffset, isLastChunk, chunk",
      }),
    };
  }

  const sessionId = sessionIdPart.data.toString("utf-8").trim();
  const chunkOffset = parseInt(chunkOffsetPart.data.toString("utf-8").trim());
  const isLastChunk = isLastChunkPart.data.toString("utf-8").trim() === "true";
  const chunkData = chunkPart.data;

  console.log("📤 Processing chunk upload:", {
    sessionId,
    chunkOffset,
    chunkSize: chunkData.length,
    isLastChunk,
  });

  const result = await geminiClient.uploadChunk(
    sessionId,
    chunkData,
    chunkOffset,
    isLastChunk,
  );

  const session = geminiClient.getSession(sessionId);

  const response: UploadChunkResponse = {
    success: result.success,
    fileUri: result.fileUri,
    uploadedBytes: session?.uploadedBytes,
    message: isLastChunk
      ? "File upload completed"
      : "Chunk uploaded successfully",
  };

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(response),
  };
}

// Simple multipart parser
interface MultipartPart {
  name: string;
  filename?: string;
  contentType?: string;
  data: Buffer;
}

function parseMultipartData(body: Buffer, boundary: string): MultipartPart[] {
  const parts: MultipartPart[] = [];
  const boundaryBuffer = Buffer.from(`--${boundary}`);
  const endBoundaryBuffer = Buffer.from(`--${boundary}--`);

  let start = 0;
  let end = body.indexOf(boundaryBuffer, start);

  while (end !== -1) {
    if (start > 0) {
      // Extract part between boundaries
      const partData = body.slice(start, end);
      const part = parsePart(partData);
      if (part) {
        parts.push(part);
      }
    }

    start = end + boundaryBuffer.length;

    // Check if this is the end boundary
    if (body.slice(start, start + 2).equals(Buffer.from("--"))) {
      break;
    }

    end = body.indexOf(boundaryBuffer, start);
  }

  return parts;
}

function parsePart(partData: Buffer): MultipartPart | null {
  // Find the empty line that separates headers from body
  const headerEndIndex = partData.indexOf("\r\n\r\n");
  if (headerEndIndex === -1) {
    return null;
  }

  const headersBuffer = partData.slice(0, headerEndIndex);
  let bodyBuffer = partData.slice(headerEndIndex + 4);

  const headers = headersBuffer.toString("utf-8");

  // Parse Content-Disposition header
  const dispositionMatch = headers.match(
    /Content-Disposition: form-data; name="([^"]+)"(?:; filename="([^"]+)")?/,
  );
  if (!dispositionMatch) {
    return null;
  }

  const name = dispositionMatch[1]!;
  const filename = dispositionMatch[2];

  // Parse Content-Type header if present
  const contentTypeMatch = headers.match(/Content-Type: ([^\r\n]+)/);
  const contentType = contentTypeMatch ? contentTypeMatch[1] : undefined;

  // Remove trailing \r\n if present (multipart boundary cleanup)
  if (
    bodyBuffer.length >= 2 &&
    bodyBuffer[bodyBuffer.length - 2] === 0x0d &&
    bodyBuffer[bodyBuffer.length - 1] === 0x0a
  ) {
    bodyBuffer = bodyBuffer.slice(0, -2);
  }

  return {
    name,
    filename,
    contentType,
    data: bodyBuffer,
  };
}
