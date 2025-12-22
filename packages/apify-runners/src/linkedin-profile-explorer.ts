import type { ApifyClient } from "apify-client";
import z from "zod";

import { ApifyActor } from "./actor";

const inputSchema = z.object({
  profileScraperMode: z
    .enum(["Full", "Short", "Full + email search"])
    .default("Full"),
  searchQuery: z.string().trim().min(1),
  maxItems: z.number().min(1).max(100).optional(),
  locations: z.array(z.string()).optional(),
  currentCompanies: z.array(z.string()).optional(),
  pastCompanies: z.array(z.string()).optional(),
  schools: z.array(z.string()).optional(),
  currentJobTitles: z.array(z.string()).optional(),
  pastJobTitles: z.array(z.string()).optional(),
  yearsOfExperienceIds: z.array(z.number()).optional(),
  yearsAtCurrencyCompanyIds: z.array(z.number()).optional(),
  seniorityLevelIds: z.array(z.number()).optional(),
  functionIds: z.array(z.number()).optional(),
  industryIds: z.array(z.number()).optional(),
  firstName: z.array(z.string()).optional(),
  lastName: z.array(z.string()).optional(),
  profileLanguages: z.array(z.string()).optional(),
  recentlyChangesJobs: z.boolean().optional(),
  excludeLocations: z.array(z.string()).optional(),
  excludeCurrentCompanies: z.array(z.string()).optional(),
  excludePastCompanies: z.array(z.string()).optional(),
  exclueSchools: z.array(z.string()).optional(),
  excludeCurrentJobTitles: z.array(z.string()).optional(),
  excludePastJobTitles: z.array(z.string()).optional(),
  excludeIndustryIds: z.array(z.number()).optional(),
  excludeFunctionIds: z.array(z.number()).optional(),
  excludeSeniorityLevelIds: z.array(z.number()).optional(),
  startPage: z.number().min(1).optional(),
  takePages: z.number().min(1).max(100).optional(),
});

const outputSchema = z.object({
  id: z.string(),
  linkedinUrl: z.string().url(),
  firstName: z.string(),
  lastName: z.string(),
  openProfile: z.boolean(),
  premium: z.boolean(),
  currentPositions: z.array(
    z.object({
      tenureAtPosition: z.object({
        numYears: z.number(),
        numMonths: z.number(),
      }),
      companyName: z.string(),
      title: z.string(),
      current: z.boolean(),
      tenureAtCompany: z.object({
        numYears: z.number(),
        numMonths: z.number(),
      }),
      startedOn: z.object({
        month: z.number(),
        year: z.number(),
      }),
      companyId: z.string(),
      companyLinkedinUrl: z.string().url(),
    }),
  ),
  pictureUrl: z.string().url(),
  location: z.object({
    linkedinText: z.string(),
  }),
  _meta: z.object({
    pagination: z.object({
      totalElements: z.number(),
      totalPages: z.number(),
      pageNumber: z.number(),
      previousElements: z.number(),
      pageSize: z.number(),
    }),
  }),
});

export class LinkedInProfileExplorer {
  private readonly actor;
  constructor(private readonly client: ApifyClient) {
    this.actor = new ApifyActor(this.client, {
      input: inputSchema,
      output: outputSchema,
      actorId: "M2FMdjRVeF1HPGFcc",
    });
  }

  async searchProfile(input: z.input<typeof inputSchema>) {
    const parsed = inputSchema.parse(input);
    const run = await this.actor.run(parsed);
    return this.actor.getResults(run.defaultDatasetId);
  }
}
