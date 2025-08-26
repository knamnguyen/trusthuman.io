/*
  Quick test script for linkedinScrapeApify.scrapeByUrl
  Usage:
    pnpm with-env bun ./scripts/test-linkedin-scrape-apify.ts --url="https://www.linkedin.com/in/..."
*/

import { createServerClient } from "@sassy/api";

const parseArg = (name: string): string | undefined => {
  const pref = `--${name}=`;
  const arg = process.argv.find((a) => a.startsWith(pref));
  return arg ? arg.slice(pref.length) : undefined;
};

async function main() {
  const url = parseArg("url");
  if (!url) {
    console.error("Missing --url argument");
    process.exit(1);
  }
  const trpc = await createServerClient();
  const result = await trpc.linkedinScrapeApify.scrapeByUrl({ url });
  console.log("ProfileData:", result);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
