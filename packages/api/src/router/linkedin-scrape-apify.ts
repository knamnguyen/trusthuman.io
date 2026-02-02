import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { LinkedInScrapeApifyService } from "@sassy/linkedin-scrape-apify";

import { hasPremiumAccess } from "../services/org-access-control";
import { createTRPCRouter, orgProcedure } from "../trpc";
import { findExistingLinkedInProfile } from "../utils/check-exist-linkedin-profile";

const apifyService = new LinkedInScrapeApifyService({
  token: process.env.APIFY_API_TOKEN ?? "",
  actorId: process.env.APIFY_LINKEDIN_ACTOR_ID ?? "2SyF0bVxmgGr8IVCZ",
});

const mapDbToProfileData = (record: any) => {
  return {
    profilePhotoUrl: record?.profilePic ?? undefined,
    profileUrl: record?.linkedinUrl,
    fullName: record?.fullName ?? undefined,
    headline: record?.headline ?? undefined,
    profileUrn: record?.urn ?? undefined,
  } as const;
};

export const linkedinScrapeApifyRouter = () =>
  createTRPCRouter({
    scrapeByUrl: orgProcedure
      .input(z.object({ url: z.string().url() }))
      .mutation(async ({ ctx, input }) => {
        if (!(await hasPremiumAccess(ctx.db, { orgId: ctx.activeOrg.id }))) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Premium subscription required",
          });
        }
        // 1) Dedup by linkedinUrl
        const existing = await findExistingLinkedInProfile(ctx, input.url);
        if (existing) {
          console.log("linkedin profile already exists in database");
          return mapDbToProfileData(existing);
        }

        console.log("no profile in database, scraping from apify");

        // 2) Run Apify for single URL (full item)
        const apifyItem = await apifyService.runSingleProfileItem({
          profileUrl: input.url,
        });
        if (!apifyItem) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "No data returned from Apify",
          });
        }

        // 3) Persist full fields + required defaults
        const created = await ctx.db.linkedInProfile.create({
          data: {
            linkedinUrl: apifyItem.linkedinUrl ?? input.url,
            fullName: apifyItem.fullName ?? "",
            headline: apifyItem.headline ?? "",
            urn: apifyItem.urn ?? `url:${input.url}`,
            profilePic: apifyItem.profilePic ?? "unknown",
            firstName: apifyItem.firstName ?? undefined,
            lastName: apifyItem.lastName ?? undefined,
            connections: apifyItem.connections ?? undefined,
            followers: apifyItem.followers ?? undefined,
            email: apifyItem.email ?? undefined,
            mobileNumber: apifyItem.mobileNumber ?? undefined,
            jobTitle: apifyItem.jobTitle ?? undefined,
            companyName: apifyItem.companyName ?? undefined,
            companyIndustry: apifyItem.companyIndustry ?? undefined,
            companyWebsite: apifyItem.companyWebsite ?? undefined,
            companyLinkedin: apifyItem.companyLinkedin ?? undefined,
            companyFoundedIn: apifyItem.companyFoundedIn ?? undefined,
            companySize: apifyItem.companySize ?? undefined,
            currentJobDuration: apifyItem.currentJobDuration ?? undefined,
            currentJobDurationInYrs:
              apifyItem.currentJobDurationInYrs ?? undefined,
            topSkillsByEndorsements:
              apifyItem.topSkillsByEndorsements ?? undefined,
            addressCountryOnly: apifyItem.addressCountryOnly ?? undefined,
            addressWithCountry: apifyItem.addressWithCountry ?? undefined,
            addressWithoutCountry: apifyItem.addressWithoutCountry ?? undefined,
            profilePicHighQuality: apifyItem.profilePicHighQuality ?? undefined,
            about: apifyItem.about ?? undefined,
            publicIdentifier: apifyItem.publicIdentifier ?? undefined,
            openConnection: apifyItem.openConnection ?? undefined,
            experiences: apifyItem.experiences ?? undefined,
            updates: apifyItem.updates ?? undefined,
            skills: apifyItem.skills ?? undefined,
            profilePicAllDimensions:
              apifyItem.profilePicAllDimensions ?? undefined,
            educations: apifyItem.educations ?? undefined,
            licenseAndCertificates:
              apifyItem.licenseAndCertificates ?? undefined,
            honorsAndAwards: apifyItem.honorsAndAwards ?? undefined,
            languages: apifyItem.languages ?? undefined,
            volunteerAndAwards: apifyItem.volunteerAndAwards ?? undefined,
            verifications: apifyItem.verifications ?? undefined,
            promos: apifyItem.promos ?? undefined,
            highlights: apifyItem.highlights ?? undefined,
            projects: apifyItem.projects ?? undefined,
            publications: apifyItem.publications ?? undefined,
            patents: apifyItem.patents ?? undefined,
            courses: apifyItem.courses ?? undefined,
            testScores: apifyItem.testScores ?? undefined,
            organizations: apifyItem.organizations ?? undefined,
            volunteerCauses: apifyItem.volunteerCauses ?? undefined,
            interests: apifyItem.interests ?? undefined,
            recommendations: apifyItem.recommendations ?? undefined,
          },
        });

        console.log("profile created in database");

        return mapDbToProfileData(created);
      }),
  });
