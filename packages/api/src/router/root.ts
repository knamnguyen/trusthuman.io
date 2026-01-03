import { createTRPCRouter } from "../trpc";
import { accountRouter } from "./account";
import { aiCommentsRouter } from "./ai-comments";
import { autoCommentRouter } from "./autocomment";
import { blacklistRouter } from "./blacklist";
import { browserRouter } from "./browser";
import { linkedinProfileScrapeRouter } from "./linkedin-profile-scrape";
import { linkedinScrapeApifyRouter } from "./linkedin-scrape-apify";
import { organizationRouter } from "./organization";
import { profileImportRouter } from "./profile-import";
import { s3UploadRouter } from "./s3-upload";
import { stripeRouter } from "./stripe";
import { targetListRouter } from "./target-list";
import { commentAiDetectorRouter } from "./tools/comment-ai-detector";
import { linkedInPreviewRouter } from "./tools/linkedin-preview";
import { userRouter } from "./user";

export const appRouter = createTRPCRouter({
  stripe: stripeRouter(),
  aiComments: aiCommentsRouter(),
  user: userRouter(),
  organization: organizationRouter(),
  profileImport: profileImportRouter(),
  linkedinScrapeApify: linkedinScrapeApifyRouter(),
  linkedinProfileScrape: linkedinProfileScrapeRouter(),
  browser: browserRouter(),
  autocomment: autoCommentRouter(),
  targetList: targetListRouter(),
  blacklist: blacklistRouter(),
  account: accountRouter(),
  linkedInPreview: linkedInPreviewRouter(),
  commentAiDetector: commentAiDetectorRouter(),
  s3Upload: s3UploadRouter(),
});

// export type definition of API
export type AppRouter = typeof appRouter;
