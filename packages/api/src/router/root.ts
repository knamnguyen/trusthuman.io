import { createTRPCRouter } from "../trpc";
import { geminiUploadRouter } from "./gemini-upload";
import { postRouter } from "./post";
import { remotionRouter } from "./remotion";
import { remotionDemoStitchRouter } from "./remotion-demo-stitch";
import { remotionGeminiRouter } from "./remotion-gemini";
import { remotionHelloRouter } from "./remotion-hello";
import { stripeRouter } from "./stripe";
import { videoRouter } from "./video";
import { viralStitchRouter } from "./viral-stitch";

export const appRouter = createTRPCRouter({
  post: postRouter,
  stripe: stripeRouter,
  remotionHello: remotionHelloRouter,
  remotion: remotionRouter,
  remotionDemoStitch: remotionDemoStitchRouter,
  remotionGemini: remotionGeminiRouter,
  video: videoRouter,
  viralStitch: viralStitchRouter,
  geminiUpload: geminiUploadRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
