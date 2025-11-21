import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";

import type { AppRouter } from "./router/root";
import { appRouter } from "./router/root";
import { createCallerFactory, createTRPCContext } from "./trpc";

export type {
  BrowserFunctions,
  BrowserBackendChannelMessage,
} from "./utils/browser-session";

/**
 * Create a server-side caller for the tRPC API
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 * This can be used in the trpc procedures themselves (backend logic)
 * Or in the react server components (frontend logic) to fetch data in a simple manner
 * You most likely don't need to use this since it is better to reuse repos/functions
 * instead of recalling other procedures within procedures
 */
const createCaller = createCallerFactory(appRouter);
type AppRouterCaller = ReturnType<typeof createCaller>;

/**
 * Helper to create a server-side caller with the required context
 * This is useful for server-side operations where you need to call tRPC procedures
 * But don't use this inside the trpc procedures themselves because it will create a new context
 */
export const createServerClient = async (): Promise<AppRouterCaller> => {
  const ctx = await createTRPCContext({
    headers: new Headers(),
  });
  return appRouter.createCaller(ctx);
};

/**
 * Inference helpers for input types
 * @example
 * type PostByIdInput = RouterInputs['post']['byId']
 *      ^? { id: number }
 **/
type RouterInputs = inferRouterInputs<AppRouter>;

/**
 * Inference helpers for output types
 * @example
 * type AllPostsOutput = RouterOutputs['post']['all']
 *      ^? Post[]
 **/
type RouterOutputs = inferRouterOutputs<AppRouter>;

export { createTRPCContext, appRouter, createCaller };
export type { AppRouter, RouterInputs, RouterOutputs };

// Export schema validator types for use in other packages
export type {
  CommentGenerationInput,
  CommentGenerationOutput,
  CommentGeneratorConfig,
  CommentGeneratorError,
} from "./schema-validators";
