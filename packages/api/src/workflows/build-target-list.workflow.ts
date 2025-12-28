import { DBOS } from "@dbos-inc/dbos-sdk";

import type { LinkedinProfileSearchInput } from "@sassy/apify-runners/linkedin-profile-explorer";
import { LinkedInProfileExplorer } from "@sassy/apify-runners/linkedin-profile-explorer";
import { db } from "@sassy/db";

import { safe } from "../utils/commons";

const apifyApiToken = process.env.APIFY_API_TOKEN;

if (apifyApiToken === undefined) {
  throw new Error("APIFY_API_TOKEN is not defined");
}

export const buildTargetListWorkflow = DBOS.registerWorkflow(
  async (input: {
    targetListId: string;
    targetListName: string;
    buildTargetListJobId: string;
    accountId: string;
    params: LinkedinProfileSearchInput;
  }) => {
    const account = await DBOS.runStep(
      async () => {
        const account = await db.linkedInAccount.findFirst({
          where: { id: input.accountId },
        });

        return account;
      },
      {
        name: "validate accountId",
      },
    );

    if (account === null) {
      return {
        status: "error",
        reason: "invalid account id",
      } as const;
    }

    await db.buildTargetListJob.update({
      where: { id: input.buildTargetListJobId },
      data: {
        status: "RUNNING",
        startedAt: new Date().toISOString(),
      },
    });

    const explorer = new LinkedInProfileExplorer(apifyApiToken);

    let startPage = 1;
    let profilesAdded = 0;

    const result = await safe(async () => {
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
            return {
              status: "completed",
            } as const;
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
        });

        if (exploreResults.data.hasNextPage === false || profilesAdded >= 100) {
          await db.targetList.update({
            where: { id: input.targetListId },
            data: {
              status: "COMPLETED",
            },
          });

          await db.buildTargetListJob.update({
            where: { id: input.buildTargetListJobId },
            data: {
              status: "COMPLETED",
              completedAt: new Date(),
            },
          });

          return {
            status: "completed",
          } as const;
        }

        startPage += 1;
      }
    });

    if (result.ok === false) {
      await db.buildTargetListJob.update({
        where: { id: input.buildTargetListJobId },
        data: {
          status: "FAILED",
          error: result.error.message,
          completedAt: new Date(),
        },
      });

      return {
        status: "error",
        reason: result.error.message,
      } as const;
    }

    if (result.output.status === "error") {
      await db.buildTargetListJob.update({
        where: { id: input.buildTargetListJobId },
        data: {
          status: "FAILED",
          error: result.output.reason,
          completedAt: new Date(),
        },
      });

      return {
        status: "error",
        reason: result.output.reason,
      } as const;
    }

    await db.buildTargetListJob.update({
      where: { id: input.buildTargetListJobId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });

    return {
      status: "success",
    } as const;
  },
  {
    name: "buildTargetListWorkflow",
  },
);
