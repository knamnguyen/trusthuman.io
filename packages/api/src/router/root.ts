import { createTRPCRouter } from "../trpc";
import { aiCommentsRouter } from "./ai-comments";
import { stripeRouter } from "./stripe";

export const appRouter = createTRPCRouter({
  stripe: stripeRouter,
  aiComments: aiCommentsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
