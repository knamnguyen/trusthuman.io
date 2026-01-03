import { z } from "zod";

import { S3BucketService } from "@sassy/s3";

import { createTRPCRouter, protectedProcedure } from "../trpc";

// Initialize S3 service for general uploads
// Uses same bucket as linkedin-preview for CORS compatibility
const s3Service = new S3BucketService({
  region: process.env.AWS_REGION || "us-west-2",
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  bucket:
    process.env.AWS_S3_LINKEDIN_PREVIEW_BUCKET || "engagekit-linkedin-preview",
});

/**
 * Generic S3 upload router for client-side uploads
 * Client gets presigned URL, uploads directly to S3
 */
export const s3UploadRouter = () =>
  createTRPCRouter({
    /**
     * Generate a presigned URL for direct client-to-S3 upload
     * @param folder - Storage folder (e.g., "comment-images", "avatars")
     * @param fileName - Original file name
     * @param contentType - MIME type of the file
     * @returns presignedUrl for PUT request, s3Key, and final s3Url
     */
    getUploadUrl: protectedProcedure
      .input(
        z.object({
          folder: z.string().min(1),
          fileName: z.string().min(1),
          contentType: z.string().default("image/jpeg"),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        const { folder, fileName, contentType } = input;

        // Generate unique key: folder/userId/timestamp-random.ext
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        const ext = fileName.split(".").pop() || "jpg";
        const sanitizedExt = ext.replace(/[^a-zA-Z0-9]/g, "");

        const s3Key = `${folder}/${ctx.user.id}/${timestamp}-${random}.${sanitizedExt}`;

        // Get presigned URL (15 min expiry)
        const presignedUrl = await s3Service.getPresignedUploadUrl(
          s3Key,
          contentType,
          900,
        );

        // Construct the final public URL
        const region = process.env.AWS_REGION || "us-west-2";
        const bucket = s3Service.getBucket();
        const s3Url = `https://${bucket}.s3.${region}.amazonaws.com/${s3Key}`;

        return {
          presignedUrl,
          s3Key,
          s3Url,
        };
      }),
  });
