import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  GetObjectCommandInput,
  S3ClientConfig,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Readable } from "stream";

import { S3Config, S3UploadResult, MultipartUploadInitResponse, MultipartUploadPartResponse, MultipartUploadCompleteRequest } from "./schema-validators";

/**
 * S3BucketService class for handling S3 bucket operations
 */
export class S3BucketService {
  private s3Client: S3Client;
  private bucket: string;
  private region: string;

  constructor(config: S3Config) {
    const s3Config: S3ClientConfig = {
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    };

    this.s3Client = new S3Client(s3Config);
    this.bucket = config.bucket;
    this.region = config.region;
  }

  /**
   * Get the bucket name
   * @returns The bucket name
   */
  getBucket(): string {
    return this.bucket;
  }

  /**
   * Upload a file to S3
   * @param file - The file to upload (Buffer, Blob, or ReadableStream)
   * @param key - The key to save the file under (including folder prefix)
   * @param contentType - The content type of the file
   * @param metadata - Additional metadata to store with the file
   * @returns The upload result with key, bucket, and location
   */
  async uploadFile(
    file: Buffer | Blob | ReadableStream | Readable,
    key: string,
    contentType?: string,
    metadata?: Record<string, string>,
  ): Promise<S3UploadResult> {
    try {
      const upload = new Upload({
        client: this.s3Client,
        params: {
          Bucket: this.bucket,
          Key: key,
          Body: file,
          ContentType: contentType,
          Metadata: metadata,
        },
      });

      const result = await upload.done();

      return {
        key,
        bucket: this.bucket,
        location: `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`,
        etag: result.ETag?.replace(/"/g, ""), // Remove quotes from ETag
      };
    } catch (error) {
      console.error("Error uploading file to S3:", error);
      throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Server-side multipart upload with automatic optimization and progress tracking
   * 
   * Use this method for:
   * - Server-side uploads (Node.js/Bun environments)
   * - Large files that benefit from multipart upload
   * - When you want automatic progress tracking
   * 
   * For client-side uploads with presigned URLs, use:
   * - initializeMultipartUpload()
   * - getPresignedUploadPartUrls() 
   * - completeMultipartUpload()
   * 
   * @param file - The file to upload (Buffer)
   * @param key - The key to save the file under (including folder prefix)
   * @param contentType - The content type of the file
   * @param metadata - Additional metadata to store with the file
   * @param multipartThreshold - Size threshold in bytes to use multipart upload (default: 100MB)
   * @returns The upload result with key, bucket, and location
   */
  async multipartUploadServer(
    file: Buffer,
    key: string,
    contentType?: string,
    metadata?: Record<string, string>,
    multipartThreshold = 100 * 1024 * 1024, // 100MB
  ): Promise<S3UploadResult> {
    try {
      // Use regular upload for smaller files
      if (file.length < multipartThreshold) {
        return await this.uploadFile(file, key, contentType, metadata);
      }

      console.log(`📦 Using multipart upload for large file (${(file.length / 1024 / 1024).toFixed(2)}MB)`);

      const upload = new Upload({
        client: this.s3Client,
        params: {
          Bucket: this.bucket,
          Key: key,
          Body: file,
          ContentType: contentType,
          Metadata: metadata,
        },
        // Configure multipart upload settings
        partSize: 10 * 1024 * 1024, // 10MB parts
        queueSize: 4, // Upload 4 parts in parallel
      });

      // Track upload progress
      upload.on("httpUploadProgress", (progress) => {
        if (progress.total) {
          const percent = ((progress.loaded || 0) / progress.total * 100).toFixed(1);
          console.log(`📈 Upload progress: ${percent}% (${(progress.loaded || 0) / 1024 / 1024} MB / ${progress.total / 1024 / 1024} MB)`);
        }
      });

      const result = await upload.done();

      return {
        key,
        bucket: this.bucket,
        location: `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`,
        etag: result.ETag?.replace(/"/g, ""), // Remove quotes from ETag
      };
    } catch (error) {
      console.error("Error uploading file via server multipart:", error);
      throw new Error(`Failed to upload file via server multipart: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Download a file from S3
   * @param key - The key of the file to download
   * @returns The file as a buffer
   */
  async downloadFile(key: string): Promise<Buffer> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const response = await this.s3Client.send(command);
      
      if (!response.Body) {
        throw new Error("Empty response body");
      }

      // Convert stream to buffer
      return await this.streamToBuffer(response.Body as Readable);
    } catch (error) {
      console.error("Error downloading file from S3:", error);
      throw new Error(`Failed to download file: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Get a presigned URL for downloading a file
   * @param key - The key of the file
   * @param expiresIn - The number of seconds until the URL expires (default: 3600)
   * @returns The presigned URL
   */
  async getPresignedDownloadUrl(
    key: string,
    expiresIn = 3600,
  ): Promise<string> {
    try {
      const params: GetObjectCommandInput = {
        Bucket: this.bucket,
        Key: key,
      };

      const command = new GetObjectCommand(params);
      return await getSignedUrl(this.s3Client, command, { expiresIn });
    } catch (error) {
      console.error("Error generating presigned URL:", error);
      throw new Error(`Failed to generate presigned URL: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Get a presigned URL for uploading a file (single part upload)
   * @param key - The key to save the file under (including folder prefix)
   * @param contentType - The content type of the file
   * @param expiresIn - The number of seconds until the URL expires (default: 3600)
   * @returns The presigned URL
   */
  async getPresignedUploadUrl(
    key: string,
    contentType?: string,
    expiresIn = 3600,
  ): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: contentType,
        ACL: "private",
      });

      return await getSignedUrl(this.s3Client, command, { 
        expiresIn,
      });
    } catch (error) {
      console.error("Error generating presigned upload URL:", error);
      throw new Error(`Failed to generate presigned upload URL: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Initialize a multipart upload for client-side presigned URL workflow
   * 
   * Use this approach for:
   * - Client-side uploads (browser/frontend)
   * - Presigned URL workflows for security
   * - Custom multipart upload implementations
   * 
   * For simple server-side uploads, use multipartUploadServer() instead.
   * 
   * @param key - The key to save the file under (including folder prefix)
   * @param contentType - The content type of the file
   * @returns Upload ID and initial data needed for multipart upload
   */
  async initializeMultipartUpload(
    key: string,
    contentType?: string,
  ): Promise<MultipartUploadInitResponse> {
    try {
      const command = new CreateMultipartUploadCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: contentType,
        ACL: "private",
      });

      const response = await this.s3Client.send(command);

      if (!response.UploadId) {
        throw new Error("Failed to get upload ID from S3");
      }

      return {
        uploadId: response.UploadId,
        key,
        bucket: this.bucket,
      };
    } catch (error) {
      console.error("Error initializing multipart upload:", error);
      throw new Error(`Failed to initialize multipart upload: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Get presigned URLs for uploading multiple parts (client-side workflow)
   * 
   * Part of the client-side multipart upload workflow:
   * 1. initializeMultipartUpload()
   * 2. getPresignedUploadPartUrls() ← You are here
   * 3. completeMultipartUpload()
   * 
   * @param key - The key of the file
   * @param uploadId - The upload ID from initialization
   * @param partNumbers - Array of part numbers (1-based)
   * @param expiresIn - The number of seconds until the URLs expire (default: 3600)
   * @returns Array of presigned URLs for each part
   */
  async getPresignedUploadPartUrls(
    key: string,
    uploadId: string,
    partNumbers: number[],
    expiresIn = 3600,
  ): Promise<MultipartUploadPartResponse[]> {
    try {
      const urlPromises = partNumbers.map(async (partNumber) => {
        const command = new UploadPartCommand({
          Bucket: this.bucket,
          Key: key,
          UploadId: uploadId,
          PartNumber: partNumber,
        });

        const url = await getSignedUrl(this.s3Client, command, { expiresIn });
        
        return {
          partNumber,
          uploadUrl: url,
        };
      });

      return await Promise.all(urlPromises);
    } catch (error) {
      console.error("Error generating presigned part URLs:", error);
      throw new Error(`Failed to generate presigned part URLs: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Complete a multipart upload (client-side workflow)
   * 
   * Final step of the client-side multipart upload workflow:
   * 1. initializeMultipartUpload()
   * 2. getPresignedUploadPartUrls()
   * 3. completeMultipartUpload() ← You are here
   * 
   * @param key - The key of the file
   * @param uploadId - The upload ID from initialization
   * @param parts - Array of completed parts with ETags
   * @returns The upload result
   */
  async completeMultipartUpload(
    key: string,
    uploadId: string,
    parts: MultipartUploadCompleteRequest['parts'],
  ): Promise<S3UploadResult> {
    try {
      const command = new CompleteMultipartUploadCommand({
        Bucket: this.bucket,
        Key: key,
        UploadId: uploadId,
        MultipartUpload: {
          Parts: parts.map((part: { partNumber: number; etag: string }) => ({
            ETag: part.etag,
            PartNumber: part.partNumber,
          })),
        },
      });

      const response = await this.s3Client.send(command);

      return {
        key,
        bucket: this.bucket,
        location: response.Location || `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`,
        etag: response.ETag?.replace(/"/g, ""),
      };
    } catch (error) {
      console.error("Error completing multipart upload:", error);
      throw new Error(`Failed to complete multipart upload: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Abort a multipart upload (cleanup for client-side workflow)
   * 
   * Use this to clean up failed multipart uploads from the client-side workflow.
   * Call this if any step in the multipart upload process fails.
   * 
   * @param key - The key of the file
   * @param uploadId - The upload ID from initialization
   * @returns True if successfully aborted
   */
  async abortMultipartUpload(
    key: string,
    uploadId: string,
  ): Promise<boolean> {
    try {
      const command = new AbortMultipartUploadCommand({
        Bucket: this.bucket,
        Key: key,
        UploadId: uploadId,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error) {
      console.error("Error aborting multipart upload:", error);
      throw new Error(`Failed to abort multipart upload: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Delete a file from S3
   * @param key - The key of the file to delete
   * @returns True if the file was deleted successfully
   */
  async deleteFile(key: string): Promise<boolean> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error) {
      console.error("Error deleting file from S3:", error);
      throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Check if a file exists in S3
   * @param key - The key of the file to check
   * @returns True if the file exists
   */
  async fileExists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * List files in a bucket with optional prefix
   * @param prefix - The prefix to filter by (e.g., "uploads/", "processed/")
   * @param maxKeys - The maximum number of keys to return (default: 1000)
   * @returns Array of file keys
   */
  async listFiles(
    prefix?: string,
    maxKeys = 1000,
  ): Promise<string[]> {
    try {
      const command = new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: prefix,
        MaxKeys: maxKeys,
      });

      const response = await this.s3Client.send(command);
      
      if (!response.Contents) {
        return [];
      }

      return response.Contents.map((item) => item.Key || "").filter(Boolean);
    } catch (error) {
      console.error("Error listing files from S3:", error);
      throw new Error(`Failed to list files: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Generate a unique key for a file with folder prefix
   * @param fileName - The original file name
   * @param folder - The folder prefix (e.g., "uploads", "processed", "thumbnails")
   * @returns A unique key for the file
   */
  generateUniqueKey(fileName: string, folder = "uploads"): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 10);
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    
    return `${folder}/${timestamp}-${randomString}-${sanitizedFileName}`;
  }

  /**
   * Convert a stream to a buffer
   * @param stream - The readable stream to convert
   * @returns A buffer containing the stream data
   */
  private async streamToBuffer(stream: Readable): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      
      stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
      stream.on("error", (err) => reject(err));
      stream.on("end", () => resolve(Buffer.concat(chunks)));
    });
  }
}

// Re-export schema validators
export * from "./schema-validators"; 