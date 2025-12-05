import fs from "fs";
import path from "path";
import replace from "@rollup/plugin-replace";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/postcss";
import { defineConfig } from "vite";

console.log("🔍 Building tools bundles...");

// ---------------------------------------------------------
// ✅ Tools Build Configuration
// ---------------------------------------------------------
// Scans src/tools/ directory and builds each tool separately
// Outputs to public/tools/{tool-name}.js and public/tools/{tool-name}.css
//
// Each tool folder should have an index.tsx file that exports:
// - mount function (optional, for auto-mounting)
// - Component (for direct use)
// ---------------------------------------------------------

// Discover all tools in src/tools/
function discoverTools() {
  const toolsDir = path.resolve(__dirname, "src/tools");
  if (!fs.existsSync(toolsDir)) {
    return {};
  }

  const tools = {};
  const entries = fs.readdirSync(toolsDir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const toolName = entry.name;
      const toolIndexPath = path.join(toolsDir, toolName, "index.tsx");

      if (fs.existsSync(toolIndexPath)) {
        tools[toolName] = toolIndexPath;
        console.log(`  ✓ Found tool: ${toolName}`);
      } else {
        console.warn(`  ⚠ Tool ${toolName} missing index.tsx, skipping`);
      }
    }
  }

  return tools;
}

export default defineConfig(() => {
  // Discover tools
  const tools = discoverTools();

  if (Object.keys(tools).length === 0) {
    console.warn("⚠ No tools found in src/tools/");
    return {
      build: {
        rollupOptions: {
          input: {},
        },
      },
    };
  }

  // Build entry points for each tool
  const input = {};
  for (const [toolName, toolPath] of Object.entries(tools)) {
    input[toolName] = toolPath;
  }

  return {
    plugins: [
      react(),
      // Custom plugin to rename CSS files per entry
      {
        name: "rename-css-per-entry",
        generateBundle(options, bundle) {
          // Find entry chunks and their associated CSS
          const entryChunks = new Map();

          // Map entry names to their chunks
          for (const [fileName, chunk] of Object.entries(bundle)) {
            if (chunk.type === "chunk" && chunk.isEntry) {
              entryChunks.set(chunk.name, chunk);
            }
          }

          // Find and rename CSS files
          for (const [fileName, asset] of Object.entries(bundle)) {
            if (asset.type === "asset" && fileName.endsWith(".css")) {
              // Skip files that are already correctly named
              const isCorrectlyNamed = Object.keys(input).some(
                (key) => fileName === `${key}.css`,
              );
              if (isCorrectlyNamed) continue;

              // For CSS files, match to entry
              // With cssCodeSplit: false, we typically get one CSS file
              // Match it to the first entry (or the only entry if single)
              const entryNames = Object.keys(input);
              let matchedEntry = null;

              // Check if CSS filename contains any entry name
              for (const entryName of entryNames) {
                if (fileName.includes(entryName)) {
                  matchedEntry = entryName;
                  break;
                }
              }

              // If no match found, use first entry as fallback
              if (!matchedEntry && entryNames.length > 0) {
                matchedEntry = entryNames[0];
              }

              // Rename CSS file to match entry name
              if (matchedEntry && fileName !== `${matchedEntry}.css`) {
                const newFileName = `${matchedEntry}.css`;
                bundle[newFileName] = asset;
                delete bundle[fileName];
                console.log(`  ✓ Renamed CSS: ${fileName} → ${newFileName}`);
              }
            }
          }
        },
      },
    ],

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

    publicDir: false, // Don't copy public directory files into output

    build: {
      outDir: "public/tools",
      target: "esnext",
      minify: true,
      emptyOutDir: true, // Clear tools directory on build
      cssCodeSplit: false, // Extract CSS to single file per entry (not split across chunks)
      rollupOptions: {
        input,
        output: {
          // Each tool gets its own JS file: {tool-name}.js
          entryFileNames: (chunkInfo) => {
            return `${chunkInfo.name}.js`;
          },
          // Each tool gets its own CSS file: {tool-name}.css
          assetFileNames: (assetInfo) => {
            if (assetInfo.name?.endsWith(".css")) {
              const entryNames = Object.keys(input);

              // With cssCodeSplit: false, we get one CSS file per build
              // If there's only one entry, always name CSS after it
              if (entryNames.length === 1) {
                return `${entryNames[0]}.css`;
              }

              // Multiple entries - try to match CSS to entry
              const entryName = entryNames.find((key) => {
                return (
                  assetInfo.name?.includes(key) ||
                  assetInfo.names?.some((name) => name === key)
                );
              });

              return entryName
                ? `${entryName}.css`
                : assetInfo.name || "tool.css";
            }
            return assetInfo.name || "asset";
          },
          format: "iife", // Immediately invoked function for easy embed
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
