import { resolve } from "path";
import { crx, ManifestV3Export } from "@crxjs/vite-plugin";
import { defineConfig, mergeConfig, UserConfig } from "vite";

import getBaseConfig from "./vite.config.base";

let outDir = resolve(__dirname, "dist_chrome");

if (process.env.TARGET_ENV === "hyperbrowser") {
  outDir = resolve(__dirname, "dist_hyperbrowser");
}

// We need to call defineConfig ourselves to get access to the mode
export default defineConfig(({ command, mode }) => {
  // Get the base config by calling the function
  const baseConfig = getBaseConfig({ command, mode }) as UserConfig & {
    customData: any;
  };

  const { baseManifest, baseBuildOptions } = baseConfig.customData;

  return mergeConfig(
    baseConfig,
    defineConfig({
      plugins: [
        crx({
          manifest: {
            ...baseManifest,
            background: {
              service_worker: "src/pages/background/index.ts",
              type: "module",
            },
          } as ManifestV3Export,
          browser: "chrome",
          contentScripts: {
            injectCss: true,
          },
        }),
      ],
      build: {
        ...baseBuildOptions,
        outDir,
      },
    }),
  );
});
