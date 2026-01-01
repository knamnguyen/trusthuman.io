import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import type { Prisma, PrismaClient } from "@sassy/db";
import { LinkedInProfileScrapeService } from "@sassy/apify-runners/linkedin-profile-scrape-service";
import { S3BucketService } from "@sassy/s3";

import { protectedProcedure } from "../trpc";
import {
  checkExistLinkedInProfile,
  findExistingLinkedInProfile,
} from "../utils/check-exist-linkedin-profile";
import { normalizeLinkedInUrl } from "../utils/normalize-linkedin-url";
import { generateImageKey, uploadImageToS3 } from "../utils/upload-image-to-s3";

const scrapeService = new LinkedInProfileScrapeService({
  token: process.env.APIFY_API_TOKEN ?? "",
});

const s3Service = new S3BucketService({
  region: process.env.AWS_REGION ?? "us-west-2",
  accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
  bucket:
    process.env.AWS_S3_LINKEDIN_PREVIEW_BUCKET ?? "engagekit-linkedin-preview",
});

// Helper to safely cast to Prisma JSON type
const toJson = (val: unknown): Prisma.InputJsonValue | undefined => {
  if (val === undefined || val === null) return undefined;
  return val as Prisma.InputJsonValue;
};

/**
 * Save profile data to database in background (fire-and-forget).
 * Uploads profile picture to S3 first to avoid expiring LinkedIn CDN URLs.
 */
function saveProfileInBackground(
  db: PrismaClient,
  profileUrl: string,
  data: Record<string, unknown>,
) {
  const urn = (data.id as string) ?? `url:${profileUrl}`;
  const normalizedUrl = normalizeLinkedInUrl(profileUrl);

  // Get the profile picture URL from API response
  const linkedInPhotoUrl =
    (data.profilePicture as { url?: string })?.url ?? (data.photo as string);

  // Fire-and-forget: upload to S3 first, then save to DB
  (async () => {
    let profilePicS3Url: string | undefined;

    // Upload profile picture to S3 if available
    if (linkedInPhotoUrl) {
      const s3Key = generateImageKey("linkedin-profiles", urn);
      const result = await uploadImageToS3(linkedInPhotoUrl, s3Key, s3Service);
      if (result) {
        profilePicS3Url = result.s3Url;
        console.log(
          `[linkedin-profile-scrape] Uploaded profile pic to S3: ${result.s3Key}`,
        );
      }
    }

    // Save to DB with S3 URL (or fallback to LinkedIn URL)
    await db.linkedInProfile.upsert({
      where: { urn },
      create: {
        // Required fields
        linkedinUrl: (data.linkedinUrl as string) ?? normalizedUrl,
        fullName:
          `${(data.firstName as string) ?? ""} ${(data.lastName as string) ?? ""}`.trim() ||
          "Unknown",
        headline: (data.headline as string) ?? "",
        urn,
        // Use S3 URL if uploaded, otherwise fallback to LinkedIn CDN URL
        profilePic: profilePicS3Url ?? (data.photo as string) ?? "",

        // Basic fields
        firstName: data.firstName as string | undefined,
        lastName: data.lastName as string | undefined,
        about: data.about as string | undefined,
        publicIdentifier: data.publicIdentifier as string | undefined,

        // New API fields
        objectUrn: data.objectUrn as string | undefined,
        openToWork: data.openToWork as boolean | undefined,
        hiring: data.hiring as boolean | undefined,
        premium: data.premium as boolean | undefined,
        influencer: data.influencer as boolean | undefined,
        memorialized: data.memorialized as boolean | undefined,
        verified: data.verified as boolean | undefined,
        location: toJson(data.location),
        // Use S3 URL if uploaded, otherwise fallback to LinkedIn CDN URL
        profilePictureUrl:
          profilePicS3Url ?? (data.profilePicture as { url?: string })?.url,
        coverPictureUrl: (data.coverPicture as { url?: string })?.url,
        profilePictureSizes: toJson(
          (data.profilePicture as { sizes?: unknown })?.sizes,
        ),
        coverPictureSizes: toJson(
          (data.coverPicture as { sizes?: unknown })?.sizes,
        ),
        websites: toJson(data.websites),
        currentPosition: toJson(data.currentPosition),
        profileActions: toJson(data.profileActions),
        moreProfiles: toJson(data.moreProfiles),
        experience: toJson(data.experience),
        education: toJson(data.education),
        certifications: toJson(data.certifications),
        volunteering: toJson(data.volunteering),
        receivedRecommendations: toJson(data.receivedRecommendations),
        causes: toJson(data.causes),
        featured: toJson(data.featured),
        services: toJson(data.services),
        skills: toJson(data.skills),
        topSkills: data.topSkills as string | undefined,
        connectionsCount: data.connectionsCount as number | undefined,
        followerCount: data.followerCount as number | undefined,
        registeredAt: data.registeredAt
          ? new Date(data.registeredAt as string)
          : undefined,

        // Map to old fields for backwards compatibility
        connections: data.connectionsCount as number | undefined,
        followers: data.followerCount as number | undefined,
      },
      update: {
        // Update all fields on re-scrape
        linkedinUrl: (data.linkedinUrl as string) ?? normalizedUrl,
        fullName:
          `${(data.firstName as string) ?? ""} ${(data.lastName as string) ?? ""}`.trim() ||
          "Unknown",
        headline: (data.headline as string) ?? "",
        // Use S3 URL if uploaded, otherwise fallback to LinkedIn CDN URL
        profilePic: profilePicS3Url ?? (data.photo as string) ?? "",
        firstName: data.firstName as string | undefined,
        lastName: data.lastName as string | undefined,
        about: data.about as string | undefined,
        publicIdentifier: data.publicIdentifier as string | undefined,
        objectUrn: data.objectUrn as string | undefined,
        openToWork: data.openToWork as boolean | undefined,
        hiring: data.hiring as boolean | undefined,
        premium: data.premium as boolean | undefined,
        influencer: data.influencer as boolean | undefined,
        memorialized: data.memorialized as boolean | undefined,
        verified: data.verified as boolean | undefined,
        location: toJson(data.location),
        // Use S3 URL if uploaded, otherwise fallback to LinkedIn CDN URL
        profilePictureUrl:
          profilePicS3Url ?? (data.profilePicture as { url?: string })?.url,
        coverPictureUrl: (data.coverPicture as { url?: string })?.url,
        profilePictureSizes: toJson(
          (data.profilePicture as { sizes?: unknown })?.sizes,
        ),
        coverPictureSizes: toJson(
          (data.coverPicture as { sizes?: unknown })?.sizes,
        ),
        websites: toJson(data.websites),
        currentPosition: toJson(data.currentPosition),
        profileActions: toJson(data.profileActions),
        moreProfiles: toJson(data.moreProfiles),
        experience: toJson(data.experience),
        education: toJson(data.education),
        certifications: toJson(data.certifications),
        volunteering: toJson(data.volunteering),
        receivedRecommendations: toJson(data.receivedRecommendations),
        causes: toJson(data.causes),
        featured: toJson(data.featured),
        services: toJson(data.services),
        skills: toJson(data.skills),
        topSkills: data.topSkills as string | undefined,
        connectionsCount: data.connectionsCount as number | undefined,
        followerCount: data.followerCount as number | undefined,
        registeredAt: data.registeredAt
          ? new Date(data.registeredAt as string)
          : undefined,
        connections: data.connectionsCount as number | undefined,
        followers: data.followerCount as number | undefined,
      },
    });

    console.log(`[linkedin-profile-scrape] Saved profile: ${normalizedUrl}`);
  })().catch((err) => {
    console.error(
      `[linkedin-profile-scrape] Failed to save profile: ${normalizedUrl}`,
      err,
    );
  });
}

export const linkedinProfileScrapeRouter = () =>
  ({
    /**
     * Scrape a single LinkedIn profile.
     * Returns cached data if exists, otherwise scrapes from Apify.
     * Entire operation runs to completion even if user closes connection.
     */
    scrapeSingleProfile: protectedProcedure
      .input(z.object({ url: z.string().url() }))
      .mutation(async ({ ctx, input }) => {
        // Start entire operation immediately as fire-and-forget
        // This ensures completion even if user disconnects at any point
        const operationPromise = (async () => {
          // 1) Check cache first
          const existing = await findExistingLinkedInProfile(ctx, input.url);
          if (existing) {
            console.log(
              "[linkedin-profile-scrape] Cache hit for:",
              normalizeLinkedInUrl(input.url),
            );
            return { type: "cached" as const, data: existing };
          }

          console.log(
            "[linkedin-profile-scrape] Cache miss, scraping:",
            input.url,
          );

          // 2) Scrape from Apify
          const scraped = await scrapeService.scrapeSingleProfile({
            profileUrl: input.url,
          });

          // 3) Save to DB in background
          if (scraped) {
            saveProfileInBackground(
              ctx.db,
              input.url,
              scraped as Record<string, unknown>,
            );
          }

          return { type: "scraped" as const, data: scraped };
        })();

        // Attach error handler for fire-and-forget (prevents unhandled rejection)
        operationPromise.catch((err) => {
          console.error("[linkedin-profile-scrape] Operation failed:", err);
        });

        // Await to return data (if connection still alive)
        const result = await operationPromise;

        if (result.type === "cached") {
          return result.data;
        }

        if (!result.data) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "No data returned from Apify",
          });
        }

        return result.data;
      }),

    /**
     * Scrape multiple LinkedIn profiles.
     * Returns cached data for existing profiles, scrapes missing ones from Apify.
     * Entire operation runs to completion even if user closes connection.
     */
    scrapeManyProfiles: protectedProcedure
      .input(z.object({ urls: z.array(z.string().url()) }))
      .mutation(async ({ ctx, input }) => {
        if (input.urls.length === 0) {
          return { cached: [], scraped: [] };
        }

        // Start entire operation immediately as fire-and-forget
        // This ensures completion even if user disconnects at any point
        const operationPromise = (async () => {
          // 1) Check which URLs already exist
          const { existingUrls, toScrapeUrls } =
            await checkExistLinkedInProfile(ctx, input.urls);

          // 2) Fetch cached profiles
          const cachedProfiles =
            existingUrls.length > 0
              ? await ctx.db.linkedInProfile.findMany({
                  where: { linkedinUrl: { in: existingUrls } },
                })
              : [];

          console.log(
            `[linkedin-profile-scrape] Cache: ${cachedProfiles.length} hits, ${toScrapeUrls.length} to scrape`,
          );

          // 3) Scrape missing profiles
          let scrapedProfiles: unknown[] = [];
          if (toScrapeUrls.length > 0) {
            scrapedProfiles = await scrapeService.scrapeManyProfiles({
              profileUrls: toScrapeUrls,
            });

            // 4) Save all scraped profiles in background
            for (const profile of scrapedProfiles) {
              const data = profile as Record<string, unknown>;
              const url =
                (data.linkedinUrl as string) ??
                (data.originalQuery as { query?: string })?.query ??
                "";
              if (url) {
                saveProfileInBackground(ctx.db, url, data);
              }
            }
          }

          return { cached: cachedProfiles, scraped: scrapedProfiles };
        })();

        // Attach error handler for fire-and-forget (prevents unhandled rejection)
        operationPromise.catch((err) => {
          console.error("[linkedin-profile-scrape] Operation failed:", err);
        });

        // Await to return data (if connection still alive)
        return operationPromise;
      }),
  }) satisfies TRPCRouterRecord;
