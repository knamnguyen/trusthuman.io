import type { TRPCContext } from "../trpc";
import { normalizeLinkedInUrl } from "./normalize-linkedin-url";

interface CheckResult {
  /** URLs that already exist in the database */
  existingUrls: string[];
  /** URLs that need to be scraped */
  toScrapeUrls: string[];
  /** Set of existing normalized URLs for quick lookup */
  existingSet: Set<string>;
}

/**
 * Check if LinkedIn profile URLs already exist in the database.
 * Works for both single URL and multiple URLs.
 *
 * @param ctx - tRPC context with database access
 * @param urls - Single URL string or array of URL strings
 * @returns CheckResult with existing/toScrape URL arrays and a Set for lookup
 */
export async function checkExistLinkedInProfile(
  ctx: TRPCContext,
  urls: string | string[],
): Promise<CheckResult> {
  const urlArray = Array.isArray(urls) ? urls : [urls];
  const normalizedUrls = urlArray.map((u) => normalizeLinkedInUrl(u));

  if (normalizedUrls.length === 0) {
    return {
      existingUrls: [],
      toScrapeUrls: [],
      existingSet: new Set(),
    };
  }

  const existing = await ctx.db.linkedInProfile.findMany({
    where: { linkedinUrl: { in: normalizedUrls } },
    select: { linkedinUrl: true },
  });

  const existingSet = new Set(
    existing.map((e) => normalizeLinkedInUrl(e.linkedinUrl)),
  );

  const existingUrls = normalizedUrls.filter((u) => existingSet.has(u));
  const toScrapeUrls = normalizedUrls.filter((u) => !existingSet.has(u));

  return {
    existingUrls,
    toScrapeUrls,
    existingSet,
  };
}

/**
 * Check if a single LinkedIn profile URL exists and return the full profile if found.
 *
 * @param ctx - tRPC context with database access
 * @param url - Single URL string
 * @returns The LinkedIn profile record if found, null otherwise
 */
export async function findExistingLinkedInProfile(
  ctx: TRPCContext,
  url: string,
) {
  const normalizedUrl = normalizeLinkedInUrl(url);

  return ctx.db.linkedInProfile.findFirst({
    where: { linkedinUrl: normalizedUrl },
  });
}
