import { z } from "zod";

// Request to initiate resumable upload
export interface InitiateUploadRequest {
  fileName: string;
  mimeType: string;
  fileSize: number;
}

// Response from the /initiate endpoint
export interface InitiateUploadResponse {
  success: boolean;
  sessionId?: string;
  uploadUrl?: string;
  message?: string;
}

// Request to upload a chunk
export interface UploadChunkRequest {
  sessionId: string;
  chunkOffset: number;
  isLastChunk: boolean;
  // chunk data comes as form data
}

// Response from the /upload-chunk endpoint
export interface UploadChunkResponse {
  success: boolean;
  fileUri?: string; // Only present on last chunk
  uploadedBytes?: number;
  message?: string;
}

// Lambda event types
export interface LambdaFunctionUrlEvent {
  version: string;
  routeKey: string;
  rawPath: string;
  rawQueryString: string;
  headers: Record<string, string>;
  body: string | null;
  isBase64Encoded: boolean;
  requestContext: {
    accountId: string;
    apiId: string;
    domainName: string;
    http: {
      method: string;
      path: string;
      protocol: string;
      sourceIp: string;
      userAgent: string;
    };
    requestId: string;
    time: string;
    timeEpoch: number;
  };
}

export interface LambdaFunctionUrlResponse {
  statusCode: number;
  headers?: Record<string, string>;
  body: string;
}

export type { z };
