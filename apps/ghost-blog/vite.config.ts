import path from "path";
import tailwindcss from "@tailwindcss/postcss";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

// ---------------------------------------------------------
// Main Vite Dev Server Configuration
// ---------------------------------------------------------
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  // Calculate port based on PORT env var (PORT + 1)
  // Main repo: PORT=3000 → Ghost Blog=3001
  // Worktree with PORT=3010 → Ghost Blog=3011
  const basePort = parseInt(env.PORT || process.env.PORT || "3000");
  const ghostBlogPort = basePort + 1;

  return {
    plugins: [react()],

    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "~": path.resolve(__dirname, "./src"),
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
        plugins: [tailwindcss()],
      },
    },

    define: {
      "import.meta.env.VITE_GHOST_URL": JSON.stringify(
        env.VITE_GHOST_URL || "https://engagekit.ghost.io",
      ),
      "import.meta.env.VITE_GHOST_CONTENT_API_KEY": JSON.stringify(
        env.VITE_GHOST_CONTENT_API_KEY || "3a08d7890dfcb6561b8fd70729",
      ),
    },

    server: {
      port: ghostBlogPort,
      open: true,
    },

    build: {
      outDir: "dist",
    },
  };
});
