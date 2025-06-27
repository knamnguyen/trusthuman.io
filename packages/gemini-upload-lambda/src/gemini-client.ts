import { GoogleGenAI } from "@google/genai";

import type { ChunkBuffer, UploadSession } from "./types";

const GEMINI_CHUNK_SIZE = 8 * 1024 * 1024; // 8MB as required by Gemini Files API

export class GeminiUploadClient {
  private genAI: GoogleGenAI;
  private sessions: Map<string, UploadSession> = new Map();

  constructor(apiKey: string) {
    this.genAI = new GoogleGenAI({ apiKey });
  }

  /**
   * Create new upload session with Gemini Files API
   */
  async createUploadSession(
    fileName: string,
    mimeType: string,
    fileSize: number,
  ): Promise<{ sessionId: string; uploadUrl: string }> {
    try {
      console.log("🚀 Creating Gemini upload session:", {
        fileName,
        mimeType,
        fileSize,
      });

      // Create session identifier for chunked upload
      const sessionId = this.generateSessionId();

      // Store session state - we'll upload to Gemini when we have complete chunks
      const session: UploadSession = {
        sessionId,
        fileName,
        mimeType,
        fileSize,
        uploadUrl: `lambda-session://${sessionId}`, // Internal session URL
        buffer: [],
        totalBytesReceived: 0,
      };

      this.sessions.set(sessionId, session);

      console.log("✅ Gemini upload session created:", {
        sessionId,
        uploadUrl: session.uploadUrl,
      });

      return {
        sessionId,
        uploadUrl: session.uploadUrl,
      };
    } catch (error) {
      console.error("❌ Failed to create Gemini upload session:", error);
      throw new Error(`Failed to create upload session: ${error}`);
    }
  }

  /**
   * Process chunk data and buffer until we have 8MB chunks for Gemini
   */
  async processChunk(
    sessionId: string,
    chunkData: string,
    isLastChunk: boolean,
  ): Promise<{
    bytesUploaded: number;
    totalBytes: number;
    percentage: number;
    fileUri?: string;
  }> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Upload session not found: ${sessionId}`);
    }

    try {
      // Convert base64 chunk data to Buffer
      const chunkBuffer = Buffer.from(chunkData, "base64");
      session.buffer.push(chunkBuffer);
      session.totalBytesReceived += chunkBuffer.length;

      console.log(`📦 Buffering chunk for session ${sessionId}:`, {
        chunkSize: chunkBuffer.length,
        totalBuffered: session.totalBytesReceived,
        totalFileSize: session.fileSize,
        isLastChunk,
      });

      // Calculate current buffer size
      const currentBufferSize = session.buffer.reduce(
        (total, buf) => total + buf.length,
        0,
      );

      let fileUri: string | undefined;

      // Upload to Gemini when we have 8MB or it's the last chunk
      if (currentBufferSize >= GEMINI_CHUNK_SIZE || isLastChunk) {
        console.log("🚀 Uploading to Gemini:", {
          bufferSize: currentBufferSize,
          isLastChunk,
          meetsMinSize: currentBufferSize >= GEMINI_CHUNK_SIZE,
        });

        // Combine all buffered chunks
        const combinedBuffer = Buffer.concat(session.buffer);

        // Upload combined chunk to Gemini
        const result = await this.uploadToGemini(
          session,
          combinedBuffer,
          isLastChunk,
        );

        if (result.fileUri) {
          fileUri = result.fileUri;
          session.geminiFile = {
            name: session.fileName,
            uri: result.fileUri,
          };
        }

        // Clear buffer after successful upload
        session.buffer = [];
      }

      const percentage = Math.round(
        (session.totalBytesReceived / session.fileSize) * 100,
      );

      console.log(`📊 Upload progress for session ${sessionId}:`, {
        bytesUploaded: session.totalBytesReceived,
        totalBytes: session.fileSize,
        percentage,
        fileUri,
      });

      return {
        bytesUploaded: session.totalBytesReceived,
        totalBytes: session.fileSize,
        percentage,
        fileUri,
      };
    } catch (error) {
      console.error(
        `❌ Failed to process chunk for session ${sessionId}:`,
        error,
      );
      throw new Error(`Failed to process chunk: ${error}`);
    }
  }

  /**
   * Upload combined buffer to Gemini Files API
   */
  private async uploadToGemini(
    session: UploadSession,
    data: Buffer,
    isLastChunk: boolean,
  ): Promise<{ fileUri?: string }> {
    try {
      console.log("🔄 Uploading to Gemini Files API:", {
        sessionId: session.sessionId,
        dataSize: data.length,
        isLastChunk,
      });

      // Convert Buffer to Blob for Gemini API
      const blob = new Blob([data], { type: session.mimeType });

      // Upload the file to Gemini using correct API
      const uploadResult = await this.genAI.files.upload({
        file: blob,
        config: {
          mimeType: session.mimeType,
          displayName: session.fileName,
        },
      });

      console.log("✅ Successfully uploaded to Gemini:", {
        fileUri: uploadResult.uri,
        name: uploadResult.name,
      });

      // Return file URI if this is the final chunk
      if (isLastChunk) {
        return { fileUri: uploadResult.uri };
      }

      return {};
    } catch (error) {
      console.error("❌ Failed to upload to Gemini Files API:", error);
      throw new Error(`Gemini upload failed: ${error}`);
    }
  }

  /**
   * Finalize upload and return file metadata
   */
  async finalizeUpload(sessionId: string): Promise<{
    fileUri: string;
    mimeType: string;
    name: string;
  }> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Upload session not found: ${sessionId}`);
    }

    if (!session.geminiFile) {
      throw new Error(`No Gemini file found for session: ${sessionId}`);
    }

    try {
      console.log("🏁 Finalizing upload for session:", sessionId);

      const result = {
        fileUri: session.geminiFile.uri,
        mimeType: session.mimeType,
        name: session.fileName,
      };

      // Clean up session
      this.sessions.delete(sessionId);

      console.log("✅ Upload finalized successfully:", result);
      return result;
    } catch (error) {
      console.error(
        `❌ Failed to finalize upload for session ${sessionId}:`,
        error,
      );
      throw new Error(`Failed to finalize upload: ${error}`);
    }
  }

  /**
   * Clean up session (for error cases)
   */
  async cleanupSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      console.log(`🧹 Cleaning up session: ${sessionId}`);
      this.sessions.delete(sessionId);
    }
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `gemini-upload-${Date.now()}-${Math.random().toString(36).substring(2)}`;
  }
}
