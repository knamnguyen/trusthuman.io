import path from "path";
import replace from "@rollup/plugin-replace";
import tailwindcss from "@tailwindcss/postcss";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

console.log("🔍 Building unified components bundle...");

// ---------------------------------------------------------
// PostCSS plugin to strip @layer wrappers from CSS output
// ---------------------------------------------------------
// Tailwind v4 wraps everything in @layer (base, utilities, etc.)
// When embedding widgets in external sites like Ghost, the host
// site's unlayered CSS (e.g., `img { height: auto }`) always beats
// layered CSS regardless of specificity.
//
// By stripping layers, our CSS becomes flat like Tailwind v3 output,
// allowing normal CSS specificity rules to apply:
// - `.h-8` (class, 0,1,0) beats `img` (element, 0,0,1)
// ---------------------------------------------------------
function stripCssLayers() {
  return {
    postcssPlugin: "strip-css-layers",
    Once(root) {
      root.walkAtRules("layer", (atRule) => {
        atRule.replaceWith(atRule.nodes);
      });
    },
  };
}
stripCssLayers.postcss = true;

// ---------------------------------------------------------
// ✅ Unified Components Build Configuration
// ---------------------------------------------------------
// Single entry point: src/components/index.ts
// Outputs: public/components.js and public/components.css
// ---------------------------------------------------------
export default defineConfig(({ mode }) => {
  // Load env vars
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],

    // 🔑 Add this block so imports like "@/lib/utils" and "@sassy/ui" work
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "~": path.resolve(__dirname, "./src"),
        // Match package.json exports: "./*" -> "./src/ui/*.tsx"
        "@sassy/ui/utils": path.resolve(
          __dirname,
          "../../packages/ui/src/utils.ts",
        ),
        "@sassy/ui/components": path.resolve(
          __dirname,
          "../../packages/ui/src/components",
        ),
        "@sassy/ui/hooks": path.resolve(
          __dirname,
          "../../packages/ui/src/hooks",
        ),
        "@sassy/ui/styles": path.resolve(
          __dirname,
          "../../packages/ui/src/styles",
        ),
        "@sassy/ui": path.resolve(__dirname, "../../packages/ui/src/ui"),
      },
    },

    css: {
      postcss: {
        plugins: [tailwindcss(), stripCssLayers()],
      },
    },

    define: {
      "process.env.NODE_ENV": JSON.stringify("production"),
      "import.meta.env.VITE_GHOST_URL": JSON.stringify(
        env.VITE_GHOST_URL || "https://engagekit.ghost.io",
      ),
      "import.meta.env.VITE_GHOST_CONTENT_API_KEY": JSON.stringify(
        env.VITE_GHOST_CONTENT_API_KEY || "3a08d7890dfcb6561b8fd70729",
      ),
    },

    build: {
      // Single entry point for all components
      lib: {
        entry: path.resolve(__dirname, "src/components/index.ts"),
        name: "ComponentsBundle", // window.ComponentsBundle (global variable)
        formats: ["iife"], // immediately invoked function for easy embed
        fileName: "components", // outputs /public/components.js
      },
      outDir: "public",
      target: "esnext",
      minify: true,
      emptyOutDir: false,
      cssCodeSplit: false, // Set to false for lib mode to extract CSS
      rollupOptions: {
        output: {
          entryFileNames: "components.js",
          // Extract CSS to separate file
          assetFileNames: (assetInfo) => {
            if (assetInfo.name?.endsWith(".css")) {
              return "components.css";
            }
            return assetInfo.name || "asset";
          },
        },
        plugins: [
          replace({
            "process.env.NODE_ENV": JSON.stringify("production"),
            preventAssignment: true,
            delimiters: ["", ""],
          }),
        ],
      },
    },
  };
});
