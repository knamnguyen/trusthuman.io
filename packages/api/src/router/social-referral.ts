import { TRPCError } from "@trpc/server";

import {
  getSubmissionStatusSchema,
  listSubmissionsSchema,
  submitPostSchema,
} from "@sassy/social-referral/schema-validators";
import { normalizeUrl } from "@sassy/social-referral";

import { verifySocialSubmission } from "../services/social-referral-verification";
import { createTRPCRouter, protectedProcedure } from "../trpc";

/**
 * Social Referral Router - Handle social media post submissions for premium rewards
 *
 * All procedures require authenticated user + selected organization
 */
export const socialReferralRouter = () =>
  createTRPCRouter({
    /**
     * Submit a social media post for verification
     * Creates a submission record and triggers async verification
     */
    submit: protectedProcedure
      .input(submitPostSchema)
      .mutation(async ({ ctx, input }) => {
        if (!ctx.activeOrg) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "No active organization selected",
          });
        }

        // NOTE: No eligibility check - any org can participate
        // Free days will apply to FIRST account added to org (handled in verification service)

        // Normalize URL for duplicate detection
        const normalized = normalizeUrl(input.postUrl);

        // Check if URL already submitted (globally, not per-org)
        const existingSubmission = await ctx.db.socialSubmission.findUnique({
          where: {
            urlNormalized: normalized,
          },
        });

        if (existingSubmission) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "This post has already been submitted by another organization",
          });
        }

        // Create submission record with VERIFYING status
        const submission = await ctx.db.socialSubmission.create({
          data: {
            organizationId: ctx.activeOrg.id,
            platform: input.platform.toUpperCase() as
              | "X"
              | "LINKEDIN"
              | "THREADS"
              | "FACEBOOK",
            postUrl: input.postUrl,
            urlNormalized: normalized,
            status: "VERIFYING",
          },
        });

        // Trigger verification asynchronously (fire-and-forget)
        // Phase 2: Replace with proper job queue
        void verifySocialSubmission(ctx.db, submission.id).catch((error) => {
          console.error(
            `[Social Referral] Async verification failed for ${submission.id}:`,
            error,
          );
        });

        // Return immediately - verification happens in background
        return {
          id: submission.id,
          status: "verifying" as const,
          daysAwarded: 0,
        };
      }),

    /**
     * Get submission status by ID
     */
    getStatus: protectedProcedure
      .input(getSubmissionStatusSchema)
      .query(async ({ ctx, input }) => {
        if (!ctx.activeOrg) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "No active organization selected",
          });
        }

        const submission = await ctx.db.socialSubmission.findUnique({
          where: {
            id: input.submissionId,
            organizationId: ctx.activeOrg.id,
          },
        });

        if (!submission) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Submission not found",
          });
        }

        return {
          id: submission.id,
          platform: submission.platform.toLowerCase(),
          postUrl: submission.postUrl,
          status: submission.status,
          submittedAt: submission.submittedAt,
          verifiedAt: submission.verifiedAt,
          containsKeyword: submission.containsKeyword,
          postText: submission.postText,
          likes: submission.likes,
          comments: submission.comments,
          shares: submission.shares,
          daysAwarded: submission.daysAwarded,
        };
      }),

    /**
     * List all submissions for current organization
     */
    list: protectedProcedure
      .input(listSubmissionsSchema)
      .query(async ({ ctx, input }) => {
        if (!ctx.activeOrg) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "No active organization selected",
          });
        }

        const submissions = await ctx.db.socialSubmission.findMany({
          where: {
            organizationId: ctx.activeOrg.id,
          },
          orderBy: {
            submittedAt: "desc",
          },
          take: input.limit,
          skip: input.offset,
        });

        return submissions.map((submission) => ({
          id: submission.id,
          platform: submission.platform.toLowerCase(),
          postUrl: submission.postUrl,
          status: submission.status,
          submittedAt: submission.submittedAt,
          verifiedAt: submission.verifiedAt,
          containsKeyword: submission.containsKeyword,
          postText: submission.postText,
          daysAwarded: submission.daysAwarded,
          likes: submission.likes,
          comments: submission.comments,
          shares: submission.shares,
        }));
      }),

    /**
     * Get current organization's earned premium status
     */
    getEarnedPremiumStatus: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.activeOrg) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No active organization selected",
        });
      }

      const org = await ctx.db.organization.findUnique({
        where: { id: ctx.activeOrg.id },
        select: {
          earnedPremiumExpiresAt: true,
        },
      });

      if (!org) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Organization not found",
        });
      }

      const now = new Date();
      const isActive = org.earnedPremiumExpiresAt
        ? org.earnedPremiumExpiresAt > now
        : false;
      const daysRemaining = org.earnedPremiumExpiresAt
        ? Math.ceil(
            (org.earnedPremiumExpiresAt.getTime() - now.getTime()) /
              (1000 * 60 * 60 * 24),
          )
        : 0;

      return {
        isActive,
        expiresAt: org.earnedPremiumExpiresAt,
        daysRemaining: isActive ? daysRemaining : 0,
      };
    }),

    /**
     * Generate a social media caption for promoting EngageKit
     * Uses AI to create unique captions based on previous submissions
     */
    generateCaption: protectedProcedure.mutation(async ({ ctx }) => {
      if (!ctx.activeOrg) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No active organization selected",
        });
      }

      // Fetch last 10 submissions to avoid repetition
      const recentSubmissions = await ctx.db.socialSubmission.findMany({
        where: {
          organizationId: ctx.activeOrg.id,
          postText: { not: null },
        },
        select: { postText: true },
        orderBy: { submittedAt: "desc" },
        take: 10,
      });

      const previousCaptions = recentSubmissions
        .map((s) => s.postText)
        .filter(Boolean)
        .join("\n\n");

      // Context about EngageKit - focus on engagement workflow and speed
      const engageKitContext = `LinkedIn engagement that feels real, because it is.

EngageKit helps you engage 10x faster while keeping your authentic voice. No autopilot. No bot behavior. Just an optimized workflow that lets you leave 100+ meaningful comments without burning out.

HOW IT WORKS

1. EngageKit loads the latest posts from your network automatically
2. Optimized sidebar UI lets you quickly review and engage with posts
3. AI assists with drafts, but you approve and personalize every comment
4. Track your engagement history and see what's actually working
5. Analyze your network's responses and engagement patterns

Every comment goes through you first. Period.

KEY FEATURES

✓ Smart Post Loading
Automatically surfaces the latest posts from your network - no endless scrolling. Filter by connection level, skip promoted content, focus on recent posts only.

✓ Optimized Engagement Workflow
Streamlined UI designed for speed. Leave 100+ comments in the time it used to take for 10, while maintaining human touch and authenticity.

✓ Engagement History & Analytics
Track who you've commented on and when. See your profile views, engagement metrics, and what content resonates with your network.

✓ Network Analysis
Understand your engagement patterns. See which connections engage back, what topics drive conversations, and how your LinkedIn presence is growing.

✓ Human-in-the-Loop
Every comment requires your review before posting. You approve, edit, or rewrite - nothing posts automatically. AI-assisted, not AI-replaced.

✓ Save & Track Authors
Build lists of people you want to engage with. Never lose track of important connections or miss their content.

✓ Seamless Sidebar
Works directly in your LinkedIn feed. No popup windows, no tab switching, no workflow disruption.

WHO THIS IS FOR

• Founders building in public who need to engage consistently
• Sales professionals doing social selling at scale
• Creators growing their personal brand through authentic engagement
• Anyone who wants to be more active on LinkedIn without sacrificing authenticity

WHY NOT JUST USE A BOT?

Because people can tell. And so can LinkedIn.

AI-generated spam is everywhere now. The comments that stand out are the ones with actual thought behind them. EngageKit gives you the speed of automation with the authenticity of human engagement.

We believe the future of LinkedIn engagement is AI-assisted, not AI-replaced.

WHAT ENGAGEKIT IS NOT

✗ Not an auto-commenter
✗ Not a "set and forget" bot
✗ Not going to spam on your behalf
✗ Not going to post without your approval`;

      const prompt = `You are a real user sharing your authentic experience with EngageKit on social media.

CONTEXT ABOUT ENGAGEKIT:
${engageKitContext}

${previousCaptions ? `PREVIOUS CAPTIONS TO AVOID REPETITION:\n${previousCaptions}\n\n` : ""}

CRITICAL RULES:
- Include @engagekit_io EXACTLY ONCE (with underscore, lowercase)
- Include #engagekit_io EXACTLY ONCE (with underscore, lowercase)
- DO NOT use variants like @engagekitio or #engagekitio (these are WRONG - missing underscore)
- DO NOT use variants like @EngageKit_io or #EngageKit_io (these are WRONG - wrong capitalization)
- DO NOT repeat these keywords multiple times
- Length: Around 80 words
- Write in first person (I, me, my) like a real person sharing their experience
- Share a specific story or moment, not a list of features
- Sound casual and conversational, NOT like polished marketing copy
- Focus on one real problem you had and how EngageKit helped
- Use natural, everyday language
- Be authentic and personal - this is YOUR story
- Make it different from the previous captions shown above
- IMPORTANT: Put DOUBLE line breaks between sentences for authentic UGC feel (use TWO newlines, not one)

KEYWORD PLACEMENT (CRITICAL):
❌ WRONG - Both keywords at the end:
"story story story.

story story.

@engagekit_io #engagekit_io"

✅ CORRECT - Keywords woven naturally throughout:
"story story story.

found @engagekit_io and it changed everything.

story story story.

best thing about #engagekit_io is the speed."

GOOD EXAMPLE:
"used to spend 3 hours a day on LinkedIn with zero results.

endless scrolling, then burnout. rinse repeat.

started using @engagekit_io last month and holy shit.

now i actually see who engages back, track my network activity.

the analytics alone made it worth it.

if you're serious about #engagekit_io level networking this is it."

Write the caption now (just the caption text, no quotes or extra formatting):`;

      try {
        const result = await ctx.ai.generateComment({
          postContent: prompt,
          creativity: 2.0, // Maximum creativity
          maxWords: 80,
        });

        let caption = result.comment;

        // Replace any variant of @engagekit with @engagekit_io
        // Matches: @engagekitio, @EngageKit_io, @EngageKitIo, @engageKit, etc.
        caption = caption.replace(/@engagekit[_\s]?io\b/gi, "@engagekit_io");
        caption = caption.replace(/@engagekit\b/gi, "@engagekit_io");

        // Replace any variant of #engagekit with #engagekit_io
        // Matches: #engagekitio, #EngageKit_io, #EngageKitIo, #engageKit, etc.
        caption = caption.replace(/#engagekit[_\s]?io\b/gi, "#engagekit_io");
        caption = caption.replace(/#engagekit\b/gi, "#engagekit_io");

        // Remove duplicate @engagekit_io instances (keep only first occurrence)
        const atKeywordCount = (caption.match(/@engagekit_io/g) ?? []).length;
        if (atKeywordCount > 1) {
          let firstFound = false;
          caption = caption.replace(/@engagekit_io/g, () => {
            if (!firstFound) {
              firstFound = true;
              return "@engagekit_io";
            }
            return "";
          });
        }

        // Remove duplicate #engagekit_io instances (keep only first occurrence)
        const hashKeywordCount = (caption.match(/#engagekit_io/g) ?? []).length;
        if (hashKeywordCount > 1) {
          let firstFound = false;
          caption = caption.replace(/#engagekit_io/g, () => {
            if (!firstFound) {
              firstFound = true;
              return "#engagekit_io";
            }
            return "";
          });
        }

        // Clean up any double spaces
        caption = caption.replace(/\s{2,}/g, " ").trim();

        // Force double line breaks between sentences
        // Split by sentence endings (., !, ?) and rejoin with double line breaks
        caption = caption
          .split(/([.!?])\s+/)
          .reduce((acc, part, i, arr) => {
            if (i % 2 === 0 && part.trim()) {
              // This is the sentence content
              return acc + part;
            } else if ([".", "!", "?"].includes(part)) {
              // This is the punctuation - add it and double line break
              const nextPart = arr[i + 1];
              return nextPart?.trim() ? acc + part + "\n\n" : acc + part;
            }
            return acc;
          }, "")
          .trim();

        return {
          caption,
          success: true,
        };
      } catch (error) {
        console.error("[Social Referral] Caption generation error:", error);
        // Fallback caption with keywords naturally woven in
        return {
          caption:
            "been using @engagekit_io to scale my LinkedIn engagement.\nno more endless scrolling or burnout.\njust authentic connections with people who actually engage back.\nthe analytics help me see what's working.\nif you're serious about #engagekit_io level networking, this is the tool.",
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }),
  });
