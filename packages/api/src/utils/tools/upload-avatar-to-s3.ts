import { S3BucketService } from "@sassy/s3";

import { uploadImageToS3, type UploadImageResult } from "../upload-image-to-s3";

/**
 * Upload a LinkedIn avatar URL to S3
 * Thin wrapper around uploadImageToS3 that generates avatar-specific keys
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
): Promise<UploadImageResult | null> {
  if (!avatarUrl) {
    return null;
  }

  const s3Key = s3Service.generateAvatarKey(userId, "avatar.jpg");
  return uploadImageToS3(avatarUrl, s3Key, s3Service);
}
