import { Hono } from "hono";
import { logger } from "hono/logger";

import { geminiUploadRoute } from "./routes/gemini-upload";
import { healthRoute } from "./routes/health";

const app = new Hono();

// Middleware
app.use("*", logger());
// Note: CORS is handled by Nginx reverse proxy, not by Hono

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

// Use Bun's native server instead of @hono/node-server
export default {
  fetch: app.fetch,
  port,
};
