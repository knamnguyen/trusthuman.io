import type { TRPCContext } from "../trpc";
import { normalizeLinkedInUrl } from "./normalize-linkedin-url";

export interface RetrieveResult {
  succeeded: string[];
  failed: string[];
}

export const executeRetrieve = async (
  ctx: TRPCContext,
  urls: string[],
): Promise<RetrieveResult> => {
  const normalized = Array.from(
    new Set(urls.map((u) => normalizeLinkedInUrl(u))),
  );
  if (normalized.length === 0) return { succeeded: [], failed: [] };

  const existing = await ctx.db.linkedInProfile.findMany({
    where: { linkedinUrl: { in: normalized } },
    select: { linkedinUrl: true },
  });
  const existingSet = new Set(
    existing.map((e) => normalizeLinkedInUrl(e.linkedinUrl)),
  );
  const succeeded = normalized.filter((u) => existingSet.has(u));
  const failed = normalized.filter((u) => !existingSet.has(u));
  return { succeeded, failed };
};
