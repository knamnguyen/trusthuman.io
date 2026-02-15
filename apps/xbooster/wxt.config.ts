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
    // Fixed key ensures consistent extension ID across installs (preserves chrome.storage)
    key: "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA4j3Nxc4h6za2Imjv5bBzEy+VDaQDpA0otWhli5Vvl4qlVZwdZjPssMf1WV7ZYism9bD7cM3Td9sEkFGNChC45b0gfnG8IoAzWMJlTMwL1JBuVCbEgZrkuGFiSPIJX57VEJ4YvpGZmURHjnO5phjcRWA/OxNBq+tEz8GIduIV1n1V3uxEvHxpzQCNjktnQIjSwIGplimg/a85UBCr3dg1KFLywwWJQpZMbjkJDbtFITuAQoXmR0+owC/qDK9dZ/gUx0XvHVLYn9aR0fV8Tq9Us0ibKMRkd9P+hjfsTSsS0MQYi6OYBzdkrv5YV8TtBrZ5yQE9aRWlYEb5zm1dfTBhFQIDAQAB",
    name: "xBooster",
    description: "X/Twitter Engagement Automation",
    version: "0.1.0",
    permissions: ["storage", "tabs", "cookies", "webRequest", "alarms"],
    host_permissions: [
      "https://*.x.com/*",
      "https://x.com/*",
      "https://generativelanguage.googleapis.com/*",
    ],
    content_security_policy: {
      extension_pages:
        "script-src 'self'; object-src 'self'; connect-src 'self' http://localhost:* ws://localhost:* https://generativelanguage.googleapis.com;",
    },
    web_accessible_resources: [
      {
        resources: ["page-context.js"],
        matches: ["https://*.x.com/*", "https://x.com/*"],
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
