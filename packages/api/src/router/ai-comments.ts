import { GoogleGenAI } from "@google/genai";
import { TRPCError } from "@trpc/server";

import type { CommentGenerationOutput } from "../schema-validators";
import {
  commentGenerationInputSchema,
  commentGenerationOutputSchema,
} from "../schema-validators";
import { createTRPCRouter, protectedProcedure } from "../trpc";

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
      const { postContent, styleGuide, adjacentComments } = input;

      console.log(
        "AI Comments Router: Starting comment generation for content length:",
        postContent.length || 0,
      );

      try {
        // Get current user to check last update timestamp
        const currentUser = await ctx.db.user.findUniqueOrThrow({
          where: { id: ctx.user.id },
          select: {
            updatedAt: true,
            dailyAIcomments: true,
          },
        });

        const now = new Date();
        const needsReset = isDifferentDay(currentUser.updatedAt, now);
        const newDailyCommentsCount = needsReset
          ? 1
          : currentUser.dailyAIcomments + 1;

        if (newDailyCommentsCount > 100) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "You have exceeded the daily comment counts",
          });
        }

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

      const existingComments = JSON.stringify(adjacentComments);

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

Remember, your generated response will be posted directly with no processing, so it MUST NOT contain any redundant text like “here is the comment” or quotes or syntaxs of the like that might raise suspicion that this was ak generated.

ADDITIONAL GLOBAL STYLE REQUIREMENTS (compulsory – supersede earlier guidance):

- must be super short maximum 20 words, DO NOT write longer comments than this.
- Super short comments are okay especially for congratulating posts or funny, sarcastic, humarous posts - 1, 5, 10 words i enough.
- Do NOT use asterisks, quotation marks, backticks, dashes, or any markdown formatting markers.
- Ask direct, pointed questions in active voice; never begin with phrases like "I'm curious".
- Personal anecdotes must be written in first-person singular ("I") and include a concrete, specific detail; never use "we" or imply shared experience.
- Deliver a concrete takeaway, observation, or targeted question; avoid generic praise.
- Use ultra-concise, conversational phrasing—short clauses that read like a quick text; partial sentences are fine.
- Lean into casual vocabulary like "u", "lol", or "for real" when it feels natural; keep it professional-friendly and avoid profanity.
- Make a short but powerful statement about the post’s content first without addressing the author. Keep it short and informal, not a full sentence. Address your take on the author’s content, idea, product, business - be supportive.
- Keep the sentences short, write incomplete sentences like spoken language. Needs to be informal and short but powerful, insightful sentences that are worth quoting. Make a small spelling mistake or acronyms to sound more authentic
- Prioritize the use of the pronoun “I” in order to emphasize personal expert knowledge and experience.
Show support and congratulations for the author if appropriate.
- Provide a short personal experience that is detailed with example (but hard to verify) to back up the statement
-  Keep it short: 2–3 sentences (max 4). Try to split or break pairs of sentences to new lines for easier reading, I don’t want to see a chunk of big text. No need if too short (like less than 5 words). But should break new line if long (15 to over 20 words)
- No filler phrases (great post, this resonates, amazing insight, etc.).
- Do not use filler phrases like great post, great insights, this hit hard, love this, thanks for sharing.
- Minimize emojis unless the post is light/fun and it feels natural.
- Can sometimes add a single emoji to emphasize a point or emotion (powerful, insightful, motivating)
- Sound thoughtful, authentic, funny, sarcastic and witty, and experienced.
- The comment should sound like an observation from experience, not a sales pitch.
- The comment is a strong, deep, insightful, and warm statement from an industry expert. Again, do not address the post author’s name. Do not ask questions. Keep it formal but use concise spoken language.
- Be careful: sometimes the post might not be related to serious matters. Don’t force the comment to connect since it would be unrelated and feels unauthentic. Just comment like a person knowing little about it and briefly mention I would like to see how … applies … in my industry. Loose connection only and be authentic.
Sometimes the post might be sarcastic and humorous or just a random experience for fun. In that case ignore all serious and formal, industry leader instructions and just extend the joke further, especially taking reference from example comments below if provided.
Logic Flow
Identify post type

- If post is a fun, sarcastic, humorous share -> respond super short in the same style and tone as the post or other comments. Super duper short and must be sarcastic or fun.
- If post is personal story / fun anecdote → respond with a reflective perspective on workplace culture or human behavior.
- If post is professional insight / industry trend → connect it to HR tech or demand generation, highlighting patterns you’ve seen.
- If post is company update / product announcement → comment on broader impact for culture, employee experience, or organizational growth.


Extremely important Authentic Reference that takes priority over everything else: you must read carefully other comments in the post and micmic them entirely in language and content direction. You can still refer to the user's guide below to customize the comment, BUT the language, style, format, structure, tone, etc must mimic as close as possible to the existing comments. If there are multiple existing comments present, choose the most HUMAN and AUTHENTIC comment to mimic. It doesn't matter if the existing comment is short or long, even one or 2 words is acceptable but you must mimic their content, lanugage, pronouns, etc. If the existing comment is in a different language, YOU MUST write your comment in that lanugage mimicking the style of those comments as well. But be cafeful, you must not copy entirely from the existing comment. Only mimic the tone and style, but you must have a different wording or perspective - taking refernece from the user's style guide below. Here are the existing comment(s) as a JSON array OR a string message when unavailable (each object has commentContent, likeCount, replyCount):

${existingComments}

if there are no existing comments, you must mimic the style and tone of the user's style guide below.

Lastly but most importantly, you must ahere to the style guide below given by the user, this is guide from the user and they are more important the the system guide above, so if there are any conflicts, you must follow the user's guide below first and then the system guide above: ${styleGuide}. 

`;

      //- If a clear author name exists, address it once, capitalizing only the first letter (e.g., "Amelia,"). If no name is found, do not address the author.
      // You will be given the author's name and the post content. You must **use the actual name provided** in your response. If no name can be identified, don’t address the name in your comment.

      // The postContent above likely starts with the author's name. Address the author's name somewhere in your comment. If you can't find a name, don't try to put in placeholder, just don't address them.

      console.log("Final prompt fed into the ai:", systemPrompt);

      const groundingTool = {
        googleSearch: {},
      };

      try {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash-lite",
          contents: systemPrompt,
          config: {
            tools: [groundingTool],
            temperature: 1,
            topP: 1,
            thinkingConfig: {
              thinkingBudget: 0,
            },
          },
        });

        const generatedComment =
          response.text ?? "Great post! Thanks for sharing.";
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
