import { TRPCError } from "@trpc/server";

import {
  commentGenerateSettingUpsertSchema,
  postLoadSettingUpsertSchema,
  submitCommentSettingUpsertSchema,
} from "@sassy/validators";

import { createTRPCRouter, protectedProcedure } from "../trpc";

/**
 * Settings Router - CRUD for PostLoadSetting, SubmitCommentSetting, CommentGenerateSetting
 *
 * All procedures require authenticated user + selected account from context
 * Settings are account-specific (1:1 with LinkedInAccount)
 */
export const settingsRouter = () =>
  createTRPCRouter({
    // =========================================================================
    // POST LOAD SETTING
    // =========================================================================

    postLoad: createTRPCRouter({
      /**
       * Get current account's PostLoadSetting
       * Returns null if not found
       */
      get: protectedProcedure.query(async ({ ctx }) => {
        if (!ctx.activeAccount) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "No active account selected",
          });
        }

        const setting = await ctx.db.postLoadSetting.findUnique({
          where: { accountId: ctx.activeAccount.id },
        });

        // Map DB casing to store casing (skipBlacklistEnabled -> skipBlacklistEnabled)
        if (setting) {
          return {
            ...setting,
            skipBlacklistEnabled: setting.skipBlacklistEnabled,
          };
        }

        return setting;
      }),

      /**
       * Create or update PostLoadSetting
       * Upserts based on accountId
       */
      upsert: protectedProcedure
        .input(postLoadSettingUpsertSchema)
        .mutation(async ({ ctx, input }) => {
          if (!ctx.activeAccount) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "No active account selected",
            });
          }

          console.log("Input", input);

          const setting = await ctx.db.postLoadSetting.upsert({
            where: { accountId: ctx.activeAccount.id },
            update: input,
            create: {
              accountId: ctx.activeAccount.id,
              ...input,
            },
          });

          return setting;
        }),
    }),

    // =========================================================================
    // SUBMIT COMMENT SETTING
    // =========================================================================

    submitComment: createTRPCRouter({
      /**
       * Get current account's SubmitCommentSetting
       * Returns null if not found
       */
      get: protectedProcedure.query(async ({ ctx }) => {
        if (!ctx.activeAccount) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "No active account selected",
          });
        }

        return await ctx.db.submitCommentSetting.findUnique({
          where: { accountId: ctx.activeAccount.id },
        });
      }),

      /**
       * Create or update SubmitCommentSetting
       * Upserts based on accountId
       */
      upsert: protectedProcedure
        .input(submitCommentSettingUpsertSchema)
        .mutation(async ({ ctx, input }) => {
          if (!ctx.activeAccount) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "No active account selected",
            });
          }

          return await ctx.db.submitCommentSetting.upsert({
            where: { accountId: ctx.activeAccount.id },
            update: input,
            create: {
              accountId: ctx.activeAccount.id,
              ...input,
            },
          });
        }),
    }),

    // =========================================================================
    // COMMENT GENERATE SETTING
    // =========================================================================

    commentGenerate: createTRPCRouter({
      /**
       * Get current account's CommentGenerateSetting
       * Returns null if not found
       */
      get: protectedProcedure.query(async ({ ctx }) => {
        if (!ctx.activeAccount) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "No active account selected",
          });
        }

        return await ctx.db.commentGenerateSetting.findUnique({
          where: { accountId: ctx.activeAccount.id },
        });
      }),

      /**
       * Create or update CommentGenerateSetting
       * Upserts based on accountId
       */
      upsert: protectedProcedure
        .input(commentGenerateSettingUpsertSchema)
        .mutation(async ({ ctx, input }) => {
          if (!ctx.activeAccount) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "No active account selected",
            });
          }

          return await ctx.db.commentGenerateSetting.upsert({
            where: { accountId: ctx.activeAccount.id },
            update: input,
            create: {
              accountId: ctx.activeAccount.id,
              ...input,
            },
          });
        }),
    }),
  });
