/*
  Import LinkedIn profile JSON data exported from Apify into the DB.
  Usage:
    pnpm -C packages/api with-env bun ./scripts/import-linkedin-profiles.ts --file="./client-data/file.json" --chunk=50
*/

import { readFile } from "fs/promises";

import { db } from "@sassy/db";

import { normalizeLinkedInUrl } from "../src/utils/normalize-linkedin-url";

type AnyRecord = Record<string, unknown>;

const parseArg = (name: string): string | undefined => {
  const eqPrefix = `--${name}=`;
  // 1) Support --name=value
  const withEq = process.argv.find((a) => a.startsWith(eqPrefix));
  if (withEq) return withEq.slice(eqPrefix.length);
  // 2) Support --name value
  for (let i = 0; i < process.argv.length; i++) {
    if (process.argv[i] === `--${name}`) {
      const v = process.argv[i + 1];
      if (v && !v.startsWith("--")) return v;
    }
  }
  return undefined;
};

const toInt = (val: string | undefined, fallback: number): number => {
  if (!val) return fallback;
  const n = Number.parseInt(val, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

const chunkArray = <T>(arr: T[], size: number): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

async function upsertProfile(item: AnyRecord): Promise<void> {
  const linkedinUrlRaw = String(item["linkedinUrl"] ?? "");
  const normalizedUrl = normalizeLinkedInUrl(linkedinUrlRaw);
  const urn = (item["urn"] as string | undefined) ?? undefined;

  const data = {
    linkedinUrl: normalizedUrl,
    fullName: (item["fullName"] as string | undefined) ?? "",
    headline: (item["headline"] as string | undefined) ?? "",
    urn: urn ?? `url:${normalizedUrl}`,
    profilePic: (item["profilePic"] as string | undefined) ?? "unknown",
    firstName: (item["firstName"] as string | undefined) ?? undefined,
    lastName: (item["lastName"] as string | undefined) ?? undefined,
    connections: (item["connections"] as number | undefined) ?? undefined,
    followers: (item["followers"] as number | undefined) ?? undefined,
    email: (item["email"] as string | undefined) ?? undefined,
    mobileNumber: (item["mobileNumber"] as string | undefined) ?? undefined,
    jobTitle: (item["jobTitle"] as string | undefined) ?? undefined,
    companyName: (item["companyName"] as string | undefined) ?? undefined,
    companyIndustry:
      (item["companyIndustry"] as string | undefined) ?? undefined,
    companyWebsite: (item["companyWebsite"] as string | undefined) ?? undefined,
    companyLinkedin:
      (item["companyLinkedin"] as string | undefined) ?? undefined,
    companyFoundedIn:
      (item["companyFoundedIn"] as number | undefined) ?? undefined,
    companySize: (item["companySize"] as string | undefined) ?? undefined,
    currentJobDuration:
      (item["currentJobDuration"] as string | undefined) ?? undefined,
    currentJobDurationInYrs:
      (item["currentJobDurationInYrs"] as number | undefined) ?? undefined,
    topSkillsByEndorsements:
      (item["topSkillsByEndorsements"] as string | undefined) ?? undefined,
    addressCountryOnly:
      (item["addressCountryOnly"] as string | undefined) ?? undefined,
    addressWithCountry:
      (item["addressWithCountry"] as string | undefined) ?? undefined,
    addressWithoutCountry:
      (item["addressWithoutCountry"] as string | undefined) ?? undefined,
    profilePicHighQuality:
      (item["profilePicHighQuality"] as string | undefined) ?? undefined,
    about: (item["about"] as string | undefined) ?? undefined,
    publicIdentifier:
      (item["publicIdentifier"] as string | undefined) ?? undefined,
    openConnection:
      (item["openConnection"] as boolean | undefined) ?? undefined,
    experiences: (item["experiences"] as unknown) ?? undefined,
    updates: (item["updates"] as unknown) ?? undefined,
    skills: (item["skills"] as unknown) ?? undefined,
    profilePicAllDimensions:
      (item["profilePicAllDimensions"] as unknown) ?? undefined,
    educations: (item["educations"] as unknown) ?? undefined,
    licenseAndCertificates:
      (item["licenseAndCertificates"] as unknown) ?? undefined,
    honorsAndAwards: (item["honorsAndAwards"] as unknown) ?? undefined,
    languages: (item["languages"] as unknown) ?? undefined,
    volunteerAndAwards: (item["volunteerAndAwards"] as unknown) ?? undefined,
    verifications: (item["verifications"] as unknown) ?? undefined,
    promos: (item["promos"] as unknown) ?? undefined,
    highlights: (item["highlights"] as unknown) ?? undefined,
    projects: (item["projects"] as unknown) ?? undefined,
    publications: (item["publications"] as unknown) ?? undefined,
    patents: (item["patents"] as unknown) ?? undefined,
    courses: (item["courses"] as unknown) ?? undefined,
    testScores: (item["testScores"] as unknown) ?? undefined,
    organizations: (item["organizations"] as unknown) ?? undefined,
    volunteerCauses: (item["volunteerCauses"] as unknown) ?? undefined,
    interests: (item["interests"] as unknown) ?? undefined,
    recommendations: (item["recommendations"] as unknown) ?? undefined,
  };

  if (urn) {
    await db.linkedInProfile.upsert({
      where: { urn },
      update: data,
      create: data,
    });
  } else {
    // fallback by URL if urn missing
    const exists = await db.linkedInProfile.findFirst({
      where: { linkedinUrl: normalizedUrl },
      select: { id: true },
    });
    if (!exists) await db.linkedInProfile.create({ data });
  }
}

async function main() {
  const file = parseArg("file");
  if (!file) {
    console.error("Missing --file argument pointing to a JSON array file");
    process.exit(1);
  }
  const chunkSize = toInt(parseArg("chunk"), 50);
  const raw = await readFile(file, "utf8");
  let items: AnyRecord[] = [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed))
      throw new Error("File must contain a JSON array");
    items = parsed as AnyRecord[];
  } catch (e) {
    console.error("Failed to parse JSON:", e);
    process.exit(1);
  }

  console.log(
    `Importing ${items.length} profiles from ${file} in chunks of ${chunkSize}...`,
  );
  const chunks = chunkArray(items, chunkSize);
  let succeeded = 0;
  let failed = 0;
  for (const chunk of chunks) {
    await Promise.all(
      chunk.map(async (item) => {
        try {
          await upsertProfile(item);
          succeeded++;
        } catch (err) {
          failed++;
          console.error("Import error for record", {
            urn: item?.urn,
            linkedinUrl: item?.linkedinUrl,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }),
    );
  }
  console.log(`Done. Succeeded: ${succeeded}, Failed: ${failed}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
