import axios from "axios";

import { S3BucketService } from "@sassy/s3";

export interface UploadImageResult {
  s3Key: string;
  s3Url: string;
}

/**
 * Upload an image from a URL to S3
 *
 * @param imageUrl - Source image URL (can be expiring CDN URL)
 * @param s3Key - Destination S3 key (caller controls the path)
 * @param s3Service - Initialized S3BucketService instance
 * @returns Object with s3Key and s3Url, or null if upload fails
 */
export async function uploadImageToS3(
  imageUrl: string,
  s3Key: string,
  s3Service: S3BucketService,
): Promise<UploadImageResult | null> {
  try {
    // Fetch image from source URL
    const response = await axios.get(imageUrl, {
      responseType: "arraybuffer",
      timeout: 30000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      },
    });

    const imageBuffer = Buffer.from(response.data);
    const contentType = response.headers["content-type"] || "image/jpeg";

    // Get presigned URL for upload
    const presignedUrl = await s3Service.getPresignedUploadUrl(
      s3Key,
      contentType,
      300, // 5 min expiry
    );

    // Upload to S3
    await axios.put(presignedUrl, imageBuffer, {
      headers: {
        "Content-Type": contentType,
      },
    });

    // Construct public S3 URL
    const region = process.env.AWS_REGION || "us-west-2";
    const bucket = s3Service.getBucket();
    const s3Url = `https://${bucket}.s3.${region}.amazonaws.com/${s3Key}`;

    return { s3Key, s3Url };
  } catch (error) {
    console.error(`[upload-image-to-s3] Failed to upload ${s3Key}:`, error);
    return null;
  }
}

/**
 * Generate a simple unique S3 key for an image
 *
 * @param folder - Folder path (e.g., "linkedin-profiles" or "avatars")
 * @param identifier - Unique identifier (e.g., urn, userId)
 * @returns S3 key like "folder/identifier/timestamp-random.jpg"
 */
export function generateImageKey(folder: string, identifier: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  // Sanitize identifier to be S3-key safe
  const sanitized = identifier.replace(/[^a-zA-Z0-9-_]/g, "_");
  return `${folder}/${sanitized}/${timestamp}-${random}.jpg`;
}
