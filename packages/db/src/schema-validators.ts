// Import VideoSegment type from validators for segments field validation
import { z } from "zod";

import type { VideoSegment } from "@sassy/validators";
import { VideoSegmentSchema } from "@sassy/validators";

export * from "../generated/zod-prisma-validators";

// Validation schema for ShortDemo segments field
export const ShortDemoSegmentsSchema = z.array(VideoSegmentSchema);

// Type export for segments field
export type ShortDemoSegments = VideoSegment[];
