const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com";

if (!GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is required");
}

interface ResumableSession {
  uploadUrl: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  uploadedBytes: number;
  geminiUploadedBytes: number; // Bytes actually sent to Gemini
  chunkBuffer: Buffer; // Buffer for accumulating 4MB chunks into 8MB chunks
}

export class GeminiUploadClient {
  private sessions = new Map<string, ResumableSession>();

  async initiateResumableUpload(
    fileName: string,
    mimeType: string,
    fileSize: number,
  ): Promise<{ sessionId: string; uploadUrl: string }> {
    console.log("🔄 Initiating resumable upload to Gemini:", {
      fileName,
      mimeType,
      fileSize,
    });

    // Step 1: Start resumable upload session with Gemini
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
        `Failed to initiate resumable upload: ${response.status} ${errorText}`,
      );
    }

    const uploadUrl = response.headers.get("X-Goog-Upload-URL");
    if (!uploadUrl) {
      throw new Error("No upload URL returned from Gemini");
    }

    // Create session
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.sessions.set(sessionId, {
      uploadUrl,
      fileName,
      mimeType,
      fileSize,
      uploadedBytes: 0,
      geminiUploadedBytes: 0,
      chunkBuffer: Buffer.alloc(0),
    });

    console.log("✅ Resumable upload session created:", { sessionId });
    return { sessionId, uploadUrl };
  }

  async uploadChunk(
    sessionId: string,
    chunkData: Buffer,
    chunkOffset: number,
    isLastChunk: boolean,
  ): Promise<{ success: boolean; fileUri?: string }> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Upload session ${sessionId} not found`);
    }

    console.log("📤 Processing 4MB chunk for buffering:", {
      sessionId,
      chunkSize: chunkData.length,
      chunkOffset,
      isLastChunk,
      currentBufferSize: session.chunkBuffer.length,
    });

    // Add this chunk to our buffer
    session.chunkBuffer = Buffer.concat([session.chunkBuffer, chunkData]);
    session.uploadedBytes = chunkOffset + chunkData.length;

    const GEMINI_CHUNK_SIZE = 8 * 1024 * 1024; // 8MB chunks for Gemini

    // Check if we have enough data to send to Gemini (8MB) or if this is the last chunk
    if (session.chunkBuffer.length >= GEMINI_CHUNK_SIZE || isLastChunk) {
      let dataToSend: Buffer;
      let remainingBuffer: Buffer;

      if (isLastChunk) {
        // Send all remaining data
        dataToSend = session.chunkBuffer;
        remainingBuffer = Buffer.alloc(0);
      } else {
        // Send exactly 8MB and keep the rest in buffer
        dataToSend = session.chunkBuffer.subarray(0, GEMINI_CHUNK_SIZE);
        remainingBuffer = session.chunkBuffer.subarray(GEMINI_CHUNK_SIZE);
      }

      console.log("🚀 Sending buffered chunk to Gemini:", {
        dataSize: dataToSend.length,
        remainingBufferSize: remainingBuffer.length,
        geminiOffset: session.geminiUploadedBytes,
        isLastChunk,
      });

      const command = isLastChunk ? "upload, finalize" : "upload";

      const uploadResponse = await fetch(session.uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Length": dataToSend.length.toString(),
          "X-Goog-Upload-Offset": session.geminiUploadedBytes.toString(),
          "X-Goog-Upload-Command": command,
        },
        body: dataToSend,
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(
          `Failed to upload chunk: ${uploadResponse.status} ${errorText}`,
        );
      }

      // Update session
      session.geminiUploadedBytes += dataToSend.length;
      session.chunkBuffer = remainingBuffer;

      if (isLastChunk) {
        const result = (await uploadResponse.json()) as {
          file?: { uri?: string };
        };
        const fileUri = result.file?.uri;

        if (!fileUri) {
          throw new Error("No file URI returned from Gemini upload");
        }

        // Clean up session
        this.sessions.delete(sessionId);

        console.log("✅ File uploaded to Gemini successfully:", fileUri);
        return { success: true, fileUri };
      }

      console.log("✅ 8MB chunk uploaded to Gemini successfully");
    } else {
      console.log("📦 Chunk buffered, waiting for more data to reach 8MB");
    }

    return { success: true };
  }

  getSession(sessionId: string): ResumableSession | undefined {
    return this.sessions.get(sessionId);
  }

  deleteSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }
}
