import { createTRPCRouter } from "../trpc";
import { aiCommentsRouter } from "./ai-comments";
import { browserRouter } from "./browser";
import { linkedinScrapeApifyRouter } from "./linkedin-scrape-apify";
import { profileImportRouter } from "./profile-import";
import { stripeRouter } from "./stripe";
import { userRouter } from "./user";

export const appRouter = createTRPCRouter({
  stripe: stripeRouter,
  aiComments: aiCommentsRouter,
  user: userRouter,
  profileImport: profileImportRouter,
  linkedinScrapeApify: linkedinScrapeApifyRouter,
  browser: browserRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
