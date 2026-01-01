import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

// import { LinkedInScrapeApifyService } from "@sassy/linkedin-scrape-apify";
import { ImportStatus } from "@sassy/db";

import { protectedProcedure } from "../trpc";
import { checkPremiumAccess } from "../utils/check-premium-access";
import { executeRetrieve } from "../utils/execute-retrieve";
import { executeRun } from "../utils/execute-run";

export const profileImportRouter = () =>
  ({
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
        const active = await ctx.db.profileImportRun.findFirst({
          where: {
            userId: ctx.user.id,
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
            userId: ctx.user.id,
            urls: input.urls,
          },
          select: { id: true },
        });

        // auto-start run in background
        void executeRun(ctx, run.id);
        return run; // { id }
      }),

    createRetrieveOnly: protectedProcedure
      .input(z.object({ urls: z.array(z.string().url()).min(1) }))
      .mutation(async ({ ctx, input }) => {
        const access = await checkPremiumAccess(ctx);
        if (!access || access === "FREE") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Premium subscription required",
          });
        }

        // Create a run record immediately (no 100 limit)
        const run = await ctx.db.profileImportRun.create({
          data: {
            userId: ctx.user.id,
            urls: input.urls,
            status: ImportStatus.NOT_STARTED,
          },
          select: { id: true },
        });

        // Compute retrieval results
        const { succeeded, failed } = await executeRetrieve(ctx, input.urls);

        // Persist outcomes and mark finished
        await ctx.db.profileImportRun.update({
          where: { id: run.id },
          data: {
            urlsSucceeded: { push: succeeded },
            urlsFailed: { push: failed },
            status: ImportStatus.FINISHED,
          },
        });

        return { id: run.id } as const;
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
      const runs = await ctx.db.profileImportRun.findMany({
        where: { userId: ctx.user.id },
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
        if (run.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
        }
        return {
          id: run.id,
          status: run.status,
          succeeded: run.urlsSucceeded.length,
          failed: run.urlsFailed.length,
        } as const;
      }),

    stopRun: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
        const run = await ctx.db.profileImportRun.findUnique({
          where: { id: input.id },
          select: { id: true, userId: true, status: true },
        });
        if (!run)
          throw new TRPCError({ code: "NOT_FOUND", message: "Run not found" });
        if (run.userId !== ctx.user.id)
          throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
        if (run.status === "FINISHED")
          return { id: input.id, stopped: false } as const;
        await ctx.db.profileImportRun.update({
          where: { id: input.id },
          data: { status: "FINISHED" },
        });
        return { id: input.id, stopped: true } as const;
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
        if (run.userId !== ctx.user.id) {
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
        if (run.userId !== ctx.user.id)
          throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
        const urls = run.urlsSucceeded;
        if (urls.length === 0) return [];
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
          profilePhotoUrl: p.profilePic,
          profileUrl: p.linkedinUrl,
          fullName: p.fullName,
          headline: p.headline,
          profileUrn: p.urn,
        }));
      }),
  }) satisfies TRPCRouterRecord;
