import path from "path";
import replace from "@rollup/plugin-replace";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/postcss";
import { defineConfig } from "vite";

console.log("🔍 Building unified components bundle...");

// ---------------------------------------------------------
// ✅ Unified Components Build Configuration
// ---------------------------------------------------------
// Single entry point: src/components/index.ts
// Outputs: public/components.js and public/components.css
// ---------------------------------------------------------
export default defineConfig(() => {
  return {
    plugins: [react()],

    // 🔑 Add this block so imports like "@/lib/utils" and "@sassy/ui" work
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "~": path.resolve(__dirname, "./src"),
        // Match package.json exports: "./*" -> "./src/ui/*.tsx"
        "@sassy/ui/utils": path.resolve(__dirname, "../../packages/ui/src/utils.ts"),
        "@sassy/ui/components": path.resolve(__dirname, "../../packages/ui/src/components"),
        "@sassy/ui/hooks": path.resolve(__dirname, "../../packages/ui/src/hooks"),
        "@sassy/ui/styles": path.resolve(__dirname, "../../packages/ui/src/styles"),
        "@sassy/ui": path.resolve(__dirname, "../../packages/ui/src/ui"),
      },
    },

    css: {
      postcss: {
        plugins: [tailwindcss()],
      },
    },

    define: {
      "process.env.NODE_ENV": JSON.stringify("production"),
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
