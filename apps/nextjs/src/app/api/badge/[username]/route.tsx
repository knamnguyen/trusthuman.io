import { ImageResponse } from "next/og";

import { db } from "@sassy/db";

// Badge dimensions - similar aspect ratio to TrustBadge
// Using 2x resolution for crisp rendering
const BADGE_WIDTH = 640;
const BADGE_HEIGHT = 160;

// Cache the font data
let fontCache: ArrayBuffer | null = null;

// Load Inter Bold from Google Fonts (TTF format)
async function loadFont(): Promise<ArrayBuffer | null> {
  if (fontCache) return fontCache;

  try {
    // Google Fonts serves TTF when requested with this user agent
    const response = await fetch(
      "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hjp-Ek-_EeA.woff",
      { cache: "force-cache" }
    );
    if (!response.ok) return null;
    fontCache = await response.arrayBuffer();
    return fontCache;
  } catch {
    return null;
  }
}

// Convert number to ordinal (1st, 2nd, 3rd, etc.)
function toOrdinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  const { username } = await params;

  // Fetch profile data
  const profile = await db.trustProfile.findUnique({
    where: { username },
    select: {
      humanNumber: true,
      username: true,
      displayName: true,
      totalVerifications: true,
      avatarUrl: true,
      badgeImageStyle: true,
    },
  });

  if (!profile) {
    return new Response("Profile not found", { status: 404 });
  }

  // Get theme and image style from query params
  const { searchParams } = new URL(request.url);
  const theme = searchParams.get("theme") || "light";
  const isDark = theme === "dark";

  // Image style: use query param if provided, otherwise use profile setting
  const imageParam = searchParams.get("image");
  const imageStyle = imageParam === "logo" || imageParam === "avatar"
    ? imageParam
    : (profile.badgeImageStyle as "logo" | "avatar") || "logo";

  // Theme colors matching TrustBadge
  const bgColor = isDark ? "#1a1a1a" : "#fbf6e5"; // Cream background
  const borderColor = "#1a1a1a";
  const textColor = "#1a1a1a";
  const greenColor = "#469d3e"; // TrustHuman green
  const orangeColor = "#ffb74a"; // Arrow/count color

  const ordinal = toOrdinal(profile.humanNumber);

  // Determine left image URL based on image style
  const logoUrl = new URL("/trusthuman-logo.png", request.url).toString();
  const leftImageUrl = imageStyle === "avatar" && profile.avatarUrl
    ? profile.avatarUrl
    : logoUrl;
  const isAvatar = imageStyle === "avatar" && profile.avatarUrl;

  // Load font
  const fontData = await loadFont();

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: BADGE_WIDTH,
          height: BADGE_HEIGHT,
          backgroundColor: bgColor,
          border: `4px solid ${borderColor}`,
          borderRadius: 32,
          padding: "16px 32px",
          fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        }}
      >
        {/* Left: Logo or Avatar */}
        <img
          src={leftImageUrl}
          alt={isAvatar ? profile.username : "TrustHuman"}
          width={112}
          height={112}
          style={{
            objectFit: "cover",
            borderRadius: isAvatar ? "50%" : 0,
          }}
        />

        {/* Middle: Text content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            marginLeft: 24,
            flex: 1,
          }}
        >
          {/* "@username | 2nd real human on" */}
          <div
            style={{
              display: "flex",
              fontSize: 14,
              fontWeight: 800,
              color: isDark ? "#ffffff" : textColor,
              lineHeight: 1.2,
            }}
          >
            <span>@{profile.username}</span>
            <span style={{ margin: "0 4px" }}>|</span>
            <span style={{ color: greenColor }}>{ordinal}</span>
            <span style={{ marginLeft: 4 }}>real human on</span>
          </div>
          {/* "TrustHuman.io" */}
          <div
            style={{
              display: "flex",
              fontSize: 32,
              fontWeight: 800,
              lineHeight: 1.2,
            }}
          >
            <span style={{ color: greenColor }}>Trust</span>
            <span style={{ color: isDark ? "#ffffff" : textColor }}>Human.io</span>
          </div>
        </div>

        {/* Right: Arrow + count */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            marginLeft: 16,
          }}
        >
          {/* Orange arrow pointing up */}
          <svg
            width="40"
            height="32"
            viewBox="0 0 18 14"
            fill={orangeColor}
          >
            <path d="M9 0C9 0 9.5 0 10 0.8L17 12C17.3 12.5 17.2 13 16.8 13.3C16.5 13.5 16.2 13.5 15.8 13.5H2.2C1.8 13.5 1.5 13.5 1.2 13.3C0.8 13 0.7 12.5 1 12L8 0.8C8.5 0 9 0 9 0Z" />
          </svg>
          {/* Count */}
          <span
            style={{
              fontSize: 44,
              fontWeight: 800,
              color: orangeColor,
              lineHeight: 1,
            }}
          >
            {profile.totalVerifications}
          </span>
        </div>
      </div>
    ),
    {
      width: BADGE_WIDTH,
      height: BADGE_HEIGHT,
      fonts: fontData
        ? [
            {
              name: "Inter",
              data: fontData,
              weight: 700,
              style: "normal",
            },
          ]
        : undefined,
    },
  );
}
