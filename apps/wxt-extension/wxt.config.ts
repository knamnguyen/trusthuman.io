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
    name: "EngageKit",
    description: "Your trusty LinkedIn engagekit assistant.",
    version: "0.0.1",
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
      // Allow access to web app for auth sync (dynamic based on environment)
      ...(process.env.VITE_APP_URL ? [process.env.VITE_APP_URL + "/*"] : []),
      // Add localhost for development
      "http://localhost/*",
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
