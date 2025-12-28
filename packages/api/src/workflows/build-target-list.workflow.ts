import { DBOS } from "@dbos-inc/dbos-sdk";

import type { LinkedinProfileSearchInput } from "@sassy/apify-runners/linkedin-profile-explorer";
import { LinkedInProfileExplorer } from "@sassy/apify-runners/linkedin-profile-explorer";
import { db } from "@sassy/db";

const apifyApiToken = process.env.APIFY_API_TOKEN;

if (apifyApiToken === undefined) {
  throw new Error("APIFY_API_TOKEN is not defined");
}

export const buildTargetListWorkflow = DBOS.registerWorkflow(
  async (input: {
    targetListId: string;
    targetListName: string;
    buildTargetListJobId: string;
  }) => {
    const job = await db.buildTargetListJob.findFirst({
      where: { id: input.buildTargetListJobId },
    });

    if (job === null) {
      return {
        status: "noop",
        reason: "job not found",
      } as const;
    }

    const account = await DBOS.runStep(
      async () => {
        const account = await db.linkedInAccount.findFirst({
          where: { id: job.accountId },
        });

        return account;
      },
      {
        name: "validate accountId",
      },
    );

    // TODO: update build targe tlist job status to running etc and completed

    if (account === null) {
      return {
        status: "error",
        reason: "invalid account id",
      } as const;
    }

    const explorer = new LinkedInProfileExplorer(apifyApiToken);

    let startPage = 1;
    let profilesAdded = 0;

    while (true) {
      const exploreResults = await DBOS.runStep(async () => {
        const results = await explorer.searchProfile({
          ...input.params,
          startPage,
        });

        if (results.parsed.success === false) {
          return {
            status: "error",
            reason: "failed to parse results",
          } as const;
        }

        return {
          status: "success",
          data: {
            hasNextPage: results.count < results.limit,
            items: results.parsed.data,
          },
        } as const;
      });

      if (exploreResults.status === "error") {
        return exploreResults;
      }

      await DBOS.runStep(async () => {
        const existingTargetList = await db.targetList.findFirst({
          where: { id: input.targetListId },
        });

        // for idempotency and reduce redundant db writes,
        // if the target list is already completed, we skip processing
        if (
          existingTargetList !== null &&
          existingTargetList.status === "COMPLETED"
        ) {
          return;
        }

        await db.targetList.createMany({
          data: {
            id: input.targetListId,
            accountId: input.accountId,
            name: input.targetListName,
            status: "BUILDING",
          },
          skipDuplicates: true,
        });

        for (const profile of exploreResults.data.items) {
          const company = profile.currentPositions[0];

          // TODO: decide if we want to do a company.current check
          // else just populate with the latest job position

          // TODO: also decide if we want to query back full profile details so we can better populate fields
          // but at a higher apify cost
          await db.linkedInProfile.upsert({
            where: { urn: `url:${profile.linkedinUrl}` },
            create: {
              urn: `url:${profile.linkedinUrl}`,
              linkedinUrl: profile.linkedinUrl,
              fullName: `${profile.firstName} ${profile.lastName}`,
              headline: "",
              firstName: profile.firstName,
              lastName: profile.lastName,
              location: profile.location.linkedinText,
              profilePic: profile.pictureUrl,
              ...(company !== undefined
                ? {
                    jobTitle: company.title,
                    companyName: company.companyName,
                    currentJobDuration: `${company.tenureAtPosition.numYears} years, ${company.tenureAtPosition.numMonths} months`,
                    currentJobDurationInYrs:
                      company.tenureAtCompany.numYears +
                      company.tenureAtCompany.numMonths / 12,
                    companyLinkedin: company.companyLinkedinUrl,
                  }
                : {}),
            },
            update: {
              urn: `url:${profile.linkedinUrl}`,
              linkedinUrl: profile.linkedinUrl,
              fullName: `${profile.firstName} ${profile.lastName}`,
              headline: "",
              firstName: profile.firstName,
              lastName: profile.lastName,
              location: profile.location.linkedinText,
              profilePic: profile.pictureUrl,
              ...(company !== undefined
                ? {
                    jobTitle: company.title,
                    companyName: company.companyName,
                    currentJobDuration: `${company.tenureAtPosition.numYears} years, ${company.tenureAtPosition.numMonths} months`,
                    currentJobDurationInYrs:
                      company.tenureAtCompany.numYears +
                      company.tenureAtCompany.numMonths / 12,
                    companyLinkedin: company.companyLinkedinUrl,
                  }
                : {}),
            },
          });
        }

        const result = await db.targetProfile.createMany({
          data: await Promise.all(
            exploreResults.data.items.map(async (profile) => ({
              id: await DBOS.randomUUID(),
              listId: input.targetListId,
              profileUrn: `url:${profile.linkedinUrl}`,
              linkedinUrl: profile.linkedinUrl,
              accountId: input.accountId,
            })),
          ),
          skipDuplicates: true,
        });

        profilesAdded += result.count;

        await db.targetList.update({
          where: { id: input.targetListId },
          data: {
            status: "COMPLETED",
          },
        });
      });

      if (exploreResults.data.hasNextPage === false || profilesAdded >= 100) {
        return {
          status: "completed",
        } as const;
      }

      startPage += 1;
    }
  },
  {
    name: "buildTargetListWorkflow",
  },
);
