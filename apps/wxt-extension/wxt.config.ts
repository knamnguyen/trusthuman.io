import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  extensionApi: "chrome",
  modules: ["@wxt-dev/module-react"],
  outDir: "dist",

  // Disable auto-opening browser on dev
  runner: {
    disabled: true,
  },

  manifest: {
    name: "EngageKit WXT POC",
    description: "POC for WXT-based LinkedIn sidebar extension",
    version: "0.0.1",
    permissions: ["activeTab", "storage"],
    host_permissions: ["https://*.linkedin.com/*"],
    web_accessible_resources: [
      {
        resources: ["fonts/*"],
        matches: ["https://*.linkedin.com/*"],
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
  }),
});
