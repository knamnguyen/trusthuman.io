import { DataCollector } from "./data-collector";
import {
  fetchDashboardActivity,
  type DashboardActivityData,
} from "./linkedin-dashboard-activity-fetcher";

// Single data type for both posts and comments
export interface PostsData {
  totalPosts: number;
  period: string;
}

export interface CommentsData {
  totalComments: number;
  period: string;
}

// Wrapper functions to extract individual metrics
async function fetchPosts(): Promise<PostsData | null> {
  const activity = await fetchDashboardActivity();
  if (!activity) return null;

  return {
    totalPosts: activity.posts,
    period: activity.period,
  };
}

async function fetchComments(): Promise<CommentsData | null> {
  const activity = await fetchDashboardActivity();
  if (!activity) return null;

  return {
    totalComments: activity.comments,
    period: activity.period,
  };
}

/**
 * Singleton DataCollector instance for posts
 * - Stores last 365 snapshots (1 year)
 * - Auto-fetches no more than once per 24 hours
 */
export const postsCollector = new DataCollector<PostsData>(
  {
    storageKey: "dashboard-posts",
    maxSnapshots: 365,
    minIntervalMs: 24 * 60 * 60 * 1000, // 24 hours
  },
  fetchPosts,
);

/**
 * Singleton DataCollector instance for comments
 * - Stores last 365 snapshots (1 year)
 * - Auto-fetches no more than once per 24 hours
 */
export const commentsCollector = new DataCollector<CommentsData>(
  {
    storageKey: "dashboard-comments",
    maxSnapshots: 365,
    minIntervalMs: 24 * 60 * 60 * 1000, // 24 hours
  },
  fetchComments,
);
