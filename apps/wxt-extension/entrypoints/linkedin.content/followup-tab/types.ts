export interface LinkedInMention {
  entityUrn: string;
  mentionerName: string;
  mentionerPhotoUrl: string | null;
  mentionerProfileUrl: string;
  commentText: string;
  postSnippet: string;
  postUrl: string;
  publishedAt: number;
  read: boolean;
  numLikes: number | null;
  numComments: number | null;
}

export interface MentionsApiResponse {
  data: {
    metadata: {
      nextStart?: number;
      numUnseen: number;
    };
    paging: {
      start: number;
      count: number;
    };
    "*elements": string[]; // Array of notification card URNs (in chronological order)
  };
  included: Array<
    | NotificationCardObject
    | SocialActivityCountsObject
    | ProfileObject
    | { $type: string; entityUrn: string; [key: string]: unknown }
  >;
}

export interface NotificationCardObject {
  $type: "com.linkedin.voyager.dash.identity.notifications.Card";
  entityUrn: string;
  headline: { text: string }; // e.g., "Chris Lang mentioned you in a comment."
  contentPrimaryText: Array<{ text: string }> | null; // Comment text (null on placeholder cards)
  contentSecondaryText: Array<{ text: string }> | null; // Post snippet (null on placeholder cards)
  cardAction: { actionTarget: string } | null; // Post URL (null on placeholder cards)
  headerImage: {
    actionTarget: string; // Mentioner profile URL
    accessibilityText: string;
    attributes?: Array<{
      detailDataUnion?: {
        profilePicture?: string; // URN like "urn:li:fsd_profile:..."
      };
    }>;
  } | null; // null on placeholder cards
  publishedAt: number;
  read: boolean;
  "*socialActivityCounts"?: string; // URN reference
}

export interface ProfileObject {
  $type: "com.linkedin.voyager.dash.identity.profile.Profile";
  entityUrn: string;
  profilePicture?: {
    displayImageReference?: {
      vectorImage?: {
        rootUrl: string;
        artifacts: Array<{
          width: number;
          height: number;
          fileIdentifyingUrlPathSegment: string;
        }>;
      };
    };
  };
}

export interface SocialActivityCountsObject {
  $type: "com.linkedin.voyager.dash.feed.SocialActivityCounts";
  entityUrn: string;
  numLikes: number;
  numComments: number;
  liked: boolean;
}
