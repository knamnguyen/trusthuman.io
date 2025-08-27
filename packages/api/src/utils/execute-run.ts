import { ImportStatus, Prisma } from "@sassy/db";
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

  // 3) Scrape remaining URLs
  for (const url of toScrapeUrls) {
    try {
      console.log("starting to get data from apify");
      console.log("url is: " + url);
      const item = await apify.runSingleProfileItem({ profileUrl: url });
      if (!item) throw new Error("No data from Apify");
      // DB write
      await ctx.db.linkedInProfile.create({
        data: {
          linkedinUrl: normalizeLinkedInUrl(item.linkedinUrl ?? url),
          fullName: item.fullName ?? "",
          headline: item.headline ?? "",
          urn: item.urn ?? `url:${url}`,
          profilePic: item.profilePic ?? "unknown",
          firstName: item.firstName ?? undefined,
          lastName: item.lastName ?? undefined,
          connections: item.connections ?? undefined,
          followers: item.followers ?? undefined,
          email: item.email ?? undefined,
          mobileNumber: item.mobileNumber ?? undefined,
          jobTitle: item.jobTitle ?? undefined,
          companyName: item.companyName ?? undefined,
          companyIndustry: item.companyIndustry ?? undefined,
          companyWebsite: item.companyWebsite ?? undefined,
          companyLinkedin: item.companyLinkedin ?? undefined,
          companyFoundedIn: item.companyFoundedIn ?? undefined,
          companySize: item.companySize ?? undefined,
          currentJobDuration: item.currentJobDuration ?? undefined,
          currentJobDurationInYrs: item.currentJobDurationInYrs ?? undefined,
          topSkillsByEndorsements: item.topSkillsByEndorsements ?? undefined,
          addressCountryOnly: item.addressCountryOnly ?? undefined,
          addressWithCountry: item.addressWithCountry ?? undefined,
          addressWithoutCountry: item.addressWithoutCountry ?? undefined,
          profilePicHighQuality: item.profilePicHighQuality ?? undefined,
          about: item.about ?? undefined,
          publicIdentifier: item.publicIdentifier ?? undefined,
          openConnection: item.openConnection ?? undefined,
          experiences: item.experiences ?? undefined,
          updates: item.updates ?? undefined,
          skills: item.skills ?? undefined,
          profilePicAllDimensions: item.profilePicAllDimensions ?? undefined,
          educations: item.educations ?? undefined,
          licenseAndCertificates: item.licenseAndCertificates ?? undefined,
          honorsAndAwards: item.honorsAndAwards ?? undefined,
          languages: item.languages ?? undefined,
          volunteerAndAwards: item.volunteerAndAwards ?? undefined,
          verifications: item.verifications ?? undefined,
          promos: item.promos ?? undefined,
          highlights: item.highlights ?? undefined,
          projects: item.projects ?? undefined,
          publications: item.publications ?? undefined,
          patents: item.patents ?? undefined,
          courses: item.courses ?? undefined,
          testScores: item.testScores ?? undefined,
          organizations: item.organizations ?? undefined,
          volunteerCauses: item.volunteerCauses ?? undefined,
          interests: item.interests ?? undefined,
          recommendations: item.recommendations ?? undefined,
        },
      });

      console.log("data saved to db");
      await ctx.db.profileImportRun.update({
        where: { id: runId },
        data: { urlsSucceeded: { push: url } },
      });
      console.log("urlsSucceeded updated");
    } catch (error: unknown) {
      console.log("some error happened");

      await ctx.db.profileImportRun.update({
        where: { id: runId },
        data: { urlsFailed: { push: url } },
      });
      console.log("urlsFailed updated");
    }
  }

  await ctx.db.profileImportRun.update({
    where: { id: runId },
    data: { status: ImportStatus.FINISHED },
  });
  console.log("run finished");
};
