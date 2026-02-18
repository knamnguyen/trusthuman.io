import { createTRPCRouter } from "../trpc";
import { userRouter } from "./user";
import { verificationRouter } from "./verification";
import { trustProfileRouter } from "./trust-profile";
import { platformLinkRouter } from "./platform-link";

export const appRouter = createTRPCRouter({
  user: userRouter,
  verification: verificationRouter,
  trustProfile: trustProfileRouter,
  platformLink: platformLinkRouter,
});

// Export type router type signature, NOT the router itself
export type AppRouter = typeof appRouter;
