import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import Bun from "bun";

import { webhookRoutes } from "./api/webhooks/webhooks";
import { appRouter } from "./router/root";
import { createTRPCContext } from "./trpc";
import { browserJobs } from "./utils/browser-job";

// schedule browser jobs to run daily at 13:00 UTC
// const startAt = new Date();
// startAt.setUTCHours(13, 0, 0, 0);
// void browserJobs.scheduleJobsEvery(startAt, 24 * 60 * 60_000);

const VITE_APP_URL = process.env.VITE_APP_URL;
if (!VITE_APP_URL) {
  throw new Error("VITE_APP_URL is not defined in environment variables");
}

const url = new URL(VITE_APP_URL);

console.log(`Starting server at port ${url.port}...`);

Bun.serve({
  port: url.port,
  routes: {
    "/api/trpc/*": async (req) => {
      if (req.method === "OPTIONS") {
        return new Response(null, {
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Request-Method": "*",
            "Access-Control-Allow-Methods": "OPTIONS, GET, POST",
            "Access-Control-Allow-Headers": "*",
          },
        });
      }

      const start = performance.now();
      const res = await fetchRequestHandler({
        endpoint: "/api/trpc",
        router: appRouter,
        req,
        createContext: () => {
          return createTRPCContext({
            headers: req.headers,
            req,
          });
        },
        onError({ error, path }) {
          console.error(`>>> tRPC Error on '${path}'`, error);
        },
      });

      res.headers.set("Access-Control-Allow-Origin", "*");
      res.headers.set("Access-Control-Request-Method", "*");
      res.headers.set("Access-Control-Allow-Methods", "OPTIONS, GET, POST");
      res.headers.set("Access-Control-Allow-Headers", "*");

      const durationMs = performance.now() - start;

      console.info(`[${new Date().toISOString()}] ${req.url} ${durationMs}ms`);

      return res;
    },
    "/api/webhooks/*": (req) => webhookRoutes.fetch(req),
  },
});

console.log(`server running at ${VITE_APP_URL}/api/trpc`);
