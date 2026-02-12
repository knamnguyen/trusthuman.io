import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { readFeedPosts } from "./workflows/read-feed-posts";
import { likePost } from "./workflows/like-post";
import { commentOnPost } from "./workflows/comment-on-post";

export function createServer() {
  const server = new McpServer({
    name: "flowser",
    version: "0.1.0",
  });

  server.tool(
    "read_feed_posts",
    "Scroll your LinkedIn feed and collect post data. Returns posts with URN, caption, author info, and comments. Use the returned postUrn values with like_post and comment_on_post.",
    {
      count: z
        .number()
        .describe("Number of posts to read from the feed")
        .default(5),
    },
    async ({ count }) => {
      try {
        const posts = await readFeedPosts(count);
        return {
          content: [{ type: "text", text: JSON.stringify(posts, null, 2) }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error reading feed: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  server.tool(
    "like_post",
    "Navigate to a LinkedIn post and click the Like button. Requires a postUrn from a previous read_feed_posts call.",
    {
      postUrn: z
        .string()
        .describe("The post URN (e.g., 'urn:li:activity:123')"),
    },
    async ({ postUrn }) => {
      try {
        const result = await likePost(postUrn);
        return {
          content: [{ type: "text", text: JSON.stringify(result) }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error liking post: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  server.tool(
    "comment_on_post",
    "Navigate to a LinkedIn post, type a comment, and submit it. Requires a postUrn from a previous read_feed_posts call.",
    {
      postUrn: z
        .string()
        .describe("The post URN (e.g., 'urn:li:activity:123')"),
      comment: z.string().describe("The comment text to post"),
    },
    async ({ postUrn, comment }) => {
      try {
        const result = await commentOnPost(postUrn, comment);
        return {
          content: [{ type: "text", text: JSON.stringify(result) }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error commenting: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  return server;
}
