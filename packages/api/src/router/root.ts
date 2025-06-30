import { createTRPCRouter } from "../trpc";
import { postRouter } from "./post";
import { stripeRouter } from "./stripe";

export const appRouter = createTRPCRouter({
  post: postRouter,
  stripe: stripeRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
