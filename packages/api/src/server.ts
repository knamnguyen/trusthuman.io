import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import Bun from "bun";

import { appRouter } from "./router/root";
import { createTRPCContext } from "./trpc";
import { browserJobs } from "./utils/browser-job";

// schedule browser jobs to run daily at 13:00 UTC
const startAt = new Date();
startAt.setUTCHours(13, 0, 0, 0);
void browserJobs.scheduleJobsEvery(startAt, 24 * 60 * 60_000);

Bun.serve({
  port: Number(process.env.PORT ?? 3000),
  routes: {
    "/api/trpc/*": async (req) => {
      const res = await fetchRequestHandler({
        endpoint: "/api/trpc",
        router: appRouter,
        req,
        createContext: () => {
          return createTRPCContext({
            headers: req.headers,
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

      return res;
    },
  },
});
