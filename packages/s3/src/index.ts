import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  S3ClientConfig,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { S3Config } from "./schema-validators";

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
   * Get a presigned URL for uploading a file (single part upload)
   * @param key - The key to save the file under (including folder prefix)
   * @param contentType - The content type of the file
   * @param expiresIn - The number of seconds until the URL expires (default: 900 = 15 minutes)
   * @returns The presigned URL
   */
  async getPresignedUploadUrl(
    key: string,
    contentType?: string,
    expiresIn = 900,
  ): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: contentType,
      });

      return await getSignedUrl(this.s3Client as any, command as any, {
        expiresIn,
      });
    } catch (error) {
      console.error("Error generating presigned upload URL:", error);
      throw new Error(`Failed to generate presigned upload URL: ${error instanceof Error ? error.message : "Unknown error"}`);
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
   * Generate a unique key for a file with user-specific folder prefix
   * @param userId - The user ID for folder organization
   * @param fileName - The original file name
   * @returns A unique key for the file
   */
  generateUniqueKey(userId: string, fileName: string): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 10);
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const ext = fileName.split('.').pop() || 'jpg';

    return `images/${userId}/${timestamp}-${randomString}.${ext}`;
  }

  /**
   * Generate a unique key for comment avatar uploads
   * Uses a separate folder structure: comment-screenshots/{userId}/avatar-{timestamp}-{random}.{ext}
   * @param userId - The user ID for folder organization
   * @param fileName - The original file name or default to 'avatar.jpg'
   * @returns A unique key for the avatar file
   */
  generateAvatarKey(userId: string, fileName: string = 'avatar.jpg'): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 10);
    const ext = fileName.split('.').pop() || 'jpg';

    return `comment-screenshots/${userId}/avatar-${timestamp}-${randomString}.${ext}`;
  }
}

// Re-export schema validators
export * from "./schema-validators";
