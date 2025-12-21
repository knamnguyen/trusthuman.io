import { QueryClient } from "@tanstack/react-query";

/**
 * Query Client configuration for WXT Extension
 *
 * Used with tRPC React Query integration for LinkedIn sidebar
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Disable automatic refetching in extension context
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      // 5 minutes cache time
      staleTime: 5 * 60 * 1000,
      // Keep data in cache for 10 minutes
      gcTime: 10 * 60 * 1000,
      // Don't retry failed requests automatically
      retry: 1,
    },
  },
});
