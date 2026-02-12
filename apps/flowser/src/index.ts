import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server";
import { connectBrowser } from "./browser";

async function main() {
  // Parse --cdp flag from command line args
  const cdpIndex = process.argv.indexOf("--cdp");
  const cdpUrl = cdpIndex !== -1 ? process.argv[cdpIndex + 1] : undefined;

  if (!cdpUrl) {
    console.error("Usage: bun run src/index.ts --cdp <websocket-url>");
    console.error("");
    console.error("Example:");
    console.error(
      "  bun run src/index.ts --cdp ws://127.0.0.1:9222",
    );
    console.error("");
    console.error("First, start Chrome with debugging enabled:");
    console.error(
      '  /Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome --remote-debugging-port=9222',
    );
    process.exit(1);
  }

  // Connect to browser via CDP
  console.error(`[flowser] Connecting to browser at ${cdpUrl}...`);
  await connectBrowser(cdpUrl);
  console.error("[flowser] Browser connected.");

  // Start MCP server on stdio
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[flowser] MCP server running on stdio.");
}

main().catch((err) => {
  console.error("[flowser] Fatal error:", err);
  process.exit(1);
});
