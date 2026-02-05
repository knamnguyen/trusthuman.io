import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "wxt";

// Port offset +3 to avoid conflict with wxt-extension (+2)
const basePort = parseInt(process.env.PORT || "3000");
const wxtPort = basePort + 3;

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
    name: "xBooster",
    description: "X/Twitter Engagement Automation",
    version: "0.1.0",
    permissions: ["storage", "tabs", "cookies", "webRequest"],
    host_permissions: [
      "https://*.x.com/*",
      "https://x.com/*",
      "https://generativelanguage.googleapis.com/*",
    ],
    content_security_policy: {
      extension_pages:
        "script-src 'self'; object-src 'self'; connect-src 'self' http://localhost:* ws://localhost:* https://generativelanguage.googleapis.com;",
    },
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
