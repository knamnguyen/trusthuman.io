import { TRPCError } from "@trpc/server";

import type { TRPCContext } from "../trpc";

export const checkPremiumAccess = async (ctx: TRPCContext) => {
  if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
  const user = await ctx.db.user.findUnique({
    where: { id: ctx.user.id },
  });
  const access = user?.accessType;
  return access;
};
