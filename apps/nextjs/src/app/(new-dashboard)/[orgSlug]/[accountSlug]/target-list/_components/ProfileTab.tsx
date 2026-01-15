"use client";

import { ExternalLink, Tag, User, UserCircle } from "lucide-react";

import { Button } from "@sassy/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@sassy/ui/card";

interface TargetProfile {
  id: string;
  linkedinUrl: string;
  name: string | null;
  headline: string | null;
  photoUrl: string | null;
  profileUrn: string | null;
}

interface ProfileTabProps {
  profile: TargetProfile | null;
  onClear: () => void;
}

export function ProfileTab({ profile, onClear }: ProfileTabProps) {
  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <UserCircle className="text-muted-foreground h-12 w-12" />
        <div className="text-center">
          <p className="text-muted-foreground text-sm">No profile selected</p>
          <p className="text-muted-foreground mt-1 text-xs">
            Click on a profile card to view details
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4" />
              Profile
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClear}>
              Clear
            </Button>
          </div>
          <CardDescription>Target profile details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            {/* Profile Info */}
            <div className="flex items-center gap-3">
              {profile.photoUrl ? (
                <img
                  src={profile.photoUrl}
                  alt={profile.name ?? "Profile"}
                  className="border-primary h-14 w-14 rounded-full border-2 object-cover"
                />
              ) : (
                <div className="border-muted bg-muted flex h-14 w-14 items-center justify-center rounded-full border-2">
                  <User className="text-muted-foreground h-7 w-7" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-semibold">
                  {profile.name ?? "Unknown"}
                </p>
                {profile.headline && (
                  <p className="text-muted-foreground line-clamp-2 text-sm">
                    {profile.headline}
                  </p>
                )}
              </div>
            </div>

            {/* LinkedIn URL */}
            <div className="flex items-center gap-2">
              <ExternalLink className="text-muted-foreground h-4 w-4 flex-shrink-0" />
              <a
                href={profile.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary truncate text-sm hover:underline"
              >
                {profile.linkedinUrl}
              </a>
            </div>

            {/* Profile URN */}
            {profile.profileUrn && (
              <div className="flex items-center gap-2">
                <Tag className="text-muted-foreground h-4 w-4 flex-shrink-0" />
                <span className="text-muted-foreground truncate text-sm">
                  {profile.profileUrn}
                </span>
              </div>
            )}

            {/* Future: Add more profile details here */}
            {/* - Followers count */}
            {/* - Recent posts */}
            {/* - Past comments */}
            {/* - Engagement stats */}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
