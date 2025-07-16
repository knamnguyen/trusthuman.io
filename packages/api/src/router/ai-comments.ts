import { GoogleGenAI } from "@google/genai";
import { TRPCError } from "@trpc/server";

import type { CommentGenerationOutput } from "../schema-validators";
import {
  commentGenerationInputSchema,
  commentGenerationOutputSchema,
} from "../schema-validators";
import { createTRPCRouter, protectedProcedure } from "../trpc";

/**
 * Check if two dates are on different days in user's local timezone
 */
const isDifferentDay = (date1: Date, date2: Date): boolean => {
  return date1.toDateString() !== date2.toDateString();
};

/**
 * Sanitise AI-generated comment by stripping common AI artefacts:
 * - Leading/trailing quotation marks
 * - Place-holders wrapped in [], {}, <> (e.g. [Author's Name])
 * - Back-ticks and markdown bold / italic markers (** __ * _)
 * - Parenthetical placeholders containing keywords like Author, Company, Name, insert, placeholder
 *
 * The goal is to leave a natural-looking comment while never stripping legitimate
 * human text beyond these obvious artefacts.
 */
const sanitizeGeneratedComment = (raw: string): string => {
  if (!raw) return "";
  let result = raw.trim();

  // 1. Remove leading/trailing quotes (straight or curly)
  result = result.replace(/^(["'“”‘’]+)/, "").replace(/(["'“”‘’]+)$/, "");

  // 2. Remove wrapping backticks (single or triple) and any isolated backticks
  result = result
    .replace(/^`{1,3}/, "")
    .replace(/`{1,3}$/, "")
    .replace(/`+/g, "");

  // 3. Remove markdown bold/italic markers
  result = result.replace(/\*\*|__|\*|_/g, "");

  // 4. Remove anything inside square, curly, or angle brackets – typically AI placeholders
  result = result
    .replace(/\[[^\]]*?\]/g, "")
    .replace(/\{[^}]*?\}/g, "")
    .replace(/<[^>]*?>/g, "");

  // 5. Remove parenthetical placeholders containing specific keywords
  result = result.replace(
    /\(([^)]*(author|company|name|insert|placeholder)[^)]*)\)/gi,
    "",
  );

  // Collapse multiple spaces and trim again
  result = result.replace(/\s{2,}/g, " ").trim();

  return result;
};

/**
 * AI Comments Router
 *
 * Handles AI-powered comment generation using Google GenAI
 * Requires authentication via Clerk protectedProcedure
 */

export const aiCommentsRouter = createTRPCRouter({
  /**
   * Generate AI comment based on post content and style guide
   * Protected procedure requiring user authentication
   */
  generateComment: protectedProcedure
    .input(commentGenerationInputSchema)
    .output(commentGenerationOutputSchema)
    .mutation(async ({ input, ctx }): Promise<CommentGenerationOutput> => {
      const { postContent, styleGuide } = input;

      console.log(
        "AI Comments Router: Starting comment generation for content length:",
        postContent?.length || 0,
      );

      // First, update the user's daily comment count
      if (!ctx.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User ID not found in context",
        });
      }

      try {
        // Get current user to check last update timestamp
        const currentUser = await ctx.db.user.findUnique({
          where: { id: ctx.user.id },
        });

        if (!currentUser) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found",
          });
        }

        const now = new Date();
        const needsReset = isDifferentDay(currentUser.updatedAt, now);

        // Update daily comment count (reset if different day, otherwise increment)
        await ctx.db.user.update({
          where: { id: ctx.user.id },
          data: {
            dailyAIcomments: needsReset ? 1 : currentUser.dailyAIcomments + 1,
            updatedAt: now,
          },
        });

        console.log(
          `AI Comments Router: Updated daily comment count for user ${ctx.user.id}`,
          `Reset: ${needsReset}, New count: ${needsReset ? 1 : currentUser.dailyAIcomments + 1}`,
        );
      } catch (error) {
        console.error(
          "AI Comments Router: Error updating user comment count:",
          error,
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update comment count",
          cause: error,
        });
      }

      // Get Google GenAI API key from environment
      const apiKey = process.env.GOOGLE_GENAI_API_KEY;
      if (!apiKey) {
        console.error(
          "AI Comments Router: GOOGLE_GENAI_API_KEY not found in environment",
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "AI service configuration error",
        });
      }

      const ai = new GoogleGenAI({ apiKey });

      const systemPrompt = `
You are a LinkedIn influencer commenting on a post. 

Generate concise but engaging comments for a single LinkedIn. 

Super Importantly, ONLY REPSOND WITH THE COMMENT. DO NOT REPLY WITH ANYTHING ELSE LIKE QUOTATIONS OR ANYTHING ELSE.

Importantly, ahere strictly to the following additional rules:
- Keep comments professional yet conversational
- under 100 words
- avoid generic responses.

Super Importantly, ONLY REPSOND WITH THE COMMENT. DO NOT REPLY WITH ANYTHING ELSE LIKE QUOTATIONS OR ANYTHING ELSE.

Generate a thoughtful comment for this LinkedIn post: ${postContent}

Super Importantly, ONLY REPSOND WITH THE COMMENT. DO NOT REPLY WITH ANYTHING ELSE LIKE QUOTATIONS OR ANYTHING ELSE.

Super Importantly, do not return any artefacts that might imply that the comment was generated by AI like placeholders [First's Name] or [Post Content].

The postContent above likely starts with the author's name. Address the author's name somewhere in your comment. If you can't find a name, don't try to put in placeholder, just don't address them.

It's important that you think very hard to make sure that what you return is as natural and human sounding/looking as possible without raising any red flags.

**This is the most important rule. There are no exceptions.**

Your final output must be only the raw text of the comment, ready to be copied and pasted.

Under **NO CIRCUMSTANCES** should your response contain any placeholders, brackets, or meta-text. These are forbidden AI artifacts.

FORBIDDEN ARTIFACTS INCLUDE:

[Author's Name]
[insert specific detail here]
[Company Name]

Quotation marks around concepts you are referencing (e.g., the "trust" issue)
Any text inside [...] or {...}

The Correct Process:

You will be given the author's name and the post content. You must **use the actual name provided** in your response. If no name can be identified, don’t address the name in your comment.

Remember, your generated response will be posted directly with no processing, so it MUST NOT contain any redundant text like “here is the comment” or quotes or syntaxs of the like that might raise suspicion that this was ak generated.

ADDITIONAL GLOBAL STYLE REQUIREMENTS (compulsory – supersede earlier guidance):

- Length: absolute maximum of 35 words (this overrides any longer limit above).
- If a clear author name exists, address it once, capitalizing only the first letter (e.g., "Amelia,"). If no name is found, do not address the author.
- Do NOT use asterisks, quotation marks, backticks, dashes, or any markdown formatting markers.
- Maintain a casual, text-like tone; limited acronyms such as "u" or "lol" are acceptable.
- Ask direct, pointed questions in active voice; never begin with phrases like "I'm curious".
- Personal anecdotes must be written in first-person singular ("I") and include a concrete, specific detail; never use "we" or imply shared experience.
- Deliver a concrete takeaway, observation, or targeted question; avoid generic praise.
- Use ultra-concise, conversational phrasing—short clauses that read like a quick text; partial sentences are fine.
- Lean into casual vocabulary like "u", "lol", or "for real" when it feels natural; keep it professional-friendly and avoid profanity.

Lastly but most importantly, you must ahere to the style guide below given by the user, this is guide from the user and they are more important the the system guide above, so if there are any conflicts, you must follow the user's guide below first and then the system guide above: ${styleGuide}. 

`;

      try {
        const response = await ai.models.generateContent({
          model: "gemini-2.0-flash-lite",
          contents: systemPrompt,
          config: {
            maxOutputTokens: 100,
            temperature: 0.7,
          },
        });

        const generatedComment =
          response.text || "Great post! Thanks for sharing.";
        const isFallback = !response.text;

        // Sanitize the comment to remove any residual AI artefacts.
        // If sanitisation results in an empty string, fall back to a safe generic comment.
        const cleanComment = sanitizeGeneratedComment(generatedComment);
        const finalComment =
          cleanComment.length > 0
            ? cleanComment
            : "Great post! Thanks for sharing.";

        console.log(
          "AI Comments Router: Successfully generated comment:",
          finalComment.substring(0, 100) + "...",
        );

        return {
          comment: finalComment,
          success: true,
          // Mark as fallback if the AI failed or if sanitisation stripped everything
          fallback: isFallback || cleanComment.length === 0,
        };
      } catch (error) {
        console.error("AI Comments Router: Error generating comment:", error);

        // Log detailed error information
        const errorDetails = {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          name: error instanceof Error ? error.name : "Unknown",
          postContentLength: postContent ? postContent.length : 0,
          timestamp: new Date().toISOString(),
          type: "google_genai_error",
        };

        console.error("AI Comments Router: Error details:", errorDetails);

        // Return fallback comment instead of throwing error
        return {
          comment: "Great post! Thanks for sharing.",
          success: false,
          fallback: true,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }),
});
