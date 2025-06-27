import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "../trpc";

// Gemini Files API configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com";

if (!GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is required");
}

// In-memory storage for active upload sessions
interface UploadSession {
  uploadUrl: string;
  fileSize: number;
  uploadedBytes: number;
  fileName: string;
  mimeType: string;
  startTime: number;
}

const uploadSessions = new Map<string, UploadSession>();

// Helper function to initiate resumable upload with Gemini
const initiateResumableUpload = async (
  fileName: string,
  mimeType: string,
  fileSize: number,
): Promise<{ uploadUrl: string; sessionId: string }> => {
  const sessionId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const response = await fetch(
    `${GEMINI_BASE_URL}/upload/v1beta/files?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: {
        "X-Goog-Upload-Protocol": "resumable",
        "X-Goog-Upload-Command": "start",
        "X-Goog-Upload-Header-Content-Length": fileSize.toString(),
        "X-Goog-Upload-Header-Content-Type": mimeType,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        file: {
          display_name: fileName,
        },
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to initiate upload: ${response.status} ${errorText}`,
    );
  }

  const uploadUrl = response.headers.get("X-Goog-Upload-URL");
  if (!uploadUrl) {
    throw new Error("No upload URL returned from Gemini");
  }

  // Store session info
  uploadSessions.set(sessionId, {
    uploadUrl,
    fileSize,
    uploadedBytes: 0,
    fileName,
    mimeType,
    startTime: Date.now(),
  });

  return { uploadUrl, sessionId };
};

// Helper function to upload chunk to Gemini
// Note: Gemini Files API requires chunks to be multiples of 8MB (8,388,608 bytes)
// except for the final chunk which can be smaller
const uploadChunk = async (
  sessionId: string,
  chunkData: Buffer,
  isLastChunk: boolean,
): Promise<{ success: boolean; fileUri?: string }> => {
  const session = uploadSessions.get(sessionId);
  if (!session) {
    throw new Error("Upload session not found");
  }

  const command = isLastChunk ? "upload, finalize" : "upload";
  const headers: Record<string, string> = {
    "Content-Length": chunkData.length.toString(),
    "X-Goog-Upload-Offset": session.uploadedBytes.toString(),
    "X-Goog-Upload-Command": command,
  };

  const response = await fetch(session.uploadUrl, {
    method: "PUT",
    headers,
    body: chunkData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to upload chunk: ${response.status} ${errorText}`);
  }

  // Update uploaded bytes
  session.uploadedBytes += chunkData.length;

  if (isLastChunk) {
    // Parse final response to get file info
    const result = await response.json();
    uploadSessions.delete(sessionId); // Clean up session

    return {
      success: true,
      fileUri: result.file?.uri,
    };
  }

  return { success: true };
};

export const geminiUploadRouter = createTRPCRouter({
  // Initiate streaming upload session
  initiateUpload: publicProcedure
    .input(
      z.object({
        fileName: z.string().min(1, "File name is required"),
        mimeType: z.string().min(1, "MIME type is required"),
        fileSize: z.number().positive("File size must be positive"),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        console.log("🚀 Initiating Gemini streaming upload:", {
          fileName: input.fileName,
          mimeType: input.mimeType,
          fileSize: input.fileSize,
        });

        const { uploadUrl, sessionId } = await initiateResumableUpload(
          input.fileName,
          input.mimeType,
          input.fileSize,
        );

        return {
          success: true,
          sessionId,
          uploadUrl,
        };
      } catch (error) {
        console.error("❌ Failed to initiate upload:", error);
        throw new Error(
          `Upload initiation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    }),

  // Upload chunk to Gemini
  uploadChunk: publicProcedure
    .input(
      z.object({
        sessionId: z.string().min(1, "Session ID is required"),
        chunkData: z.string().min(1, "Chunk data (base64) is required"),
        isLastChunk: z.boolean(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        console.log("📤 Uploading chunk:", {
          sessionId: input.sessionId,
          chunkSize: Buffer.from(input.chunkData, "base64").length,
          isLastChunk: input.isLastChunk,
        });

        const chunkBuffer = Buffer.from(input.chunkData, "base64");
        const result = await uploadChunk(
          input.sessionId,
          chunkBuffer,
          input.isLastChunk,
        );

        return {
          success: true,
          fileUri: result.fileUri,
        };
      } catch (error) {
        console.error("❌ Failed to upload chunk:", error);
        throw new Error(
          `Chunk upload failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    }),

  // Get upload session status
  getUploadStatus: publicProcedure
    .input(
      z.object({
        sessionId: z.string().min(1, "Session ID is required"),
      }),
    )
    .query(async ({ input }) => {
      try {
        const session = uploadSessions.get(input.sessionId);
        if (!session) {
          return {
            success: false,
            error: "Upload session not found",
          };
        }

        return {
          success: true,
          fileName: session.fileName,
          fileSize: session.fileSize,
          uploadedBytes: session.uploadedBytes,
          progress: Math.round(
            (session.uploadedBytes / session.fileSize) * 100,
          ),
        };
      } catch (error) {
        console.error("❌ Failed to get upload status:", error);
        throw new Error(
          `Status retrieval failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    }),

  // Health check for Gemini API
  healthCheck: publicProcedure.query(async () => {
    try {
      console.log("💚 Checking Gemini API health");

      // Simple test by trying to list files
      const response = await fetch(
        `${GEMINI_BASE_URL}/v1beta/files?key=${GEMINI_API_KEY}&pageSize=1`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      return {
        success: response.ok,
        status: response.ok ? "healthy" : "unhealthy",
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("❌ Gemini health check failed:", error);
      return {
        success: false,
        status: "unhealthy",
        timestamp: new Date().toISOString(),
      };
    }
  }),
});
