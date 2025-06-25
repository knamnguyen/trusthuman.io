import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import { geminiUploadRoute } from "./routes/gemini-upload";
import { healthRoute } from "./routes/health";

const app = new Hono();

// Middleware
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: [
      "http://localhost:3000", // Next.js dev
      "https://viralcut.app", // Production domain - UPDATE THIS
    ],
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    maxAge: 86400,
  }),
);

// Routes
app.route("/health", healthRoute);
app.route("/upload", geminiUploadRoute);

// Error handling
app.onError((err, c) => {
  console.error("Server error:", err);
  return c.json(
    {
      error: "Internal server error",
      message: err.message,
    },
    500,
  );
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: "Not found" }, 404);
});

const port = Number(process.env.PORT) || 3001;

console.log(`🚀 Upload server starting on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});

export default app;
