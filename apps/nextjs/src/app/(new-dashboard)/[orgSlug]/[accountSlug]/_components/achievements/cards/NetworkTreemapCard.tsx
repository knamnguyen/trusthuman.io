"use client";

import { useMemo } from "react";
import { ResponsiveContainer, Treemap } from "recharts";

import { Avatar, AvatarFallback, AvatarImage } from "@sassy/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@sassy/ui/card";
import { Skeleton } from "@sassy/ui/skeleton";

import { useAchievementsStore } from "~/stores/zustand-store";

interface TreemapNode {
  name: string;
  size: number;
  imageUrl: string | null;
  profileUrl: string;
  colorIndex: number;
  percentage: number;
}

interface TreemapData {
  name: string;
  children: TreemapNode[];
}

// Generate unique pastel colors for each profile
function generatePastelColor(seed: string): string {
  // Simple hash function to generate consistent color from string
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Generate HSL values for pastel colors
  const hue = Math.abs(hash % 360);
  const saturation = 40 + (Math.abs(hash >> 8) % 30); // 40-70%
  const lightness = 75 + (Math.abs(hash >> 16) % 15); // 75-90%

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

function transformNetworkDataForTreemap(
  data: {
    authorProfileUrl: string;
    authorName: string | null;
    authorAvatarUrl: string | null;
    interactionCount: number;
  }[],
): TreemapData {
  const totalInteractions = data.reduce(
    (sum, profile) => sum + profile.interactionCount,
    0,
  );

  return {
    name: "Network",
    children: data.map((profile, index) => ({
      name: profile.authorName ?? "Unknown",
      size: profile.interactionCount,
      imageUrl: profile.authorAvatarUrl,
      profileUrl: profile.authorProfileUrl,
      colorIndex: index % 5,
      percentage: Math.round(
        (profile.interactionCount / totalInteractions) * 100,
      ),
    })),
  };
}

interface CustomTreemapContentProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  name?: string;
  size?: number;
  imageUrl?: string | null;
  profileUrl?: string;
  colorIndex?: number;
  percentage?: number;
}

function CustomTreemapContent({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  name = "",
  size = 0,
  imageUrl,
  profileUrl,
  percentage = 0,
}: CustomTreemapContentProps) {
  // Gap size between cells
  const gap = 4;

  // Only render if box is large enough
  if (width < 60 || height < 60) {
    return null;
  }

  const handleClick = () => {
    if (profileUrl) {
      window.open(profileUrl, "_blank", "noopener,noreferrer");
    }
  };

  // Apply gap by shrinking rect from all sides
  const rectX = x + gap / 2;
  const rectY = y + gap / 2;
  const rectWidth = width - gap;
  const rectHeight = height - gap;

  // Generate unique color for this profile
  const boxColor = generatePastelColor(profileUrl ?? name);

  // Layout constants
  const padding = 12;
  const avatarSize = 40;
  const showAvatar = width >= 100 && height >= 100;
  const showName = width >= 80;

  return (
    <g>
      {/* Full chart background - only render once for first cell */}
      {x === 0 && y === 0 && (
        <rect
          x={0}
          y={0}
          width="100%"
          height="100%"
          fill="#fbf6e5"
          style={{ pointerEvents: "none" }}
        />
      )}

      {/* Background rectangle */}
      <rect
        x={rectX}
        y={rectY}
        width={rectWidth}
        height={rectHeight}
        rx={12}
        ry={12}
        fill={boxColor}
        stroke="#000000"
        strokeWidth={2}
        className="cursor-pointer transition-all hover:opacity-90"
        onClick={handleClick}
      />

      {/* Percentage pill - top left */}
      <foreignObject
        x={rectX + padding}
        y={rectY + padding}
        width={50}
        height={24}
      >
        <div className="flex h-6 items-center justify-center rounded-full bg-white px-2.5">
          <span className="text-xs font-semibold text-black">
            {percentage}%
          </span>
        </div>
      </foreignObject>

      {/* Avatar - top right */}
      {showAvatar && imageUrl && (
        <foreignObject
          x={rectX + rectWidth - avatarSize - padding}
          y={rectY + padding}
          width={avatarSize}
          height={avatarSize}
        >
          <Avatar className="h-10 w-10 border-2 border-black">
            <AvatarImage src={imageUrl} />
            <AvatarFallback className="bg-white text-xs font-semibold">
              {name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </foreignObject>
      )}

      {/* Name - bottom left */}
      {showName && (
        <foreignObject
          x={rectX + padding}
          y={rectY + rectHeight - padding - 40}
          width={rectWidth - padding * 2}
          height={40}
        >
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-black">
              {name.length > 20 ? `${name.substring(0, 20)}...` : name}
            </span>
            <span className="text-lg font-bold text-black">{size} cmts</span>
          </div>
        </foreignObject>
      )}
    </g>
  );
}

// Wrapper component to add background to SVG
function TreemapWithBackground({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative"
      style={{
        background: "#fbf6e5",
      }}
    >
      {children}
    </div>
  );
}

export function NetworkTreemapCard() {
  const networkData = useAchievementsStore((s) => s.networkData);
  const isLoading = useAchievementsStore((s) => s.isLoading);

  const treeData = useMemo(
    () => transformNetworkDataForTreemap(networkData ?? []),
    [networkData],
  );

  if (isLoading) {
    return (
      <Card className="bg-card border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <CardHeader>
          <CardTitle>Network Treemap</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!networkData || networkData.length === 0) {
    return (
      <Card className="bg-card border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <CardHeader>
          <CardTitle>Network Treemap</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground flex h-64 items-center justify-center text-sm">
            No network interactions yet
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <CardHeader>
        <CardTitle>Network Treemap</CardTitle>
        <p className="text-muted-foreground text-xs">
          Top {networkData.length} most engaged profiles
        </p>
      </CardHeader>
      <CardContent>
        <div className="[&>div>svg]:bg-[#fbf6e5]">
          <ResponsiveContainer width="100%" height={400}>
            <Treemap
              data={treeData.children}
              dataKey="size"
              aspectRatio={4 / 3}
              stroke="none"
              fill="#fbf6e5"
              content={<CustomTreemapContent />}
              isAnimationActive={false}
            />
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
