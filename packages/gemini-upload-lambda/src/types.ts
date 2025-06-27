import { z } from "zod";

// Request/Response Schemas
export const InitiateUploadRequestSchema = z.object({
  fileName: z.string().min(1, "File name is required"),
  mimeType: z.string().min(1, "MIME type is required"),
  fileSize: z.number().positive("File size must be positive"),
});

export const UploadChunkRequestSchema = z.object({
  sessionId: z.string().min(1, "Session ID is required"),
  chunkData: z.string().min(1, "Chunk data is required"), // base64 encoded
  isLastChunk: z.boolean().default(false),
});

export const FinalizeUploadRequestSchema = z.object({
  sessionId: z.string().min(1, "Session ID is required"),
});

// Response Schemas
export const InitiateUploadResponseSchema = z.object({
  sessionId: z.string(),
  uploadUrl: z.string(),
});

export const UploadChunkResponseSchema = z.object({
  sessionId: z.string(),
  bytesUploaded: z.number(),
  totalBytes: z.number(),
  percentage: z.number(),
  fileUri: z.string().optional(), // Only present on last chunk
});

export const FinalizeUploadResponseSchema = z.object({
  fileUri: z.string(),
  mimeType: z.string(),
  name: z.string(),
});

export const ErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
  statusCode: z.number(),
});

// Type exports
export type InitiateUploadRequest = z.infer<typeof InitiateUploadRequestSchema>;
export type UploadChunkRequest = z.infer<typeof UploadChunkRequestSchema>;
export type FinalizeUploadRequest = z.infer<typeof FinalizeUploadRequestSchema>;

export type InitiateUploadResponse = z.infer<
  typeof InitiateUploadResponseSchema
>;
export type UploadChunkResponse = z.infer<typeof UploadChunkResponseSchema>;
export type FinalizeUploadResponse = z.infer<
  typeof FinalizeUploadResponseSchema
>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

// Internal Types
export interface UploadSession {
  sessionId: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  uploadUrl: string;
  buffer: Buffer[];
  totalBytesReceived: number;
  geminiFile?: {
    name: string;
    uri: string;
  };
}

export interface ChunkBuffer {
  data: Buffer;
  isLastChunk: boolean;
}

// Lambda Event Types
export interface APIGatewayProxyEventV2 {
  version: string;
  routeKey: string;
  rawPath: string;
  rawQueryString: string;
  headers: Record<string, string>;
  requestContext: {
    requestId: string;
    http: {
      method: string;
      path: string;
      protocol: string;
      sourceIp: string;
      userAgent: string;
    };
  };
  body?: string;
  isBase64Encoded: boolean;
}

export interface APIGatewayProxyResultV2 {
  statusCode: number;
  headers?: Record<string, string>;
  body?: string;
  isBase64Encoded?: boolean;
}
