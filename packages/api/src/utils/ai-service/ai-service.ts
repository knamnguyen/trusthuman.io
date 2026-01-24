import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

import type { CommentGenerationInput } from "../../schema-validators";
import type { StyleSelectorInput } from "./prompts";
import { getPostCommentSystemPrompt, getStyleSelectorPrompt } from "./prompts";

// Zod schema for style selector response - guarantees valid JSON structure
const styleSelectorResponseSchema = z.object({
  selectedStyleIds: z
    .array(z.string())
    .describe("Array of exactly 3 style IDs selected for this post"),
});

export class AIService {
  private ai: GoogleGenAI;

  constructor(googleGenAIApiKey: string) {
    this.ai = new GoogleGenAI({ apiKey: googleGenAIApiKey });
  }

  async generateComment(input: CommentGenerationInput) {
    // Use provided config or fall back to defaults
    const creativity = input.creativity ?? 1.0;
    const maxWords = input.maxWords ?? 100;

    // Convert maxWords to approximate maxOutputTokens (roughly 1.3 tokens per word)
    const maxOutputTokens = Math.ceil(maxWords * 1.3);

    console.log("AI Comments Router: Starting comment generation", {
      postContentLength: input.postContent.length || 0,
      creativity,
      maxWords,
      maxOutputTokens,
      hasStyleGuide: !!input.styleGuide,
    });

    const systemPrompt = getPostCommentSystemPrompt(input);

    // Debug logging for the full prompt
    // console.log("🤖 [AI Debug] Full prompt sent to AI:\n", systemPrompt);
    console.log("🤖 [AI Debug] Config:", {
      temperature: creativity,
      maxOutputTokens,
    });

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash-lite",
        contents: systemPrompt,
        config: {
          // Use creativity from CommentStyle (0 = predictable, 1 = balanced, 2 = creative)
          temperature: creativity,
          // Convert maxWords to tokens (approximately 1.3 tokens per word)
          maxOutputTokens,
        },
      });

      const generatedComment =
        response.text ?? "Great post! Thanks for sharing.";
      const isFallback = !response.text;

      // Sanitize the comment to remove any residual AI artefacts.
      // If sanitisation results in an empty string, fall back to a safe generic comment.
      const cleanComment = AIService.sanitizeGeneratedComment(generatedComment);
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
      } as const;
    } catch (error) {
      console.error("AI Comments Router: Error generating comment:", error);
      return {
        comment: "Great post! Thanks for sharing.",
        success: false,
        fallback: true,
        error: error instanceof Error ? error.message : String(error),
      } as const;
    }
  }

  /**
   * Select the most appropriate comment styles for a given post.
   * Always returns exactly 3 style IDs (may repeat if fewer styles available).
   * Uses Gemini's structured output to guarantee valid JSON response.
   *
   * @param input - Post content, adjacent comments, and available styles
   * @returns Array of 3 style IDs
   * @throws Error if AI fails after retries
   */
  async selectCommentStyles(input: StyleSelectorInput): Promise<string[]> {
    const MAX_RETRIES = 3;
    const validStyleIds = new Set(input.styles.map((s) => s.id));
    const firstValidStyleId = input.styles[0]?.id;

    console.log("[AIService] selectCommentStyles: Starting style selection", {
      postContentLength: input.postContent.length,
      stylesCount: input.styles.length,
      styleIds: Array.from(validStyleIds),
    });

    // Early return: if only 1 style available, skip AI call and return it 3 times
    if (input.styles.length === 1 && firstValidStyleId) {
      console.log(
        "[AIService] selectCommentStyles: Only 1 style available, returning it 3 times",
      );
      return [firstValidStyleId, firstValidStyleId, firstValidStyleId];
    }

    const prompt = getStyleSelectorPrompt(input);

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(
          `[AIService] selectCommentStyles: Attempt ${attempt}/${MAX_RETRIES}`,
        );

        const response = await this.ai.models.generateContent({
          model: "gemini-2.5-flash-lite",
          contents: prompt,
          config: {
            temperature: 0.3, // Lower temperature for more consistent selection
            maxOutputTokens: 200, // Enough for JSON response
            responseMimeType: "application/json",
            responseJsonSchema: zodToJsonSchema(styleSelectorResponseSchema),
          },
        });

        const responseText = response.text?.trim() ?? "";
        console.log(
          "[AIService] selectCommentStyles: Raw JSON response:",
          responseText,
        );

        // Parse the JSON response - handle both array and object formats
        const parsed = JSON.parse(responseText) as
          | string[]
          | { selectedStyleIds?: string[] };
        const styleIds = Array.isArray(parsed)
          ? parsed
          : (parsed.selectedStyleIds ?? []);

        // Filter to only valid IDs (handles truncated/invalid IDs)
        const validIds = styleIds.filter((id) => validStyleIds.has(id));

        // If we got exactly 3 valid IDs, success!
        if (validIds.length === 3) {
          console.log(
            "[AIService] selectCommentStyles: Successfully selected styles:",
            validIds,
          );
          return validIds;
        }

        // If we got at least 1 valid ID, pad it to 3 by repeating
        if (validIds.length > 0) {
          const paddedIds: string[] = [...validIds];
          while (paddedIds.length < 3) {
            // Repeat the valid IDs in order to reach 3
            paddedIds.push(validIds[paddedIds.length % validIds.length]!);
          }
          // Trim to exactly 3 in case we had 2 IDs (would give us 4)
          const result = paddedIds.slice(0, 3);
          console.log(
            "[AIService] selectCommentStyles: Padded to 3 IDs:",
            result,
          );
          return result;
        }

        // Got 0 valid IDs, retry
        console.warn(
          `[AIService] selectCommentStyles: Got ${validIds.length} valid IDs (expected 3), retrying...`,
          { returned: styleIds, valid: validIds },
        );
      } catch (error) {
        console.error(
          `[AIService] selectCommentStyles: Attempt ${attempt} failed:`,
          error,
        );

        // On last attempt, use fallback if we have any valid style
        if (attempt === MAX_RETRIES && firstValidStyleId) {
          console.warn(
            "[AIService] selectCommentStyles: All retries exhausted, using fallback (first style x3)",
          );
          return [firstValidStyleId, firstValidStyleId, firstValidStyleId];
        }
      }
    }

    // Final fallback: if we have any valid style, return it 3 times
    if (firstValidStyleId) {
      console.warn(
        "[AIService] selectCommentStyles: Using final fallback (first style x3)",
      );
      return [firstValidStyleId, firstValidStyleId, firstValidStyleId];
    }

    // Should never reach here unless there are 0 styles available
    throw new Error(
      "Failed to select comment styles: no valid styles available",
    );
  }

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
  static sanitizeGeneratedComment(raw: string): string {
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

    // 6. Replace em-dashes and en-dashes with normal dashes, removing whitespace
    result = result.replace(/\s*[—–]\s*/g, "-");

    // Collapse multiple spaces and trim again
    result = result.replace(/\s{2,}/g, " ").trim();

    return result;
  }
}
