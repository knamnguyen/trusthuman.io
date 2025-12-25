import { ImportStatus } from "@sassy/db";
import { LinkedInScrapeApifyService } from "@sassy/linkedin-scrape-apify";

import type { TRPCContext } from "../trpc";
import { normalizeLinkedInUrl } from "./normalize-linkedin-url";

export const executeRun = async (ctx: TRPCContext, runId: string) => {
  const run = await ctx.db.profileImportRun.findUnique({
    where: { id: runId },
  });
  if (!run) return;

  await ctx.db.profileImportRun.update({
    where: { id: runId },
    data: { status: ImportStatus.RUNNING },
  });

  const apify = new LinkedInScrapeApifyService({
    token: process.env.APIFY_API_TOKEN ?? "",
    actorId: process.env.APIFY_LINKEDIN_ACTOR_ID ?? "2SyF0bVxmgGr8IVCZ",
  });

  // 1) Batch-resolve which URLs already exist in DB
  const urls = run.urls.map((u) => normalizeLinkedInUrl(u));
  if (urls.length === 0) {
    await ctx.db.profileImportRun.update({
      where: { id: runId },
      data: { status: ImportStatus.FINISHED },
    });
    return;
  }

  const existing = await ctx.db.linkedInProfile.findMany({
    where: { linkedinUrl: { in: urls } },
    select: { linkedinUrl: true },
  });
  const existingSet = new Set(
    existing.map((e) => normalizeLinkedInUrl(e.linkedinUrl)),
  );
  const existingUrls = urls.filter((u) => existingSet.has(u));
  const toScrapeUrls = urls.filter((u) => !existingSet.has(u));

  if (existingUrls.length > 0) {
    await ctx.db.profileImportRun.update({
      where: { id: runId },
      data: { urlsSucceeded: { push: existingUrls } },
    });
  }

  // 2) If nothing left to scrape, finish immediately
  if (toScrapeUrls.length === 0) {
    await ctx.db.profileImportRun.update({
      where: { id: runId },
      data: { status: ImportStatus.FINISHED },
    });
    return;
  }

  // 3) Scrape remaining URLs at once (bulk) and persist
  // Check cancellation once more before starting bulk call
  {
    const latest = await ctx.db.profileImportRun.findUnique({
      where: { id: runId },
      select: { status: true },
    });
    if (!latest || latest.status !== ImportStatus.RUNNING) {
      await ctx.db.profileImportRun.update({
        where: { id: runId },
        data: { status: ImportStatus.FINISHED },
      });
      return;
    }
  }

  const bulk = (await apify.runManyProfileItems({
    profileUrls: toScrapeUrls,
  })) as Record<string, unknown>[];

  const successSet = new Set<string>();
  for (const raw of bulk) {
    try {
      const linkedinUrlRaw = (raw.linkedinUrl as string | undefined) ?? "";
      const normalizedUrl = normalizeLinkedInUrl(linkedinUrlRaw);
      const urn = (raw.urn as string | undefined) ?? undefined;

      const data = {
        linkedinUrl: normalizedUrl,
        fullName: (raw.fullName as string | undefined) ?? "",
        headline: (raw.headline as string | undefined) ?? "",
        urn: urn ?? `url:${normalizedUrl}`,
        profilePic: (raw.profilePic as string | undefined) ?? "unknown",
        firstName: (raw.firstName as string | undefined) ?? undefined,
        lastName: (raw.lastName as string | undefined) ?? undefined,
        connections: (raw.connections as number | undefined) ?? undefined,
        followers: (raw.followers as number | undefined) ?? undefined,
        email: (raw.email as string | undefined) ?? undefined,
        mobileNumber: (raw.mobileNumber as string | undefined) ?? undefined,
        jobTitle: (raw.jobTitle as string | undefined) ?? undefined,
        companyName: (raw.companyName as string | undefined) ?? undefined,
        companyIndustry:
          (raw.companyIndustry as string | undefined) ?? undefined,
        companyWebsite: (raw.companyWebsite as string | undefined) ?? undefined,
        companyLinkedin:
          (raw.companyLinkedin as string | undefined) ?? undefined,
        companyFoundedIn:
          (raw.companyFoundedIn as number | undefined) ?? undefined,
        companySize: (raw.companySize as string | undefined) ?? undefined,
        currentJobDuration:
          (raw.currentJobDuration as string | undefined) ?? undefined,
        currentJobDurationInYrs:
          (raw.currentJobDurationInYrs as number | undefined) ?? undefined,
        topSkillsByEndorsements:
          (raw.topSkillsByEndorsements as string | undefined) ?? undefined,
        addressCountryOnly:
          (raw.addressCountryOnly as string | undefined) ?? undefined,
        addressWithCountry:
          (raw.addressWithCountry as string | undefined) ?? undefined,
        addressWithoutCountry:
          (raw.addressWithoutCountry as string | undefined) ?? undefined,
        profilePicHighQuality:
          (raw.profilePicHighQuality as string | undefined) ?? undefined,
        about: (raw.about as string | undefined) ?? undefined,
        publicIdentifier:
          (raw.publicIdentifier as string | undefined) ?? undefined,
        openConnection:
          (raw.openConnection as boolean | undefined) ?? undefined,
        experiences: raw.experiences ?? undefined,
        updates: raw.updates ?? undefined,
        skills: raw.skills ?? undefined,
        profilePicAllDimensions: raw.profilePicAllDimensions ?? undefined,
        educations: raw.educations ?? undefined,
        licenseAndCertificates: raw.licenseAndCertificates ?? undefined,
        honorsAndAwards: raw.honorsAndAwards ?? undefined,
        languages: raw.languages ?? undefined,
        volunteerAndAwards: raw.volunteerAndAwards ?? undefined,
        verifications: raw.verifications ?? undefined,
        promos: raw.promos ?? undefined,
        highlights: raw.highlights ?? undefined,
        projects: raw.projects ?? undefined,
        publications: raw.publications ?? undefined,
        patents: raw.patents ?? undefined,
        courses: raw.courses ?? undefined,
        testScores: raw.testScores ?? undefined,
        organizations: raw.organizations ?? undefined,
        volunteerCauses: raw.volunteerCauses ?? undefined,
        interests: raw.interests ?? undefined,
        recommendations: raw.recommendations ?? undefined,
      };

      try {
        await ctx.db.linkedInProfile.create({ data });
      } catch (e: unknown) {
        // On unique constraint (urn), try update
        const err = e as { code?: string; meta?: unknown };
        if ((err as any)?.code === "P2002" && urn) {
          await ctx.db.linkedInProfile.update({ where: { urn }, data });
        } else {
          throw e;
        }
      }

      successSet.add(normalizedUrl);
    } catch {
      // ignore per-record error; will be marked failed below
    }
  }

  if (successSet.size > 0) {
    await ctx.db.profileImportRun.update({
      where: { id: runId },
      data: { urlsSucceeded: { push: Array.from(successSet) } },
    });
  }

  const failedUrls = toScrapeUrls.filter((u) => !successSet.has(u));
  if (failedUrls.length > 0) {
    await ctx.db.profileImportRun.update({
      where: { id: runId },
      data: { urlsFailed: { push: failedUrls } },
    });
  }

  await ctx.db.profileImportRun.update({
    where: { id: runId },
    data: { status: ImportStatus.FINISHED },
  });
  // console.log("run finished");
};
