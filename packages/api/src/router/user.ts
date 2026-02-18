import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const userRouter = createTRPCRouter({
  /**
   * Get current user info
   */
  getMe: protectedProcedure.query(async ({ ctx }) => {
    const dbUser = await ctx.db.user.findUnique({
      where: { id: ctx.user.id },
      include: {
        trustProfile: true,
      },
    });

    return dbUser;
  }),

  /**
   * Update user profile
   */
  updateProfile: protectedProcedure
    .input(
      z.object({
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        username: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.user.update({
        where: { id: ctx.user.id },
        data: input,
      });
    }),
});
