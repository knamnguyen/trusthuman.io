import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Loader2,
  MessageSquare,
  Tag,
  Upload,
  User,
} from "lucide-react";

import { Button } from "@sassy/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@sassy/ui/card";

import { ManageListButton } from "../manage-list";
import {
  type PostAuthorRanking,
  useSavedProfileStore,
} from "../stores/saved-profile-store";

/**
 * Expandable post author ranking item
 */
function PostAuthorItem({ ranking }: { ranking: PostAuthorRanking }) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Get post author photo from first comment (they all have the same post author)
  const postAuthorPhoto = ranking.comments[0]?.postAuthorPhotoUrl;
  const postAuthorProfileUrl = ranking.comments[0]?.postAuthorProfileUrl;

  return (
    <div className="border-b last:border-b-0">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="hover:bg-muted/50 flex w-full items-center justify-between px-2 py-2 text-left text-xs transition-colors"
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="h-3 w-3 flex-shrink-0" />
          ) : (
            <ChevronRight className="h-3 w-3 flex-shrink-0" />
          )}
          {postAuthorPhoto ? (
            <img
              src={postAuthorPhoto}
              alt={ranking.postAuthor}
              className="h-5 w-5 flex-shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="bg-muted flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full">
              <User className="text-muted-foreground h-3 w-3" />
            </div>
          )}
          {postAuthorProfileUrl ? (
            <a
              href={postAuthorProfileUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="font-medium hover:underline"
            >
              {ranking.postAuthor}
            </a>
          ) : (
            <span className="font-medium">{ranking.postAuthor}</span>
          )}
        </div>
        <span className="bg-primary/10 text-primary rounded px-1.5 py-0.5 text-xs font-medium">
          {ranking.count}
        </span>
      </button>

      {isExpanded && (
        <div className="bg-muted/30 space-y-1.5 px-3 py-2">
          {ranking.comments.map((comment) => (
            <div
              key={comment.entityUrn}
              className="rounded border bg-white p-2 text-xs"
            >
              <p className="line-clamp-2 text-gray-700">{comment.content}</p>
              <div className="text-muted-foreground mt-1 flex items-center gap-2 text-[10px]">
                {comment.isReply && (
                  <span className="text-primary font-medium">Reply</span>
                )}
                {comment.time && (
                  <span>{new Date(comment.time).toLocaleDateString()}</span>
                )}
                {comment.activityUrl && (
                  <a
                    href={comment.activityUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    View post →
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Profile Card - displays DOM-extracted profile info and engagement stats
 */
function ProfileCard() {
  const {
    selectedProfile,
    clearAll,
    commentStats,
    postAuthorRankings,
    isLoadingComments,
  } = useSavedProfileStore();

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
          {/* Profile Info */}
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

          {/* Profile URN */}
          {selectedProfile.urn && (
            <div className="flex items-center gap-2">
              <Tag className="text-muted-foreground h-4 w-4 flex-shrink-0" />
              <span className="text-muted-foreground truncate text-sm">
                {selectedProfile.urn}
              </span>
            </div>
          )}

          <ManageListButton />

          {/* Loading State */}
          {isLoadingComments && (
            <div className="flex items-center gap-2 py-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-muted-foreground text-sm">
                Loading recent comments...
              </span>
            </div>
          )}

          {/* Comment Stats */}
          {!isLoadingComments && commentStats && (
            <div className="mt-3 flex flex-col gap-3">
              {/* Time Range */}
              <div className="text-muted-foreground text-xs">
                {commentStats.timeRangeDays > 0
                  ? `${commentStats.total} comments in the last ${commentStats.timeRangeDays} days`
                  : `${commentStats.total} comments`}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded border p-2 text-center">
                  <div className="text-lg font-bold">{commentStats.total}</div>
                  <div className="text-muted-foreground text-[10px]">
                    Total
                  </div>
                </div>
                <div className="rounded border p-2 text-center">
                  <div className="text-lg font-bold">
                    {commentStats.onOwnPosts}
                  </div>
                  <div className="text-muted-foreground text-[10px]">
                    Own posts
                  </div>
                </div>
                <div className="rounded border p-2 text-center">
                  <div className="text-lg font-bold">
                    {commentStats.onOthersPosts}
                  </div>
                  <div className="text-muted-foreground text-[10px]">
                    Others
                  </div>
                </div>
              </div>

              {/* Post Author Rankings */}
              {postAuthorRankings.length > 0 && (
                <div className="mt-2">
                  <div className="mb-2 flex items-center gap-2">
                    <MessageSquare className="text-muted-foreground h-4 w-4" />
                    <span className="text-sm font-medium">
                      Commented on posts by
                    </span>
                  </div>
                  <div className="max-h-64 overflow-y-auto rounded border">
                    {postAuthorRankings.map((ranking) => (
                      <PostAuthorItem
                        key={ranking.postAuthor}
                        ranking={ranking}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
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

      {/* Actions Card */}
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
