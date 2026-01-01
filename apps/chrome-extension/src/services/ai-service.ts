import { getStandaloneTRPCClient } from "../trpc/react";

/**
 * AI Service for Chrome Extension
 *
 * Uses tRPC client to communicate with server-side AI comment generation
 * Replaces the local AICommentGenerator with server-side API calls
 */

export interface AICommentConfig {
  apiKey?: string; // Not needed anymore but kept for compatibility
  styleGuide: string;
}

export class AIService {
  private trpcClient;
  constructor() {
    this.trpcClient = getStandaloneTRPCClient();
  }

  /**
   * Generate AI comment using server-side tRPC API
   * @param postContent The LinkedIn post content to comment on
   * @param config Configuration including style guide
   * @returns Generated comment string
   */
  async generateComment(
    postContent: string,
    config: AICommentConfig,
  ): Promise<string> {
    console.log("🚀 AIService.generateComment() called - using tRPC API");
    console.log("🚀 Server URL will be determined by tRPC client");
    console.log("🚀 Post content length:", postContent.length);
    console.log("🚀 Style guide length:", config.styleGuide.length);

    try {
      console.log("📡 Making tRPC call to server...");

      const result = await this.trpcClient.aiComments.generateComment.mutate({
        postContent,
        styleGuide: config.styleGuide,
      });

      console.log("✅ tRPC call successful! Result:", {
        success: result.success,
        fallback: result.fallback,
        commentLength: result.comment.length,
        error: result.error,
      });

      return result.comment;
    } catch (error) {
      console.error("❌ tRPC call failed:", error);
      console.error("❌ Error type:", typeof error);
      console.error(
        "❌ Error message:",
        error instanceof Error ? error.message : String(error),
      );
      console.error(
        "❌ Error stack:",
        error instanceof Error ? error.stack : "No stack",
      );

      // Return fallback comment on error
      return "Great post! Thanks for sharing your insights.";
    }
  }
}
