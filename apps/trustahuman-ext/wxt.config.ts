import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "wxt";

import pkg from "./package.json";

// Calculate port based on PORT env var (PORT + 4)
// Main repo: PORT=3000 → WXT=3004
// Worktree with PORT=3010 → WXT=3014
const basePort = parseInt(process.env.PORT || "3000");
const wxtPort = basePort + 4;

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
    // Generated via: openssl genrsa 2048 | openssl rsa -pubout -outform DER | openssl base64 -A
    key: "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAtPy39Z0SqBkYIbXcjhI2NarZSWZ8L2XyKLaMWcOthZ0Y1s4IpvJVCg6GxOZvbm2+KVmMM4m7V/hb+jLba2BFypycq0ZoAjscbtG58f9aFKkOwUj+cePkU2GaYFbanH8oUice4nXsZGwnrRUgoHqGQHi1gR6RURKGubtiH0I208RhyeC6DSm6OmiBMmuhV7/SQund2eLSsxCBalvbbKuVuhIsOeHzjKmnQvLlmSjLV04anU6tdnHNJJdV9poBnNh3D+N5+TwOgFjSpnAoqXvE0+a2InhtwnidQR31tvevqYpRGQf0t999BSJY1NelLTRFt/6THyUuECYXxwSS7pSEpwIDAQAB",
    name: "TrustHuman",
    description:
      "Verify you're human when commenting on LinkedIn, X, and Facebook",
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
      "offscreen",
      "storage",
      "alarms",
      "tabs",
      "cookies",
    ],
    host_permissions: [
      "https://*.linkedin.com/*",
      "https://x.com/*",
      "https://twitter.com/*",
      "https://*.facebook.com/*",
      // Production domains for Clerk syncHost
      "https://trusthuman.io/*",
      "https://accounts.trusthuman.io/*",
      "https://clerk.trusthuman.io/*",
      // Clerk dev domains
      "https://*.clerk.accounts.dev/*",
      "https://*.clerk.dev/*",
      // Add localhost for development
      "http://localhost/*",
    ],
    content_security_policy: {
      extension_pages:
        "script-src 'self'; object-src 'self'; connect-src 'self' http://localhost:* ws://localhost:* https://*.posthog.com https://*.clerk.accounts.dev https://accounts.trusthuman.io https://clerk.trusthuman.io;",
    },
    web_accessible_resources: [
      {
        resources: [
          "trusthuman-logo.png",
          "trusthuman-logo.svg",
        ],
        matches: [
          "https://*.linkedin.com/*",
          "https://x.com/*",
          "https://twitter.com/*",
          "https://*.facebook.com/*",
        ],
      },
    ],
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
