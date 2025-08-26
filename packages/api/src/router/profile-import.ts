import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

// import { LinkedInScrapeApifyService } from "@sassy/linkedin-scrape-apify";
import { ImportStatus } from "@sassy/db";

import { protectedProcedure } from "../trpc";
import { checkPremiumAccess } from "../utils/check-premium-access";
import { executeRun } from "../utils/execute-run";

export const profileImportRouter = {
  createRun: protectedProcedure
    .input(z.object({ urls: z.array(z.string().url()).min(1).max(100) }))
    .mutation(async ({ ctx, input }) => {
      const access = await checkPremiumAccess(ctx);
      if (!access || access === "FREE") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Premium subscription required",
        });
      }

      // one active run max: check for PENDING or RUNNING
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });
      const active = await ctx.db.profileImportRun.findFirst({
        where: {
          userId,
          status: { in: [ImportStatus.NOT_STARTED, ImportStatus.RUNNING] },
        },
        select: { id: true },
      });
      if (active) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Active run exists: ${active.id}`,
        });
      }

      const run = await ctx.db.profileImportRun.create({
        data: {
          userId,
          urls: input.urls,
        },
        select: { id: true },
      });

      // auto-start run in background
      void executeRun(ctx, run.id);
      return run; // { id }
    }),

  getRun: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const run = await ctx.db.profileImportRun.findUnique({
        where: { id: input.id },
        select: { id: true, userId: true, urls: true, createdAt: true },
      });
      if (!run) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Run not found" });
      }
      if (run.userId !== ctx.user!.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }
      return run;
    }),

  listRuns: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user?.id;
    if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });
    const runs = await ctx.db.profileImportRun.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        urls: true,
        createdAt: true,
        status: true,
        urlsSucceeded: true,
        urlsFailed: true,
      },
    });
    return runs.map((r) => ({
      id: r.id,
      urls: r.urls,
      createdAt: r.createdAt,
      status: r.status,
      succeededCount: r.urlsSucceeded.length,
      failedCount: r.urlsFailed.length,
    }));
  }),

  startRun: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const run = await ctx.db.profileImportRun.findUnique({
        where: { id: input.id },
        select: { id: true, userId: true },
      });
      if (!run)
        throw new TRPCError({ code: "NOT_FOUND", message: "Run not found" });
      if (run.userId !== ctx.user!.id)
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });

      await executeRun(ctx, input.id);
      return { id: input.id } as const;
    }),

  checkRunStatus: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const run = await ctx.db.profileImportRun.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          userId: true,
          status: true,
          urlsSucceeded: true,
          urlsFailed: true,
        },
      });
      if (!run) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Run not found" });
      }
      if (run.userId !== (ctx.user?.id ?? "")) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }
      return {
        id: run.id,
        status: run.status,
        succeeded: run.urlsSucceeded.length,
        failed: run.urlsFailed.length,
      } as const;
    }),

  getRunDetails: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const run = await ctx.db.profileImportRun.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          userId: true,
          status: true,
          urlsSucceeded: true,
          urlsFailed: true,
          urls: true,
          createdAt: true,
        },
      });
      if (!run) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Run not found" });
      }
      if (run.userId !== (ctx.user?.id ?? "")) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }
      return run;
    }),

  listProfilesForRun: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const run = await ctx.db.profileImportRun.findUnique({
        where: { id: input.id },
        select: { userId: true, urlsSucceeded: true },
      });
      if (!run)
        throw new TRPCError({ code: "NOT_FOUND", message: "Run not found" });
      if (run.userId !== (ctx.user?.id ?? ""))
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      const urls = run.urlsSucceeded;
      if (urls.length === 0) return [] as const;
      const profiles = await ctx.db.linkedInProfile.findMany({
        where: { linkedinUrl: { in: urls } },
        select: {
          profilePic: true,
          linkedinUrl: true,
          fullName: true,
          headline: true,
          urn: true,
        },
      });
      return profiles.map((p) => ({
        profilePhotoUrl: p.profilePic ?? undefined,
        profileUrl: p.linkedinUrl,
        fullName: p.fullName ?? undefined,
        headline: p.headline ?? undefined,
        profileUrn: p.urn ?? undefined,
      }));
    }),
} satisfies TRPCRouterRecord;
