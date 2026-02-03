import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import Bun from "bun";

import { db } from "@sassy/db";

import { webhookRoutes } from "./api/webhooks/webhooks";
import { appRouter } from "./router/root";
import { createTRPCContext } from "./trpc";
import { browserJobs } from "./utils/browser-job";
import { initDBOS } from "./workflows";

// DB Keepalive - ping every 30 seconds to prevent Supabase Supavisor from dropping idle connections
// Uses a lightweight Prisma query (not $connect which can cause pool issues)
// runs even when there are no users to avoid db cold start
const DB_KEEPALIVE_INTERVAL_MS = 30_000;
// eslint-disable-next-line @typescript-eslint/no-misused-promises
setInterval(async () => {
  try {
    // Simple count query - lightweight way to keep connection alive
    await db.$executeRaw`SELECT 1`;
    // console.debug("DB keepalive ping successful");
  } catch (error) {
    console.warn("DB keepalive ping failed:", error);
  }
}, DB_KEEPALIVE_INTERVAL_MS);

// schedule browser jobs to run daily at 13:00 UTC
// const startAt = new Date();
// startAt.setUTCHours(13, 0, 0, 0);
// void browserJobs.scheduleJobsEvery(startAt, 24 * 60 * 60_000);

const VITE_APP_URL = process.env.VITE_APP_URL;
if (!VITE_APP_URL) {
  throw new Error("VITE_APP_URL is not defined in environment variables");
}

const url = new URL(VITE_APP_URL);

let tls;

// eslint-disable-next-line turbo/no-undeclared-env-vars
if (process.env.TLS_KEY !== undefined && process.env.TLS_CERT !== undefined) {
  console.info(
    "detecting env TLS_KEY and TLS_CERT, enabling TLS for Bun server",
  );
  tls = {
    // eslint-disable-next-line turbo/no-undeclared-env-vars
    key: Bun.file(process.env.TLS_KEY),
    // eslint-disable-next-line turbo/no-undeclared-env-vars
    cert: Bun.file(process.env.TLS_CERT),
  };
}

// Initialize DBOS for scheduled workflows (e.g. daily quota reset)
void initDBOS()
  .then(() => console.log("[DBOS] initialized successfully"))
  .catch((err) => console.error("[DBOS] initialization failed:", err));

Bun.serve({
  port: url.port,
  tls,
  development: process.env.NODE_ENV !== "production",
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

      const url = new URL(req.url);
      console.info(
        `${res.status} GET ${url.pathname} ${(performance.now() - start).toFixed(2)}ms`,
      );

      return res;
    },
    "/api/webhooks/*": (req) => webhookRoutes.fetch(req),
    "/*": new Response("NOT FOUND", { status: 404 }),
  },
});

console.log(`trpc server running at ${VITE_APP_URL}/api/trpc`);
