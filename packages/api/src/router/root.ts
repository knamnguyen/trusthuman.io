import { createTRPCRouter } from "../trpc";
import { aiCommentsRouter } from "./ai-comments";
import { stripeRouter } from "./stripe";
import { userRouter } from "./user";

export const appRouter = createTRPCRouter({
  stripe: stripeRouter,
  aiComments: aiCommentsRouter,
  user: userRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
