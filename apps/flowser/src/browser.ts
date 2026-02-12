import puppeteer, { type Page } from "puppeteer-core";
import path from "path";

let page: Page | null = null;
let bundleCache: string | null = null;

/**
 * Connect to an existing Chrome instance via CDP and inject linkedin-automation scripts.
 * The browser must already be running with --remote-debugging-port.
 */
export async function connectBrowser(cdpUrl: string): Promise<Page> {
  // Normalize to http:// for puppeteer's browserURL
  const httpUrl = cdpUrl
    .replace(/^ws:\/\//, "http://")
    .replace(/^wss:\/\//, "https://");

  const browser = await puppeteer.connect({ browserURL: httpUrl });

  const pages = await browser.pages();
  const linkedInPage = pages.find((p) => p.url().includes("linkedin.com"));
  page = linkedInPage ?? pages[0] ?? null;
  if (!page) throw new Error("No pages found in browser");

  // Bundle and inject linkedin-automation scripts
  const bundle = await getBundledUtilities();

  // Inject into current page immediately
  await page.evaluate((code) => {
    eval(code);
  }, bundle);

  // Re-inject on every future navigation (full page loads)
  await page.evaluateOnNewDocument((code: string) => {
    eval(code);
  }, bundle);

  console.error("[flowser] Connected to browser, scripts injected");
  return page;
}

/**
 * Bundle the utilities.ts file (which imports @sassy/linkedin-automation)
 * into a single JS string that can be injected into the browser.
 */
async function getBundledUtilities(): Promise<string> {
  if (bundleCache) return bundleCache;

  const result = await Bun.build({
    entrypoints: [path.join(import.meta.dir, "utilities.ts")],
    minify: true,
    target: "browser",
  });

  if (!result.success) {
    throw new Error(
      `Failed to bundle utilities: ${result.logs.map((l) => l.message).join("\n")}`,
    );
  }

  const file = result.outputs[0];
  if (!file) throw new Error("No output file from bundle");

  bundleCache = await file.text();
  return bundleCache;
}

/**
 * Get the connected page. Throws if not connected.
 */
export function getPage(): Page {
  if (!page)
    throw new Error("Browser not connected. Call connectBrowser() first.");
  return page;
}
