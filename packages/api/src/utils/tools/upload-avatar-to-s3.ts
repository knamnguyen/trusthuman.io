import axios from "axios";

import { S3BucketService } from "@sassy/s3";

/**
 * Upload a LinkedIn avatar URL to S3
 * Fetches the image from LinkedIn and uploads it to S3 to avoid expiration
 *
 * @param avatarUrl - Original LinkedIn avatar URL (may expire)
 * @param userId - User ID for S3 folder organization
 * @param s3Service - Initialized S3BucketService instance
 * @returns Object with s3Key and s3Url, or null if upload fails
 */
export async function uploadAvatarToS3(
  avatarUrl: string | null,
  userId: string,
  s3Service: S3BucketService,
): Promise<{ s3Key: string; s3Url: string } | null> {
  if (!avatarUrl) {
    return null;
  }

  try {
    // Fetch image from LinkedIn URL
    const response = await axios.get(avatarUrl, {
      responseType: "arraybuffer",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      },
    });

    const imageBuffer = Buffer.from(response.data);
    const contentType = response.headers["content-type"] || "image/jpeg";

    // Generate unique S3 key
    const s3Key = s3Service.generateAvatarKey(userId, "avatar.jpg");

    // Get presigned URL
    const presignedUrl = await s3Service.getPresignedUploadUrl(
      s3Key,
      contentType,
      300, // 5 min expiry (short-lived)
    );

    // Upload to S3 via presigned URL
    await axios.put(presignedUrl, imageBuffer, {
      headers: {
        "Content-Type": contentType,
      },
    });

    // Construct public S3 URL
    const region = process.env.AWS_REGION || "us-west-2";
    const bucket =
      process.env.AWS_S3_LINKEDIN_PREVIEW_BUCKET || "engagekit-linkedin-preview";
    const s3Url = `https://${bucket}.s3.${region}.amazonaws.com/${s3Key}`;

    return { s3Key, s3Url };
  } catch (error) {
    console.error("Failed to upload avatar to S3:", error);
    return null;
  }
}
