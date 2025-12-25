import { ExternalLink, Upload, User } from "lucide-react";

import { Button } from "@sassy/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@sassy/ui/card";

import { ManageListButton } from "../manage-list";
import { useSavedProfileStore } from "../stores/saved-profile-store";

/**
 * Profile Card - displays DOM-extracted profile info
 */
function ProfileCard() {
  const { selectedProfile, clearAll } = useSavedProfileStore();

  if (!selectedProfile) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4" />
            Profile
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={clearAll}>
            Clear
          </Button>
        </div>
        <CardDescription>Extracted from page</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            {selectedProfile.photoUrl ? (
              <img
                src={selectedProfile.photoUrl}
                alt={selectedProfile.name || "Profile"}
                className="border-primary h-12 w-12 rounded-full border-2 object-cover"
              />
            ) : (
              <div className="border-muted bg-muted flex h-12 w-12 items-center justify-center rounded-full border-2">
                <User className="text-muted-foreground h-6 w-6" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">
                {selectedProfile.name || "Unknown"}
              </p>
              {selectedProfile.headline && (
                <p className="text-muted-foreground truncate text-sm">
                  {selectedProfile.headline}
                </p>
              )}
            </div>
          </div>

          {/* LinkedIn URL */}
          {selectedProfile.linkedinUrl && (
            <div className="flex items-center gap-2">
              <ExternalLink className="text-muted-foreground h-4 w-4 flex-shrink-0" />
              <a
                href={selectedProfile.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary truncate text-sm hover:underline"
              >
                {selectedProfile.linkedinUrl}
              </a>
            </div>
          )}
          <ManageListButton />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Share Tab - Displays saved profile and sharing options
 */
export function ShareTab() {
  const { selectedProfile } = useSavedProfileStore();

  // Empty state
  if (!selectedProfile) {
    return (
      <div className="flex flex-col gap-4 px-4">
        <div className="flex h-full flex-col items-center justify-center gap-4 py-8">
          <Upload className="text-muted-foreground h-12 w-12" />
          <div className="text-center">
            <p className="text-muted-foreground text-sm">
              No profile saved yet
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              Click the save profile button next to any LinkedIn profile to save
              it
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 px-4">
      {/* Profile from DOM */}
      <ProfileCard />

      {/* Future: Add sharing options, save to list, etc. */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Button variant="outline" className="w-full justify-start" disabled>
            <Upload className="mr-2 h-4 w-4" />
            Save to List (Coming Soon)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
