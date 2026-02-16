import { createTRPCContext } from "@trpc/tanstack-react-query";
import type { AppRouter } from "@sassy/api";

export const { useTRPC, TRPCProvider } = createTRPCContext<AppRouter>();
