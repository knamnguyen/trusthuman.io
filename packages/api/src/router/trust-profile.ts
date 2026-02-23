import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../trpc";

// Standardized activity type for all platforms
type StandardizedActivity = {
  type: "linkedin" | "x" | "facebook" | "threads" | "reddit" | "ph" | "github" | "hn";
  id: string;
  commentText: string;
  commentUrl: string | null;
  parentUrl: string | null;
  parentAuthorName: string;
  parentAuthorAvatarUrl: string;
  parentTextSnippet: string;
  verified: boolean;
  activityAt: Date;
  createdAt: Date;
};

// Helper to map activities from any platform to standardized format
function mapActivity(
  activity: {
    id: string;
    commentText: string;
    commentUrl: string | null;
    parentUrl: string | null;
    parentAuthorName: string;
    parentAuthorAvatarUrl: string;
    parentTextSnippet: string;
    activityAt: Date;
    createdAt: Date;
    verification?: { verified: boolean } | null;
  },
  type: StandardizedActivity["type"],
): StandardizedActivity {
  return {
    type,
    id: activity.id,
    commentText: activity.commentText,
    commentUrl: activity.commentUrl,
    parentUrl: activity.parentUrl,
    parentAuthorName: activity.parentAuthorName,
    parentAuthorAvatarUrl: activity.parentAuthorAvatarUrl,
    parentTextSnippet: activity.parentTextSnippet,
    verified: activity.verification?.verified ?? false,
    activityAt: activity.activityAt,
    createdAt: activity.createdAt,
  };
}

export const trustProfileRouter = createTRPCRouter({
  /**
   * Get global stats for landing page
   * Returns total humans and total verifications
   */
  getStats: publicProcedure.query(async ({ ctx }) => {
    const [totalHumans, totalVerifications] = await Promise.all([
      ctx.db.trustProfile.count(),
      ctx.db.humanVerification.count({ where: { verified: true } }),
    ]);

    return {
      totalHumans,
      totalVerifications,
    };
  }),

  /**
   * Get per-platform verification stats for landing page
   * Returns count of verified activities per platform
   */
  getPlatformStats: publicProcedure.query(async ({ ctx }) => {
    const [linkedin, x, facebook, threads, reddit, ph, github, hn] = await Promise.all([
      ctx.db.verifiedLinkedInActivity.count({ where: { verification: { verified: true } } }),
      ctx.db.verifiedXActivity.count({ where: { verification: { verified: true } } }),
      ctx.db.verifiedFacebookActivity.count({ where: { verification: { verified: true } } }),
      ctx.db.verifiedThreadsActivity.count({ where: { verification: { verified: true } } }),
      ctx.db.verifiedRedditActivity.count({ where: { verification: { verified: true } } }),
      ctx.db.verifiedPHActivity.count({ where: { verification: { verified: true } } }),
      ctx.db.verifiedGitHubActivity.count({ where: { verification: { verified: true } } }),
      ctx.db.verifiedHNActivity.count({ where: { verification: { verified: true } } }),
    ]);

    return {
      linkedin,
      x,
      facebook,
      threads,
      reddit,
      producthunt: ph,
      github,
      hackernews: hn,
    };
  }),

  /**
   * Get recent verified activity for landing page feed
   * Returns latest verified comments/replies across all users
   */
  getRecentActivity: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(20).default(8),
      }),
    )
    .query(async ({ ctx, input }) => {
      const includeProfile = {
        trustProfile: {
          select: {
            humanNumber: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      };

      // Fetch from all platforms in parallel
      const [linkedin, x, facebook, threads, reddit, ph, github, hn] = await Promise.all([
        ctx.db.verifiedLinkedInActivity.findMany({
          where: { verification: { verified: true } },
          take: input.limit,
          orderBy: { createdAt: "desc" },
          include: includeProfile,
        }),
        ctx.db.verifiedXActivity.findMany({
          where: { verification: { verified: true } },
          take: input.limit,
          orderBy: { createdAt: "desc" },
          include: includeProfile,
        }),
        ctx.db.verifiedFacebookActivity.findMany({
          where: { verification: { verified: true } },
          take: input.limit,
          orderBy: { createdAt: "desc" },
          include: includeProfile,
        }),
        ctx.db.verifiedThreadsActivity.findMany({
          where: { verification: { verified: true } },
          take: input.limit,
          orderBy: { createdAt: "desc" },
          include: includeProfile,
        }),
        ctx.db.verifiedRedditActivity.findMany({
          where: { verification: { verified: true } },
          take: input.limit,
          orderBy: { createdAt: "desc" },
          include: includeProfile,
        }),
        ctx.db.verifiedPHActivity.findMany({
          where: { verification: { verified: true } },
          take: input.limit,
          orderBy: { createdAt: "desc" },
          include: includeProfile,
        }),
        ctx.db.verifiedGitHubActivity.findMany({
          where: { verification: { verified: true } },
          take: input.limit,
          orderBy: { createdAt: "desc" },
          include: includeProfile,
        }),
        ctx.db.verifiedHNActivity.findMany({
          where: { verification: { verified: true } },
          take: input.limit,
          orderBy: { createdAt: "desc" },
          include: includeProfile,
        }),
      ]);

      // Map all to standardized format
      const mapWithProfile = (
        items: typeof linkedin,
        type: StandardizedActivity["type"],
      ) =>
        items.map((a) => ({
          id: a.id,
          type,
          commentText: a.commentText,
          commentUrl: a.commentUrl,
          parentUrl: a.parentUrl,
          parentAuthorName: a.parentAuthorName,
          parentAuthorAvatarUrl: a.parentAuthorAvatarUrl,
          parentTextSnippet: a.parentTextSnippet,
          verified: true, // Only verified activities are queried
          activityAt: a.activityAt,
          createdAt: a.createdAt,
          humanNumber: a.trustProfile.humanNumber,
          username: a.trustProfile.username,
          displayName: a.trustProfile.displayName,
          avatarUrl: a.trustProfile.avatarUrl,
        }));

      // Merge, sort, and take limit
      return [
        ...mapWithProfile(linkedin, "linkedin"),
        ...mapWithProfile(x, "x"),
        ...mapWithProfile(facebook, "facebook"),
        ...mapWithProfile(threads, "threads"),
        ...mapWithProfile(reddit, "reddit"),
        ...mapWithProfile(ph, "ph"),
        ...mapWithProfile(github, "github"),
        ...mapWithProfile(hn, "hn"),
      ]
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, input.limit);
    }),

  /**
   * Get public profile by username
   * Returns extra data (platform links) if viewer is the owner
   */
  getByUsername: publicProcedure
    .input(z.object({ username: z.string() }))
    .query(async ({ ctx, input }) => {
      const profile = await ctx.db.trustProfile.findUnique({
        where: { username: input.username },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              imageUrl: true,
            },
          },
          platformLinks: {
            select: {
              platform: true,
              profileHandle: true,
              profileUrl: true,
              displayName: true,
            },
          },
          linkedinActivity: {
            take: 10,
            orderBy: { createdAt: "desc" },
            include: { verification: { select: { verified: true, createdAt: true } } },
          },
          xActivity: {
            take: 10,
            orderBy: { createdAt: "desc" },
            include: { verification: { select: { verified: true, createdAt: true } } },
          },
          facebookActivity: {
            take: 10,
            orderBy: { createdAt: "desc" },
            include: { verification: { select: { verified: true, createdAt: true } } },
          },
          threadsActivity: {
            take: 10,
            orderBy: { createdAt: "desc" },
            include: { verification: { select: { verified: true, createdAt: true } } },
          },
          redditActivity: {
            take: 10,
            orderBy: { createdAt: "desc" },
            include: { verification: { select: { verified: true, createdAt: true } } },
          },
          phActivity: {
            take: 10,
            orderBy: { createdAt: "desc" },
            include: { verification: { select: { verified: true, createdAt: true } } },
          },
          githubActivity: {
            take: 10,
            orderBy: { createdAt: "desc" },
            include: { verification: { select: { verified: true, createdAt: true } } },
          },
          hnActivity: {
            take: 10,
            orderBy: { createdAt: "desc" },
            include: { verification: { select: { verified: true, createdAt: true } } },
          },
        },
      });

      if (!profile) {
        return null;
      }

      // Check if current user is the profile owner
      const isOwner = ctx.user?.id === profile.userId;

      // Calculate rank (simple: count profiles with more verifications)
      const rank = await ctx.db.trustProfile.count({
        where: {
          totalVerifications: { gt: profile.totalVerifications },
        },
      });

      // Merge activities from all platforms and sort by date
      const recentActivities = [
        ...profile.linkedinActivity.map((a) => mapActivity(a, "linkedin")),
        ...profile.xActivity.map((a) => mapActivity(a, "x")),
        ...profile.facebookActivity.map((a) => mapActivity(a, "facebook")),
        ...profile.threadsActivity.map((a) => mapActivity(a, "threads")),
        ...profile.redditActivity.map((a) => mapActivity(a, "reddit")),
        ...profile.phActivity.map((a) => mapActivity(a, "ph")),
        ...profile.githubActivity.map((a) => mapActivity(a, "github")),
        ...profile.hnActivity.map((a) => mapActivity(a, "hn")),
      ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      return {
        id: profile.id,
        humanNumber: profile.humanNumber,
        username: profile.username,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
        bio: profile.bio,
        totalVerifications: profile.totalVerifications,
        currentStreak: profile.currentStreak,
        longestStreak: profile.longestStreak,
        isPublic: profile.isPublic,
        defaultLayout: profile.defaultLayout as "horizontal" | "vertical",
        badgeImageStyle: profile.badgeImageStyle as "logo" | "avatar",
        createdAt: profile.createdAt,
        rank: rank + 1, // 1-indexed
        isOwner,
        // Platform links are public - profileUrl is not sensitive
        platformLinks: profile.platformLinks.map((l) => ({
          platform: l.platform,
          profileHandle: l.profileHandle,
          profileUrl: l.profileUrl,
        })),
        recentActivities: recentActivities.slice(0, 20),
      };
    }),

  /**
   * Get leaderboard (top users by verification count)
   */
  getLeaderboard: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      const [users, total] = await Promise.all([
        ctx.db.trustProfile.findMany({
          where: { isPublic: true },
          orderBy: { totalVerifications: "desc" },
          take: input.limit,
          skip: input.offset,
          select: {
            id: true,
            humanNumber: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            totalVerifications: true,
            currentStreak: true,
          },
        }),
        ctx.db.trustProfile.count({ where: { isPublic: true } }),
      ]);

      return {
        users: users.map((u, idx) => ({
          ...u,
          rank: input.offset + idx + 1,
        })),
        total,
      };
    }),

  /**
   * Get my trust profile (for sidebar/dashboard)
   * Returns full profile with recent activities - mirrors getByUsername
   */
  getMyProfile: protectedProcedure.query(async ({ ctx }) => {
    const profile = await ctx.db.trustProfile.findUnique({
      where: { userId: ctx.user.id },
      include: {
        platformLinks: true,
        linkedinActivity: {
          take: 20,
          orderBy: { createdAt: "desc" },
          include: { verification: { select: { verified: true, createdAt: true } } },
        },
        xActivity: {
          take: 20,
          orderBy: { createdAt: "desc" },
          include: { verification: { select: { verified: true, createdAt: true } } },
        },
        facebookActivity: {
          take: 20,
          orderBy: { createdAt: "desc" },
          include: { verification: { select: { verified: true, createdAt: true } } },
        },
        threadsActivity: {
          take: 20,
          orderBy: { createdAt: "desc" },
          include: { verification: { select: { verified: true, createdAt: true } } },
        },
        redditActivity: {
          take: 20,
          orderBy: { createdAt: "desc" },
          include: { verification: { select: { verified: true, createdAt: true } } },
        },
        phActivity: {
          take: 20,
          orderBy: { createdAt: "desc" },
          include: { verification: { select: { verified: true, createdAt: true } } },
        },
        githubActivity: {
          take: 20,
          orderBy: { createdAt: "desc" },
          include: { verification: { select: { verified: true, createdAt: true } } },
        },
        hnActivity: {
          take: 20,
          orderBy: { createdAt: "desc" },
          include: { verification: { select: { verified: true, createdAt: true } } },
        },
      },
    });

    if (!profile) {
      return null;
    }

    // Calculate rank
    const rank = await ctx.db.trustProfile.count({
      where: {
        totalVerifications: { gt: profile.totalVerifications },
      },
    });

    // Merge activities from all platforms and sort by date
    const recentActivities = [
      ...profile.linkedinActivity.map((a) => mapActivity(a, "linkedin")),
      ...profile.xActivity.map((a) => mapActivity(a, "x")),
      ...profile.facebookActivity.map((a) => mapActivity(a, "facebook")),
      ...profile.threadsActivity.map((a) => mapActivity(a, "threads")),
      ...profile.redditActivity.map((a) => mapActivity(a, "reddit")),
      ...profile.phActivity.map((a) => mapActivity(a, "ph")),
      ...profile.githubActivity.map((a) => mapActivity(a, "github")),
      ...profile.hnActivity.map((a) => mapActivity(a, "hn")),
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return {
      id: profile.id,
      humanNumber: profile.humanNumber,
      username: profile.username,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl,
      bio: profile.bio,
      totalVerifications: profile.totalVerifications,
      currentStreak: profile.currentStreak,
      longestStreak: profile.longestStreak,
      isPublic: profile.isPublic,
      defaultLayout: profile.defaultLayout as "horizontal" | "vertical",
      badgeImageStyle: profile.badgeImageStyle as "logo" | "avatar",
      createdAt: profile.createdAt,
      rank: rank + 1,
      platformLinks: profile.platformLinks,
      recentActivities,
    };
  }),

  /**
   * Update trust profile settings
   */
  update: protectedProcedure
    .input(
      z.object({
        displayName: z.string().optional(),
        avatarUrl: z.string().optional(),
        bio: z.string().max(160).optional(),
        isPublic: z.boolean().optional(),
        defaultLayout: z.enum(["horizontal", "vertical"]).optional(),
        badgeImageStyle: z.enum(["logo", "avatar"]).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const profile = await ctx.db.trustProfile.findUnique({
        where: { userId: ctx.user.id },
      });

      if (!profile) {
        throw new Error("Trust profile not found");
      }

      return ctx.db.trustProfile.update({
        where: { id: profile.id },
        data: input,
      });
    }),

  /**
   * Get heatmap data for a profile
   * Returns daily verification counts for the past year
   */
  getHeatmapData: publicProcedure
    .input(z.object({ username: z.string() }))
    .query(async ({ ctx, input }) => {
      const profile = await ctx.db.trustProfile.findUnique({
        where: { username: input.username },
        select: { id: true },
      });

      if (!profile) {
        return [];
      }

      // Get all verifications from the past year
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      const verifications = await ctx.db.humanVerification.findMany({
        where: {
          trustProfileId: profile.id,
          verified: true,
          createdAt: { gte: oneYearAgo },
        },
        select: {
          createdAt: true,
        },
      });

      // Aggregate by date
      const dateMap = new Map<string, number>();
      for (const v of verifications) {
        const dateKey = v.createdAt.toISOString().slice(0, 10);
        dateMap.set(dateKey, (dateMap.get(dateKey) || 0) + 1);
      }

      // Convert to array format for heatmap
      return Array.from(dateMap.entries()).map(([date, value]) => ({
        date,
        value,
      }));
    }),

  /**
   * Get paginated activities for a profile
   * Supports infinite scroll
   */
  getActivities: publicProcedure
    .input(
      z.object({
        username: z.string(),
        cursor: z.string().optional(), // Last activity ID for pagination
        limit: z.number().min(1).max(50).default(12),
      }),
    )
    .query(async ({ ctx, input }) => {
      const profile = await ctx.db.trustProfile.findUnique({
        where: { username: input.username },
        select: { id: true },
      });

      if (!profile) {
        return { activities: [], nextCursor: null };
      }

      const includeVerification = {
        verification: { select: { verified: true } },
      };

      // Build query args based on whether we have a cursor
      const buildQueryArgs = () => {
        const base = {
          where: { trustProfileId: profile.id },
          take: input.limit + 1,
          orderBy: { createdAt: "desc" as const },
          include: includeVerification,
        };
        if (input.cursor) {
          return { ...base, cursor: { id: input.cursor }, skip: 1 };
        }
        return base;
      };

      const queryArgs = buildQueryArgs();

      // Fetch from all platforms in parallel
      const [linkedin, x, facebook, threads, reddit, ph, github, hn] = await Promise.all([
        ctx.db.verifiedLinkedInActivity.findMany(queryArgs),
        ctx.db.verifiedXActivity.findMany(queryArgs),
        ctx.db.verifiedFacebookActivity.findMany(queryArgs),
        ctx.db.verifiedThreadsActivity.findMany(queryArgs),
        ctx.db.verifiedRedditActivity.findMany(queryArgs),
        ctx.db.verifiedPHActivity.findMany(queryArgs),
        ctx.db.verifiedGitHubActivity.findMany(queryArgs),
        ctx.db.verifiedHNActivity.findMany(queryArgs),
      ]);

      // Merge and sort
      const allActivities = [
        ...linkedin.map((a) => mapActivity(a, "linkedin")),
        ...x.map((a) => mapActivity(a, "x")),
        ...facebook.map((a) => mapActivity(a, "facebook")),
        ...threads.map((a) => mapActivity(a, "threads")),
        ...reddit.map((a) => mapActivity(a, "reddit")),
        ...ph.map((a) => mapActivity(a, "ph")),
        ...github.map((a) => mapActivity(a, "github")),
        ...hn.map((a) => mapActivity(a, "hn")),
      ]
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, input.limit + 1);

      // Check if there are more results
      const hasMore = allActivities.length > input.limit;
      const activities = hasMore
        ? allActivities.slice(0, input.limit)
        : allActivities;
      const nextCursor = hasMore
        ? activities[activities.length - 1]?.id
        : null;

      return {
        activities,
        nextCursor,
      };
    }),
});
