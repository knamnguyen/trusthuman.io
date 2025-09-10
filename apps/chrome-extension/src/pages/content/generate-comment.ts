// Function to generate comment using direct tRPC call
import { getStandaloneTRPCClient } from "@src/trpc/react";

export type AdjacentComment = {
  commentContent: string;
  likeCount: number;
  replyCount: number;
};

export default async function generateComment(
  postContent: string,
  styleGuide: string,
  adjacentComments: AdjacentComment[] | string = "No existing comments",
): Promise<string> {
  try {
    console.log(
      "🤖 Requesting comment generation via tRPC for post content:",
      postContent.substring(0, 200) + "...",
    );

    console.log("🤖 Style guide:", styleGuide);

    console.log("adjacentComments", adjacentComments);
    // Direct tRPC call to aiComments.generateComment
    const response =
      await getStandaloneTRPCClient().aiComments.generateComment.mutate({
        postContent,
        styleGuide,
        adjacentComments,
      });

    if (response && response.comment) {
      console.log(
        "✅ Successfully received generated comment:",
        response.comment.substring(0, 100) + "...",
      );
      return response.comment;
    } else {
      console.error(
        "⚠️ tRPC response missing comment field, using fallback. Response:",
        response,
      );
      return "Great post! Thanks for sharing.";
    }
  } catch (error) {
    console.error("💥 Error during tRPC comment generation:", error);
    return "Great post! Thanks for sharing.";
  }
}
