import type { ProfileData } from "../utils/storage";
import type { ParsedCsvRow } from "./csv-parser";
import {
  ensureListExists,
  loadListsWithErrorHandling,
  loadProfileDataWithErrorHandling,
  saveListsToStorage,
  saveProfileDataToStorage,
} from "../utils/storage";

export type ImportSummary = {
  parsed: number;
  valid: number;
  created: number;
  updated: number;
  skipped: number;
  errors: { row: number; reason: string }[];
};

export const normalizeListName = (
  inputName: string | undefined,
  fileName: string,
): string => {
  const fromInput = inputName?.trim();
  if (fromInput) return fromInput;
  const base = fileName.split("/").pop() || fileName;
  return base.replace(/\.[^.]+$/, "").trim() || "Imported";
};

export async function upsertFromCsv({
  rows,
  listName,
  splitInto,
}: {
  rows: ParsedCsvRow[];
  listName: string;
  splitInto?: number; // if provided, evenly split rows across N lists suffixed 1..N
}): Promise<ImportSummary> {
  const summary: ImportSummary = {
    parsed: rows.length,
    valid: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  };

  // Load existing
  const [{ lists }, { profiles }] = await Promise.all([
    loadListsWithErrorHandling(),
    loadProfileDataWithErrorHandling(),
  ]);

  // Determine target list names
  const total = rows.length;
  const n = splitInto && splitInto > 1 ? Math.min(splitInto, total) : 1;
  const targetLists: string[] = [];
  for (let i = 0; i < n; i++) {
    targetLists.push(n === 1 ? listName : `${listName} ${i + 1}`);
  }
  // Ensure lists exist
  for (const ln of targetLists) {
    // eslint-disable-next-line no-await-in-loop
    await ensureListExists(ln);
  }
  const nextLists = Array.from(
    new Set([...(lists || []), ...targetLists]),
  ) as string[];

  // Build urn → key and url → key maps for fast dedupe
  const urlToKey: Record<string, string> = {};
  const urnToKey: Record<string, string> = {};
  Object.keys(profiles).forEach((key) => {
    const p = profiles[key];
    if (!p) return;
    if (key) urlToKey[key] = key;
    if (p.profileUrn) urnToKey[p.profileUrn] = key;
  });

  const nextProfiles: Record<string, ProfileData> = { ...profiles };

  rows.forEach((row, idx) => {
    const rowNum = idx + 2; // account for header line
    // Pick list by round-robin if splitting
    const targetList = targetLists[idx % targetLists.length] as string;
    const linkedinUrl = row.linkedinUrl?.trim();
    const urn = row.urn?.trim();

    if (!linkedinUrl && !urn) {
      summary.skipped++;
      summary.errors.push({
        row: rowNum,
        reason: "Missing both linkedinUrl and urn",
      });
      return;
    }

    // Pick existing key by either url or urn
    let key: string | undefined = undefined;
    if (linkedinUrl && urlToKey[linkedinUrl]) key = urlToKey[linkedinUrl];
    if (!key && urn && urnToKey[urn]) key = urnToKey[urn];

    const makeProfileFromRow = (): ProfileData => ({
      profilePhotoUrl: row.profilePic || undefined,
      profileUrl: linkedinUrl || key || "",
      fullName: row.fullName || undefined,
      headline: row.headline || undefined,
      profileUrn: urn || undefined,
      lists: [targetList],
    });

    if (!key) {
      // Create new with url as key if available, otherwise skip (cannot create without a resolvable key)
      if (!linkedinUrl) {
        summary.skipped++;
        summary.errors.push({
          row: rowNum,
          reason: "Cannot create profile without linkedinUrl",
        });
        return;
      }
      const newProfile = makeProfileFromRow();
      nextProfiles[linkedinUrl] = newProfile;
      urlToKey[linkedinUrl] = linkedinUrl;
      if (urn) urnToKey[urn] = linkedinUrl;
      summary.valid++;
      summary.created++;
      return;
    }

    // Update existing
    const existing = nextProfiles[key];
    if (!existing) {
      // Shouldn't happen, but guard
      const newProfile = makeProfileFromRow();
      const newKey = linkedinUrl || key;
      nextProfiles[newKey] = newProfile;
      if (linkedinUrl) urlToKey[linkedinUrl] = newKey;
      if (urn) urnToKey[urn] = newKey;
      summary.valid++;
      summary.created++;
      return;
    }

    const updated: ProfileData = {
      ...existing,
      profilePhotoUrl: row.profilePic?.trim() || existing.profilePhotoUrl,
      fullName: row.fullName?.trim() || existing.fullName,
      headline: row.headline?.trim() || existing.headline,
      profileUrn: urn || existing.profileUrn,
      lists: Array.from(
        new Set([...(existing.lists || []), targetList]),
      ) as string[],
    };

    nextProfiles[key] = updated;
    summary.valid++;
    summary.updated++;
  });

  // Batch save
  await Promise.all([
    saveListsToStorage(nextLists),
    saveProfileDataToStorage(nextProfiles),
  ]);

  return summary;
}
