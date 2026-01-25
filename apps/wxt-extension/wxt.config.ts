import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "wxt";
import pkg from "./package.json";

// Calculate port based on PORT env var (PORT + 2)
// Main repo: PORT=3000 → WXT=3002
// Worktree with PORT=3010 → WXT=3012
const basePort = parseInt(process.env.PORT || "3000");
const wxtPort = basePort + 2;

// See https://wxt.dev/api/config.html
export default defineConfig({
  extensionApi: "chrome",
  modules: ["@wxt-dev/module-react"],
  outDir: "dist",

  // Disable auto-opening browser on dev
  runner: {
    disabled: true,
  },

  // Configure dev server port to avoid conflicts
  dev: {
    server: {
      port: wxtPort,
    },
  },

  manifest: {
    // Key for consistent extension ID (required for Clerk production)
    key: "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEApqjDV0Jq4V1zQFSNFuMGftFrekQ6ZcLhgI0lXwCD1n6AuZtoaEQFGlyPWbVmdMP8RdjVZdotsCVUA+x9FtvztcMnYFD9Rh31v8EC76JWFl0TmIEsyHxrKKnQVyiGtLS6YdVHbsG5I/IyxueEBPJs45DWRESt9DnUdGfHWInOcwo9dDN2ZDfuEvHlRRmjXp4KF4y5pON8eVs9ZVbnHrxU5Q3PQjWR8DuI6OZJm72/HYcxOxXwuuyNq8pZSdISEpx3XMr5+bQ/u7BFr9xc1UVq1QVjX2DynPPXvyB7hQ2FkrjlqWx4USS5Pt4zQXxiGCQZ0MJvsnGbtEe31kl89slXiwIDAQAB",
    name: "EngageKit",
    description:
      "Engage Authentically on LinkedIn - Fast, Targeted, & without AI Slop",
    version: pkg.version,
    icons: {
      16: "icon16.png",
      19: "icon19.png",
      32: "icon32.png",
      38: "icon38.png",
      48: "icon48.png",
      128: "icon128.png",
    },
    permissions: [
      "activeTab",
      "storage",
      "alarms",
      "tabs",
      "cookies",
      "webRequest",
    ],
    host_permissions: [
      "https://*.linkedin.com/*",
      // Production domains for Clerk syncHost
      "https://engagekit.io/*",
      "https://accounts.engagekit.io/*",
      "https://clerk.engagekit.io/*",
      // Clerk dev domains
      "https://*.clerk.accounts.dev/*",
      "https://*.clerk.dev/*",
      // Add localhost for development
      "http://localhost/*",
    ],
    content_security_policy: {
      extension_pages:
        "script-src 'self'; object-src 'self'; connect-src 'self' http://localhost:* ws://localhost:* https://*.posthog.com https://*.clerk.accounts.dev https://accounts.engagekit.io https://clerk.engagekit.io;",
    },
    web_accessible_resources: [
      {
        resources: [
          "fonts/*",
          "engagekit-logo.svg",
          "engagekit-sprite-loading.svg",
          "engagekit-sprite-default.svg",
          "engagekit-sprite-blink.svg",
          "engagekit-sprite-breathe.svg",
          "block-file-picker.js",
        ],
        matches: ["https://*.linkedin.com/*"],
      },
    ],
    // use_dynamic_url: true, // Prevents extension fingerprinting by regenerating ID per session
  },

  vite: () => ({
    plugins: [tsconfigPaths()],
    css: {
      postcss: {
        plugins: [
          require("tailwindcss"),
          require("postcss-rem-to-pixel")({
            rootValue: 16,
            propList: ["*"],
            selectorBlackList: [],
          }),
          require("autoprefixer"),
        ],
      },
    },
    esbuild: {
      charset: "ascii",
    },
  }),
});
