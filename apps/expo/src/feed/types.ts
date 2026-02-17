/**
 * Feed types — shared shape with the nextjs app
 * (apps/nextjs/.../feed/_components/types.ts).
 *
 * Both platforms will use the same tRPC endpoints once the backend is wired up.
 * For now we use mock data with these types.
 */

/** LinkedIn post loaded by Hyperbrowser */
export interface FeedPost {
  id: string;
  postUrl: string;
  postFullCaption: string;
  postCreatedAt: Date;
  authorName: string;
  authorProfileUrl: string;
  authorAvatarUrl: string;
  authorHeadline: string;
}

/** A feed post with its AI-generated comment draft */
export interface FeedItem {
  id: string;
  post: FeedPost;
  aiComment: string;
  /** 0-100 — how much the user has personalized the AI comment */
  touchScore: number;
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
}
