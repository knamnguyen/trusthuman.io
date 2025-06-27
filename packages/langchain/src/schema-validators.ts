import { z } from "zod";

export const VideoSearchQuerySchema = z.object({
  query: z.string().min(1, "Query cannot be empty"),
  limit: z.number().int().min(1).max(50).default(3),
});

export const VideoSearchResultSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  s3Url: z.string().url(),
  views: z.number().int().min(0),
  likes: z.number().int().min(0),
  comments: z.number().int().min(0),
  durationSeconds: z.number().int().min(0),
  hookEndTimestamp: z.string().nullable().optional(),
  hookCutUrl: z.string().nullable().optional(),
  similarity: z.number().min(0).max(1).optional(),
});

export const VideoSearchResponseSchema = z.array(VideoSearchResultSchema);

export type VideoSearchQuery = z.infer<typeof VideoSearchQuerySchema>;
export type VideoSearchResult = z.infer<typeof VideoSearchResultSchema>;
export type VideoSearchResponse = z.infer<typeof VideoSearchResponseSchema>;
