// Import VideoSegment type from gemini-video for segments field validation
import { z } from "zod";

import type { VideoSegment } from "@sassy/gemini-video";
import { VideoSegmentSchema } from "@sassy/gemini-video";

export * from "../generated/zod-prisma-validators";

// Validation schema for ShortDemo segments field
export const ShortDemoSegmentsSchema = z.array(VideoSegmentSchema);

// Type export for segments field
export type ShortDemoSegments = VideoSegment[];
