import { z } from "zod";

// Video validation constants
export const VIDEO_CONSTRAINTS = {
  MAX_SIZE: 2 * 1024 * 1024 * 1024, // 2GB
  MAX_DURATION: 5 * 60, // 5 minutes in seconds
  TARGET_COMPRESSED_SIZE: 18 * 1024 * 1024, // 18MB target for compression
  SUPPORTED_FORMATS: [".mp4", ".mov", ".avi", ".mkv", ".webm"],
} as const;

// Video metadata schema
export const videoMetadataSchema = z.object({
  duration: z.number().positive(),
  size: z.number().positive(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  format: z.string(),
});

export type VideoMetadata = z.infer<typeof videoMetadataSchema>;

// Video validation result schema
export const videoValidationResultSchema = z.object({
  isValid: z.boolean(),
  errors: z.array(z.string()),
  metadata: videoMetadataSchema.optional(),
});

export type VideoValidationResult = z.infer<typeof videoValidationResultSchema>;

// Compression settings schema
export const compressionSettingsSchema = z.object({
  targetSize: z.number().default(VIDEO_CONSTRAINTS.TARGET_COMPRESSED_SIZE),
  format: z.literal("webm").default("webm"),
  videoBitsPerSecond: z.number().optional(),
  audioBitsPerSecond: z.number().optional(),
});

export type CompressionSettings = z.infer<typeof compressionSettingsSchema>;

// Video processing status schema
export const videoProcessingStatusSchema = z.object({
  id: z.string(),
  status: z.enum(["pending", "compressing", "completed", "failed"]),
  progress: z.number().min(0).max(100),
  originalSize: z.number(),
  compressedSize: z.number().optional(),
  error: z.string().optional(),
});

export type VideoProcessingStatus = z.infer<typeof videoProcessingStatusSchema>;
