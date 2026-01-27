import { createTRPCRouter } from "../trpc";
import { accountRouter } from "./account";
import { achievementsRouter } from "./achievements";
import { aiCommentsRouter } from "./ai-comments";
import { autoCommentRouter } from "./autocomment";
import { commentRouter } from "./comment";
// import { blacklistRouter } from "./blacklist";
import { browserRouter } from "./browser";
import { linkedinProfileScrapeRouter } from "./linkedin-profile-scrape";
import { linkedinScrapeApifyRouter } from "./linkedin-scrape-apify";
import { organizationRouter } from "./organization";
import { personaRouter } from "./persona";
import { profileImportRouter } from "./profile-import";
import { s3UploadRouter } from "./s3-upload";
import { settingsRouter } from "./settings";
import { socialReferralRouter } from "./social-referral";
import { stripeRouter } from "./stripe";
import { targetListRouter } from "./target-list";
import { commentAiDetectorRouter } from "./tools/comment-ai-detector";
import { linkedInPreviewRouter } from "./tools/linkedin-preview";
import { userRouter } from "./user";

export const appRouter = createTRPCRouter({
  stripe: stripeRouter(),
  aiComments: aiCommentsRouter(),
  user: userRouter(),
  persona: personaRouter(),
  organization: organizationRouter(),
  profileImport: profileImportRouter(),
  linkedinScrapeApify: linkedinScrapeApifyRouter(),
  linkedinProfileScrape: linkedinProfileScrapeRouter(),
  browser: browserRouter(),
  autocomment: autoCommentRouter(),
  comment: commentRouter(),
  targetList: targetListRouter(),
  // blacklist: blacklistRouter(),
  account: accountRouter(),
  linkedInPreview: linkedInPreviewRouter(),
  commentAiDetector: commentAiDetectorRouter(),
  s3Upload: s3UploadRouter(),
  settings: settingsRouter(),
  achievements: achievementsRouter(),
  socialReferral: socialReferralRouter(),
});

// export type definition of API
export type AppRouter = typeof appRouter;
