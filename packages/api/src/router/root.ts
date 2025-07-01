import { createTRPCRouter } from "../trpc";
import { stripeRouter } from "./stripe";

export const appRouter = createTRPCRouter({
  stripe: stripeRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
