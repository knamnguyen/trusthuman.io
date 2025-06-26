import { createTRPCRouter } from "../trpc";
import { postRouter } from "./post";
import { remotionRouter } from "./remotion";
import { remotionDemoStitchRouter } from "./remotion-demo-stitch";
import { remotionGeminiRouter } from "./remotion-gemini";
import { remotionHelloRouter } from "./remotion-hello";
import { stripeRouter } from "./stripe";
import { videoRouter } from "./video";

export const appRouter = createTRPCRouter({
  post: postRouter,
  stripe: stripeRouter,
  remotionHello: remotionHelloRouter,
  remotion: remotionRouter,
  remotionDemoStitch: remotionDemoStitchRouter,
  remotionGemini: remotionGeminiRouter,
  video: videoRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
