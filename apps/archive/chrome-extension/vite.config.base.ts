import { resolve } from "path";
import { ManifestV3Export } from "@crxjs/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { BuildOptions, defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

import { crxI18n, stripDevIcons } from "./custom-vite-plugins";
import devManifest from "./manifest.dev.json";
import manifest from "./manifest.json";
import pkg from "./package.json";

// set this flag to true, if you want localization support
const localize = false;

const hyperbrowserExtensionKey =
  "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAjJ8hFJ/0VNPdjWqURUdXdRQ/43ZJIiwCFu/74e/WSb2x2E6c9+VUl+Jvo3zBYMh8dlP6MBG2L3EVJ406bmj7r+sjZt66NFgdmTOb25725c2pJTIPU/V/3As1IGwgQ2dsxdg4zjsntaxsb1hPT5wVECWU11Y5EN5/aixPSUZ9Jj1+W7QtBUS2aS4B3lPrq6nMTwzLXeQ6Zm2FKwPX7LoR1o08gid3JgFoeWcv+PXn6vca0IGXaOxCSUKqYENKLbYxjucFEnYuErQESvNOOcFvSdWPorjI0pWDpMy0doIbWO4yvmvCA5D2FT2PkVP8IHWI/tyFhSQ0hitWUDBR3HX8NwIDAQAB";

// By exporting a function, we can access the Vite config mode
export default defineConfig(({ mode }) => {
  const isDev = mode === "development";

  const isHyperbrowser = process.env.TARGET_ENV === "hyperbrowser";

  const baseManifest = {
    ...manifest,
    version: pkg.version,
    ...(isDev ? devManifest : ({} as ManifestV3Export)),
    ...(isHyperbrowser ? { key: hyperbrowserExtensionKey } : {}),
    ...(localize
      ? {
          name: "__MSG_extName__",
          description: "__MSG_extDescription__",
          default_locale: "en",
        }
      : {}),
  } as ManifestV3Export;

  const baseBuildOptions: BuildOptions = {
    sourcemap: isDev,
    emptyOutDir: !isDev,
  };

  return {
    plugins: [
      tailwindcss(),
      tsconfigPaths(),
      react(),
      stripDevIcons(isDev),
      crxI18n({ localize, src: "./src/locales" }),
    ],
    publicDir: resolve(__dirname, "public"),
    define: {
      // Expose production app URL
      "import.meta.env.VITE_APP_URL": JSON.stringify(
        process.env.VITE_APP_URL ?? "https://api.engagekit.io",
      ),
      // Explicitly expose Clerk environment variable
      "import.meta.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY": JSON.stringify(
        process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
      ),
      // Expose ngrok URL for development testing
      "import.meta.env.VITE_NGROK_URL": JSON.stringify(
        process.env.VITE_NGROK_URL,
      ),
      // Expose Next.js URL (which could be ngrok or localhost)
      "import.meta.env.VITE_NEXTJS_URL": JSON.stringify(process.env.NEXTJS_URL),
      // Expose PORT for dynamic URL construction
      "import.meta.env.VITE_PORT": JSON.stringify(process.env.PORT),
    },
    build: baseBuildOptions,
    // Provide manifest and build options to consumers
    customData: {
      baseManifest,
      baseBuildOptions,
    },
  };
});
