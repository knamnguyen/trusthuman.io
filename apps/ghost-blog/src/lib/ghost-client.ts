import GhostContentAPI from "@tryghost/content-api";

// Create Ghost API instance
const api = new GhostContentAPI({
  url: import.meta.env.VITE_GHOST_URL || "https://engagekit.ghost.io",
  key:
    import.meta.env.VITE_GHOST_CONTENT_API_KEY ||
    "3a08d7890dfcb6561b8fd70729",
  version: "v5.0",
});

export interface GhostPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  html?: string;
  feature_image?: string;
  published_at?: string;
  url?: string;
}

export async function fetchGhostPosts(
  limit: number = 20,
  tag?: string,
): Promise<GhostPost[]> {
  try {
    const browseOptions: {
      limit: number;
      include: string[];
      fields: string[];
      filter?: string;
    } = {
      limit,
      include: ["tags", "authors"],
      fields: [
        "id",
        "title",
        "slug",
        "excerpt",
        "html",
        "feature_image",
        "published_at",
        "url",
      ],
    };

    // Filter by tag if provided
    if (tag) {
      browseOptions.filter = `tag:${tag}`;
    }

    const posts = await api.posts.browse(browseOptions);
    return posts as GhostPost[];
  } catch (error) {
    console.error("Error fetching Ghost posts:", error);
    return [];
  }
}

export { api };
