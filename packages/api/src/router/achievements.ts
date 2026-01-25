/**
 * Achievements Router
 *
 * Provides engagement metrics and analytics for the achievements dashboard.
 * All procedures use accountProcedure to ensure proper account-level access control.
 */

import { accountProcedure, createTRPCRouter } from "../trpc";

export const achievementsRouter = () =>
  createTRPCRouter({
    /**
     * Get profile metrics: verified/assisted counts, percentile, and streaks
     */
    getProfileMetrics: accountProcedure.query(async ({ ctx }) => {
      const accountId = ctx.activeAccount.id;

      // 1. Get verified comments count (peakTouchScore >= 80)
      const verifiedCount = await ctx.db.comment.count({
        where: {
          accountId,
          status: "POSTED",
          peakTouchScore: { gte: 80 },
        },
      });

      // 2. Get assisted comments count (50 <= peakTouchScore < 80)
      const assistedCount = await ctx.db.comment.count({
        where: {
          accountId,
          status: "POSTED",
          peakTouchScore: { gte: 50, lt: 80 },
        },
      });

      // 3. Calculate total comments for this account
      const totalComments = verifiedCount + assistedCount;

      // 4. Calculate global percentile
      // Count total accounts with at least one posted comment
      const totalActiveAccounts = await ctx.db.comment.groupBy({
        by: ["accountId"],
        where: {
          status: "POSTED",
        },
        _count: {
          id: true,
        },
      });

      // Count accounts with MORE comments than current account
      const accountsWithMore = totalActiveAccounts.filter(
        (acc) => acc._count.id > totalComments,
      ).length;

      // Percentile = (accountsWithLess / totalAccounts) * 100
      const percentile =
        totalActiveAccounts.length > 0
          ? Math.round(
              ((totalActiveAccounts.length - accountsWithMore) /
                totalActiveAccounts.length) *
                100,
            )
          : 0;

      // 5. Calculate streaks (current and longest)
      const comments = await ctx.db.comment.findMany({
        where: {
          accountId,
          status: "POSTED",
          commentedAt: { not: null },
        },
        select: {
          commentedAt: true,
        },
        orderBy: {
          commentedAt: "desc",
        },
      });

      // Helper: Convert date to YYYY-MM-DD string
      const toDateString = (date: Date): string => {
        return date.toISOString().split("T")[0]!;
      };

      // Calculate streaks
      let currentStreak = 0;
      let longestStreak = 0;
      let tempStreak = 0;
      const today = toDateString(new Date());
      const uniqueDates = new Set<string>();

      // Get unique dates
      for (const comment of comments) {
        if (comment.commentedAt) {
          uniqueDates.add(toDateString(comment.commentedAt));
        }
      }

      const sortedDates = Array.from(uniqueDates).sort().reverse();

      // Calculate current streak (must include today or yesterday)
      if (sortedDates.length > 0) {
        const latestDate = sortedDates[0]!;
        const latestDateObj = new Date(latestDate);
        const todayObj = new Date(today);
        const daysDiff = Math.floor(
          (todayObj.getTime() - latestDateObj.getTime()) /
            (1000 * 60 * 60 * 24),
        );

        // Only count as current streak if last activity was today or yesterday
        if (daysDiff <= 1) {
          currentStreak = 1;
          for (let i = 1; i < sortedDates.length; i++) {
            const prevDate = new Date(sortedDates[i - 1]!);
            const currDate = new Date(sortedDates[i]!);
            const diff = Math.floor(
              (prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24),
            );

            if (diff === 1) {
              currentStreak++;
            } else {
              break;
            }
          }
        }
      }

      // Calculate longest streak
      if (sortedDates.length > 0) {
        tempStreak = 1;
        longestStreak = 1;

        for (let i = 1; i < sortedDates.length; i++) {
          const prevDate = new Date(sortedDates[i - 1]!);
          const currDate = new Date(sortedDates[i]!);
          const diff = Math.floor(
            (prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24),
          );

          if (diff === 1) {
            tempStreak++;
            longestStreak = Math.max(longestStreak, tempStreak);
          } else {
            tempStreak = 1;
          }
        }
      }

      // 6. Get profile info
      const account = await ctx.db.linkedInAccount.findUnique({
        where: { id: accountId },
        select: {
          profileSlug: true,
          owner: {
            select: {
              imageUrl: true,
            },
          },
        },
      });

      return {
        verifiedCount,
        assistedCount,
        percentile,
        currentStreak,
        longestStreak,
        profileSlug: account?.profileSlug ?? "",
        profileImageUrl: account?.owner?.imageUrl ?? null,
      };
    }),

    /**
     * Get network data: top 50 profiles by interaction count
     */
    getNetworkData: accountProcedure.query(async ({ ctx }) => {
      const accountId = ctx.activeAccount.id;

      // Group by authorProfileUrl and count interactions
      const networkData = await ctx.db.comment.groupBy({
        by: ["authorProfileUrl", "authorName", "authorAvatarUrl"],
        where: {
          accountId,
          status: "POSTED",
          authorProfileUrl: { not: null },
        },
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: "desc",
          },
        },
        take: 50,
      });

      return networkData.map((item) => ({
        authorProfileUrl: item.authorProfileUrl!,
        authorName: item.authorName,
        authorAvatarUrl: item.authorAvatarUrl,
        interactionCount: item._count.id,
      }));
    }),

    /**
     * Get activity data: 365-day daily comment counts
     */
    getActivityData: accountProcedure.query(async ({ ctx }) => {
      const accountId = ctx.activeAccount.id;

      // Calculate date 365 days ago
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 365);

      // Fetch all comments in last 365 days
      const comments = await ctx.db.comment.findMany({
        where: {
          accountId,
          status: "POSTED",
          commentedAt: { gte: startDate, not: null },
        },
        select: {
          commentedAt: true,
        },
      });

      // Group by date
      const dateCountMap = new Map<string, number>();

      for (const comment of comments) {
        if (comment.commentedAt) {
          const dateStr = comment.commentedAt.toISOString().split("T")[0]!;
          dateCountMap.set(dateStr, (dateCountMap.get(dateStr) ?? 0) + 1);
        }
      }

      // Generate array of all 365 days (fill missing dates with 0)
      const activityData: Array<{ date: string; count: number }> = [];
      const currentDate = new Date();

      for (let i = 364; i >= 0; i--) {
        const date = new Date(currentDate);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split("T")[0]!;

        activityData.push({
          date: dateStr,
          count: dateCountMap.get(dateStr) ?? 0,
        });
      }

      return activityData;
    }),
  });
