import { TRPCError } from "@trpc/server";

import type { TRPCContext } from "../trpc";

/**
 * @deprecated Use `hasPremiumAccess` from `@/access-control/organization` instead.
 * This function uses user-based billing (User.accessType) which is deprecated.
 * The new function uses organization-based billing (Organization.subscriptionTier).
 */
export const checkPremiumAccess = async (ctx: TRPCContext) => {
  if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
  const user = await ctx.db.user.findUnique({
    where: { id: ctx.user.id },
  });
  const access = user?.accessType;
  return access;
};
