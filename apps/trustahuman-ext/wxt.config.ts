import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "wxt";

const basePort = parseInt(process.env.PORT || "3000");
const wxtPort = basePort + 4;

export default defineConfig({
  extensionApi: "chrome",
  modules: ["@wxt-dev/module-react"],
  outDir: "dist",

  runner: {
    disabled: true,
  },

  dev: {
    server: {
      port: wxtPort,
    },
  },

  manifest: {
    name: "Trust a Human",
    description: "Verify you are human when commenting on LinkedIn",
    version: "0.1.0",
    permissions: ["offscreen", "storage"],
    host_permissions: [
      "https://*.linkedin.com/*",
      "https://*.trusthuman.io/*",
      "http://localhost/*",
    ],
    web_accessible_resources: [
      {
        resources: ["trusthuman-logo.svg"],
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
    esbuild: {
      charset: "ascii",
    },
  }),
});
