import { storage } from "wxt/storage";
import type {
  LinkedInMention,
  MentionsApiResponse,
  NotificationCardObject,
  ProfileObject,
  SocialActivityCountsObject,
} from "./types";

interface LinkedInAuth {
  cookie: string;
  csrfToken: string;
  pageInstance?: string;
  track?: string;
}

const TAG = "[FollowUp]";

/**
 * Resolve profile photo URL from a ProfileObject
 * Picks the smallest artifact >= 100px for sidebar display
 */
function resolveProfilePhotoUrl(profile: ProfileObject): string | null {
  const vectorImage =
    profile.profilePicture?.displayImageReference?.vectorImage;
  if (!vectorImage?.rootUrl || !vectorImage.artifacts?.length) return null;

  // Sort by width ascending, pick smallest >= 100px (or fallback to smallest)
  const sorted = [...vectorImage.artifacts].sort((a, b) => a.width - b.width);
  const artifact = sorted.find((a) => a.width >= 100) ?? sorted[0];
  if (!artifact) return null;

  return vectorImage.rootUrl + artifact.fileIdentifyingUrlPathSegment;
}

/**
 * Fetch mentions from LinkedIn Voyager API (single page)
 */
export async function fetchMentions(
  start: number = 0,
  count: number = 20
): Promise<{ mentions: LinkedInMention[]; nextStart?: number } | null> {
  console.log(`${TAG} fetchMentions(start=${start}, count=${count})`);

  const auth = await storage.getItem<LinkedInAuth>("local:auth");

  if (!auth || !auth.cookie || !auth.csrfToken) {
    console.error(`${TAG} Missing Auth Headers. Please refresh page.`);
    return null;
  }

  try {
    const url = `https://www.linkedin.com/voyager/api/voyagerIdentityDashNotificationCards?decorationId=com.linkedin.voyager.dash.deco.identity.notifications.CardsCollection-80&count=${count}&filterUrn=urn%3Ali%3Afsd_notificationFilter%3AMENTIONS_ALL&q=notifications&start=${start}`;

    console.log(`${TAG} Fetching:`, url);
    const response = await fetch(url, {
      method: "GET",
      headers: {
        accept: "application/vnd.linkedin.normalized+json+2.1",
        "csrf-token": auth.csrfToken,
        cookie: auth.cookie,
        "x-restli-protocol-version": "2.0.0",
        "x-li-lang": "en_US",
      },
    });

    if (!response.ok) {
      console.error(
        `${TAG} Failed to fetch mentions:`,
        response.status,
        response.statusText
      );
      return null;
    }

    const data = (await response.json()) as MentionsApiResponse;
    const orderedUrns = data.data["*elements"];
    console.log(`${TAG} API response:`, {
      includedCount: data.included.length,
      orderedUrns: orderedUrns.length,
      nextStart: data.data.metadata.nextStart,
      paging: data.data.paging,
    });

    // Build lookup maps from included array
    const cardMap = new Map<string, NotificationCardObject>();
    const socialActivityMap = new Map<string, SocialActivityCountsObject>();
    const profileMap = new Map<string, ProfileObject>();

    for (const obj of data.included) {
      if (
        obj.$type === "com.linkedin.voyager.dash.identity.notifications.Card"
      ) {
        cardMap.set(obj.entityUrn, obj as NotificationCardObject);
      } else if (
        obj.$type === "com.linkedin.voyager.dash.feed.SocialActivityCounts"
      ) {
        socialActivityMap.set(obj.entityUrn, obj as SocialActivityCountsObject);
      } else if (
        obj.$type === "com.linkedin.voyager.dash.identity.profile.Profile"
      ) {
        profileMap.set(obj.entityUrn, obj as ProfileObject);
      }
    }

    console.log(`${TAG} Lookup maps: ${cardMap.size} cards, ${socialActivityMap.size} activity counts, ${profileMap.size} profiles`);

    // Iterate in *elements order (chronological, newest first)
    const mentions: LinkedInMention[] = [];
    for (const urn of orderedUrns) {
      const card = cardMap.get(urn);
      if (!card) {
        console.log(`${TAG} Card not found for URN:`, urn);
        continue;
      }

      // Skip placeholder/empty cards (e.g., emptySectionCard has null fields)
      if (!card.headerImage || !card.cardAction || !card.contentPrimaryText) {
        console.log(`${TAG} Skipping non-mention card:`, card.entityUrn);
        continue;
      }

      // Extract mentioner name from headline text
      // Pattern: "Name mentioned you in a comment."
      const mentionerName = card.headline.text.replace(
        /\s+mentioned you in a comment\.$/i,
        ""
      );

      // Extract mentioner profile URL from headerImage
      const mentionerProfileUrl = card.headerImage.actionTarget;

      // Resolve mentioner photo from profile objects in included
      let mentionerPhotoUrl: string | null = null;
      const profileUrn =
        card.headerImage.attributes?.[0]?.detailDataUnion?.profilePicture;
      if (profileUrn) {
        const profile = profileMap.get(profileUrn);
        if (profile) {
          mentionerPhotoUrl = resolveProfilePhotoUrl(profile);
        }
      }

      // Extract comment text (primary content)
      const commentText =
        card.contentPrimaryText.length > 0
          ? card.contentPrimaryText[0]!.text
          : "";

      // Extract post snippet (secondary content)
      const postSnippet =
        card.contentSecondaryText?.length > 0
          ? card.contentSecondaryText[0]!.text
          : "";

      // Extract post URL from cardAction
      const postUrl = card.cardAction.actionTarget;

      // Get engagement counts from socialActivityCounts
      let numLikes: number | null = null;
      let numComments: number | null = null;

      if (card["*socialActivityCounts"]) {
        const countsUrn = card["*socialActivityCounts"];
        const counts = socialActivityMap.get(countsUrn);
        if (counts) {
          numLikes = counts.numLikes;
          numComments = counts.numComments;
        }
      }

      console.log(`${TAG} Parsed mention:`, {
        entityUrn: card.entityUrn,
        mentionerName,
        hasPhoto: !!mentionerPhotoUrl,
        commentText: commentText.slice(0, 50) + "...",
        publishedAt: new Date(card.publishedAt).toISOString(),
      });

      mentions.push({
        entityUrn: card.entityUrn,
        mentionerName,
        mentionerPhotoUrl,
        mentionerProfileUrl,
        commentText,
        postSnippet,
        postUrl,
        publishedAt: card.publishedAt,
        read: card.read,
        numLikes,
        numComments,
      });
    }

    console.log(
      `${TAG} Parsed ${mentions.length} mentions from page (start=${start})`
    );
    return {
      mentions,
      nextStart: data.data.metadata.nextStart,
    };
  } catch (error) {
    console.error(`${TAG} Error fetching mentions:`, error);
    return null;
  }
}

/**
 * Fetch mentions with watermark-based deduplication
 * Returns only new mentions since the last watermark
 */
export async function fetchMentionsWithWatermark(
  accountId: string,
  watermark: string | null,
  maxPages: number = 3
): Promise<LinkedInMention[]> {
  console.log(
    `${TAG} fetchMentionsWithWatermark(account=${accountId}, watermark=${watermark}, maxPages=${maxPages})`
  );

  const allNewMentions: LinkedInMention[] = [];
  let currentStart = 0;
  let pagesProcessed = 0;

  while (pagesProcessed < maxPages) {
    const result = await fetchMentions(currentStart, 20);
    if (!result) {
      console.log(`${TAG} fetchMentions returned null, stopping`);
      break;
    }

    const { mentions, nextStart } = result;

    if (watermark === null) {
      console.log(
        `${TAG} First fetch (no watermark), returning ${mentions.length} mentions`
      );
      return mentions;
    }

    // Find watermark index
    const watermarkIndex = mentions.findIndex(
      (m) => m.entityUrn === watermark
    );
    console.log(
      `${TAG} Watermark search: index=${watermarkIndex}, page mentions=${mentions.length}`
    );

    if (watermarkIndex === -1) {
      // All mentions are new
      allNewMentions.push(...mentions);

      // Check if there's a next page
      if (nextStart !== undefined) {
        currentStart = nextStart;
        pagesProcessed++;
        console.log(
          `${TAG} All new on this page, continuing to next (start=${nextStart})`
        );
        continue;
      } else {
        console.log(`${TAG} No more pages, stopping`);
        break;
      }
    } else {
      // Found watermark - take mentions before it
      const newOnPage = mentions.slice(0, watermarkIndex);
      allNewMentions.push(...newOnPage);
      console.log(
        `${TAG} Found watermark at index ${watermarkIndex}, got ${newOnPage.length} new mentions`
      );
      break;
    }
  }

  console.log(`${TAG} Total new mentions: ${allNewMentions.length}`);
  return allNewMentions;
}
