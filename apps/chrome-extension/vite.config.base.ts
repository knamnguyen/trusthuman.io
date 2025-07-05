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

// By exporting a function, we can access the Vite config mode
export default defineConfig(({ mode }) => {
  const isDev = mode === "development";

  const baseManifest = {
    ...manifest,
    version: pkg.version,
    ...(isDev ? devManifest : ({} as ManifestV3Export)),
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
        isDev
          ? "http://localhost:3000"
          : (process.env.VITE_APP_URL ?? "https://engagekit.io"),
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
    },
    build: baseBuildOptions,
    // Provide manifest and build options to consumers
    customData: {
      baseManifest,
      baseBuildOptions,
    },
  };
});
