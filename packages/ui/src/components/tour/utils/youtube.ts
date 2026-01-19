interface YouTubeEmbedOptions {
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
  /** Hide all UI except video (for preview loops) */
  minimal?: boolean;
}

export function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/, // Direct video ID
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }

  return null;
}

/**
 * Get YouTube video thumbnail URL
 * @param quality - maxresdefault (1280x720), hqdefault (480x360), mqdefault (320x180)
 */
export function getYouTubeThumbnailUrl(
  url: string,
  quality: "maxresdefault" | "hqdefault" | "mqdefault" = "maxresdefault",
): string {
  const videoId = extractYouTubeId(url);
  if (!videoId) return "";
  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
}

export function getYouTubeEmbedUrl(
  url: string,
  options: YouTubeEmbedOptions = {},
): string {
  const videoId = extractYouTubeId(url);
  if (!videoId) return "";

  const {
    autoplay = false,
    loop = false,
    muted = false,
    controls = true,
    minimal = false,
  } = options;

  const params = new URLSearchParams({
    autoplay: autoplay ? "1" : "0",
    mute: muted ? "1" : "0",
    loop: loop ? "1" : "0",
    controls: controls ? "1" : "0",
    modestbranding: "1",
    rel: "0",
    playsinline: "1",
    // Hide annotations
    iv_load_policy: "3",
    // Prevent related videos at end
    end: "0",
  });

  // Minimal mode: hide as much UI as possible (for silent preview loops)
  if (minimal) {
    params.set("showinfo", "0"); // Hide title (legacy but still helps)
    params.set("fs", "0"); // Hide fullscreen button
    params.set("disablekb", "1"); // Disable keyboard shortcuts
    params.set("cc_load_policy", "0"); // Hide closed captions
    params.set("color", "white"); // Use white progress bar (less visible)
    params.set("enablejsapi", "0"); // Disable JS API
    params.set("origin", window.location.origin); // Set origin for security
    params.set("pointer-events", "none"); // Disable pointer events
    params.set("modestbranding", "1"); // Disable hover events
    params.set("iv_load_policy", "3"); // Disable annotations
    params.set("rel", "0"); // Disable related videos
    params.set("playlist", videoId);
  }

  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}
