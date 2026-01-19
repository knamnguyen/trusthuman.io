import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "wxt";

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
    key: "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAjJ8hFJ/0VNPdjWqURUdXdRQ/43ZJIiwCFu/74e/WSb2x2E6c9+VUl+Jvo3zBYMh8dlP6MBG2L3EVJ406bmj7r+sjZt66NFgdmTOb25725c2pJTIPU/V/3As1IGwgQ2dsxdg4zjsntaxsb1hPT5wVECWU11Y5EN5/aixPSUZ9Jj1+W7QtBUS2aS4B3lPrq6nMTwzLXeQ6Zm2FKwPX7LoR1o08gid3JgFoeWcv+PXn6vca0IGXaOxCSUKqYENKLbYxjucFEnYuErQESvNOOcFvSdWPorjI0pWDpMy0doIbWO4yvmvCA5D2FT2PkVP8IHWI/tyFhSQ0hitWUDBR3HX8NwIDAQAB",
    name: "EngageKit",
    description:
      "Engage Authentically on LinkedIn - Fast, Targeted, & without AI Slop",
    version: "1.0.0",
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
      "https://*.clerk.accounts.dev/*",
      "https://*.clerk.dev/*",
      "https://engagekit.io/*",
      "https://accounts.engagekit.io/*",
      "https://clerk.engagekit.io/*",
    ],
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
  }),
});
