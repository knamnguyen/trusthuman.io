import { useShallow } from "zustand/shallow";

import { useSettingsStore } from "../stores/settings-store";

/**
 * Displays condensed tags for active (non-default) settings.
 * Shows as green chips/badges in a row below the header.
 * Provides at-a-glance visibility of current configuration.
 */
export function SettingsTags() {
  // Subscribe to all settings state to trigger re-renders when any setting changes
  const { postLoad, submitComment, commentGenerate, behavior, getActiveSettingsTags } =
    useSettingsStore(
      useShallow((state) => ({
        postLoad: state.postLoad,
        submitComment: state.submitComment,
        commentGenerate: state.commentGenerate,
        behavior: state.behavior,
        getActiveSettingsTags: state.getActiveSettingsTags,
      })),
    );

  // Generate tags based on current state
  const tags = getActiveSettingsTags();

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
