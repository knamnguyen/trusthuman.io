// Main exports for the Gemini Video service package
export {
  createGeminiVideoService,
  GeminiVideoService,
} from "./gemini-video-service";

export type {
  Color,
  ColorPalette,
  DemoVideoInput,
  DemoVideoResponse,
  DemoVideoFromMasterScriptInput,
  DemoVideoFromMasterScriptResponse,
  GeminiFileResponse,
  GeminiVideoConfig,
  MasterScriptEntry,
  MasterScriptInput,
  MasterScriptResponse,
  VideoProcessingInput,
  VideoSegment,
  ViralHookInput,
  ViralHookResponse,
} from "./schema-validators";

export {
  ColorPaletteSchema,
  ColorSchema,
  DemoVideoInputSchema,
  DemoVideoResponseSchema,
  DemoVideoFromMasterScriptInputSchema,
  DemoVideoFromMasterScriptResponseSchema,
  GeminiFileResponseSchema,
  GeminiVideoConfigSchema,
  MasterScriptEntrySchema,
  MasterScriptInputSchema,
  MasterScriptResponseSchema,
  VideoProcessingInputSchema,
  ViralHookInputSchema,
  ViralHookResponseSchema,
} from "./schema-validators";
