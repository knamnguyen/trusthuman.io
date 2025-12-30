import { GoogleGenAI } from "@google/genai";

import type { CommentGenerationInput } from "../../schema-validators";
import { getPostCommentSystemPrompt } from "./prompts";

export class AIService {
  private ai: GoogleGenAI;

  constructor(private googleGenAIApiKey: string) {
    this.ai = new GoogleGenAI({ apiKey: this.googleGenAIApiKey });
  }

  async generateComment(input: CommentGenerationInput) {
    const systemPrompt = getPostCommentSystemPrompt(input);

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash-lite",
        contents: systemPrompt,
        config: {
          // Lower temperature = faster sampling, still creative enough
          temperature: 0.8,
          // Limit output tokens for shorter comments
          maxOutputTokens: 150,
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

      return {
        comment: finalComment,
        success: true,
        // Mark as fallback if the AI failed or if sanitisation stripped everything
        fallback: isFallback || cleanComment.length === 0,
      } as const;
    } catch (error) {
      return {
        comment: "Great post! Thanks for sharing.",
        success: false,
        fallback: true,
        error: error instanceof Error ? error.message : String(error),
      } as const;
    }
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
