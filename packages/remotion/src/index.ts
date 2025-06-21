export * from "./config";

// Export RemotionService and types for direct import
export { RemotionService } from "./remotion-service";
export type {
  VideoProcessingRequest,
  RemotionRenderResult,
  RemotionProgress,
  VideoStitchRequest,
} from "./remotion-service";
