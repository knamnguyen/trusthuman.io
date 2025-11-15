import { createTRPCRouter } from "../trpc";
import { aiCommentsRouter } from "./ai-comments";
import { autoCommentRouter } from "./autocomment";
import { blacklistRouter } from "./blacklist";
import { browserRouter } from "./browser";
import { linkedinScrapeApifyRouter } from "./linkedin-scrape-apify";
import { profileImportRouter } from "./profile-import";
import { stripeRouter } from "./stripe";
import { targetListRouter } from "./target-list";
import { userRouter } from "./user";

export const appRouter = createTRPCRouter({
  stripe: stripeRouter,
  aiComments: aiCommentsRouter,
  user: userRouter,
  profileImport: profileImportRouter,
  linkedinScrapeApify: linkedinScrapeApifyRouter,
  browser: browserRouter,
  autocomment: autoCommentRouter,
  targetList: targetListRouter,
  blacklist: blacklistRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
