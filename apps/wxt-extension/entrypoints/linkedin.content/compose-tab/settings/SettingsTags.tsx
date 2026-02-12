import { useMemo } from "react";

import { useSettingsDBStore } from "../../stores/settings-db-store";
import { useSettingsLocalStore } from "../../stores/settings-local-store";

/**
 * Displays condensed tags for active (non-default) settings.
 * Shows as green chips/badges in a row below the header.
 * Provides at-a-glance visibility of current configuration.
 */
export function SettingsTags() {
  // Get behavior settings from local store
  const behavior = useSettingsLocalStore((state) => state.behavior);

  // Get DB-synced settings (may be null if not loaded)
  const postLoad = useSettingsDBStore((state) => state.postLoad);
  const submitComment = useSettingsDBStore((state) => state.submitComment);
  const commentGenerate = useSettingsDBStore((state) => state.commentGenerate);

  // Generate tags based on current state
  const tags = useMemo(() => {
    const result: string[] = [];

    // Behavior settings (local)
    if (behavior.humanOnlyMode) {
      result.push("Human Mode");
    }
    if (behavior.autoEngageOnCommentClick) {
      result.push("Auto-engage");
    }
    if (behavior.spacebarAutoEngage) {
      result.push("Space Engage");
    }
    if (behavior.postNavigator) {
      result.push("Navigator");
    }
    if (behavior.autoSubmitAfterGenerate) {
      result.push("Auto-Submit");
    }

    // Post load filters (DB)
    if (postLoad?.timeFilterEnabled && postLoad.minPostAge) {
      result.push(`Max ${postLoad.minPostAge}h`);
    }
    if (postLoad?.skipPromotedPostsEnabled) {
      result.push("Skip Promoted");
    }
    if (postLoad?.skipCompanyPagesEnabled) {
      result.push("Skip Company");
    }
    if (postLoad?.skipFriendActivitiesEnabled) {
      result.push("Skip Friend Activity");
    }
    if (postLoad?.skipFirstDegree) {
      result.push("Skip 1st");
    }
    if (postLoad?.skipSecondDegree) {
      result.push("Skip 2nd");
    }
    if (postLoad?.skipThirdDegree) {
      result.push("Skip 3rd+");
    }
    if (postLoad?.skipFollowing) {
      result.push("Skip Following");
    }
    if (postLoad?.skipBlacklistEnabled) {
      result.push("Blacklist");
    }
    if (postLoad?.skipIfUserCommented) {
      result.push("Skip Commented");
    }
    if (postLoad?.targetListEnabled && postLoad.targetListIds.length > 0) {
      result.push("Target List");
    }

    // Submit comment actions (DB)
    if (submitComment?.likePostEnabled) {
      result.push("Like Post");
    }
    if (submitComment?.likeCommentEnabled) {
      result.push("Like Comment");
    }
    if (submitComment?.tagPostAuthorEnabled) {
      result.push("Tag Author");
    }
    if (submitComment?.attachPictureEnabled) {
      result.push("Attach Image");
    }
    if (submitComment && submitComment.submitDelayRange !== "5-20") {
      result.push(`Delay ${submitComment.submitDelayRange}s`);
    }

    // Comment generate settings (DB)
    if (commentGenerate?.adjacentCommentsEnabled) {
      result.push("Adjacent Comments");
    }
    if (commentGenerate?.dynamicChooseStyleEnabled) {
      result.push("Dynamic Style");
    }
    if (commentGenerate?.commentStyleId) {
      result.push("Custom Style");
    }

    return result;
  }, [behavior, postLoad, submitComment, commentGenerate]);

  // Show nothing if no active settings
  if (tags.length === 0) {
    return (
      <span className="text-muted-foreground text-xs italic">
        Default settings
      </span>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {tags.map((tag) => (
        <span
          key={tag}
          className="rounded-md bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}
