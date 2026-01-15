import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Brain, Cog, Filter, Send, Settings, X } from "lucide-react";

import { Button } from "@sassy/ui/button";
import { ExpandableTabs } from "@sassy/ui/expandable-tabs";
import { ScrollArea } from "@sassy/ui/scroll-area";

import { useTRPC } from "../../../lib/trpc/client";
import { useSettingsStore } from "../stores/settings-store";

// Tab configuration for settings
const SETTINGS_TABS = [
  { title: "Behavior", icon: Cog },
  { title: "Filters", icon: Filter },
  { title: "Submit", icon: Send },
  { title: "AI", icon: Brain },
];

interface SettingsSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Settings sheet component that slides in from the right.
 * Contains expandable tabs for Behavior, Filters, Submit, and AI settings.
 * Similar animation pattern to PostPreviewSheet.
 */
export function SettingsSheet({ isOpen, onClose }: SettingsSheetProps) {
  // Local tab state (no need to persist)
  const [selectedTab, setSelectedTab] = useState(0);
  const trpc = useTRPC();

  // Prefetch target lists when settings sheet opens
  // This ensures the dropdown is instant when user enables "Use Target List"
  useQuery(
    trpc.targetList.findLists.queryOptions(
      { cursor: undefined },
      {
        enabled: isOpen,
        staleTime: 30 * 1000,
      }
    )
  );

  // Get settings from store
  const behavior = useSettingsStore((state) => state.behavior);
  const postLoad = useSettingsStore((state) => state.postLoad);
  const submitComment = useSettingsStore((state) => state.submitComment);
  const commentGenerate = useSettingsStore((state) => state.commentGenerate);

  // Get update actions
  const updateBehavior = useSettingsStore((state) => state.updateBehavior);
  const updatePostLoad = useSettingsStore((state) => state.updatePostLoad);
  const updateSubmitComment = useSettingsStore(
    (state) => state.updateSubmitComment,
  );
  const updateCommentGenerate = useSettingsStore(
    (state) => state.updateCommentGenerate,
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="bg-background pointer-events-auto flex h-full w-[400px] flex-col border"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <h2 className="text-sm font-semibold">Settings</h2>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Expandable Tabs */}
          <div className="flex justify-center px-4 py-3">
            <ExpandableTabs
              tabs={SETTINGS_TABS}
              value={selectedTab}
              onChange={setSelectedTab}
            />
          </div>

          {/* Tab Content */}
          <ScrollArea className="flex-1">
            <div className="p-4">
              {selectedTab === 0 && (
                <SettingsBehaviorContent
                  behavior={behavior}
                  updateBehavior={updateBehavior}
                />
              )}
              {selectedTab === 1 && (
                <SettingsFiltersContent
                  postLoad={postLoad}
                  updatePostLoad={updatePostLoad}
                />
              )}
              {selectedTab === 2 && (
                <SettingsSubmitContent
                  submitComment={submitComment}
                  updateSubmitComment={updateSubmitComment}
                />
              )}
              {selectedTab === 3 && (
                <SettingsAIContent
                  commentGenerate={commentGenerate}
                  updateCommentGenerate={updateCommentGenerate}
                />
              )}
            </div>
          </ScrollArea>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// =============================================================================
// INLINE TAB CONTENT COMPONENTS
// These will be extracted to separate files in Phase 2.2-2.5
// =============================================================================

import type {
  BehaviorSettings,
  CommentGenerateSettings,
  PostLoadSettings,
  SubmitCommentSettings,
} from "../stores/settings-store";

import { Label } from "@sassy/ui/label";
import { Switch } from "@sassy/ui/switch";

import { SettingsImageManager } from "./SettingsImageManager";
import { TargetListSelector } from "./TargetListSelector";

/**
 * Section header component for organizing settings
 */
function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
        {title}
      </h3>
      {children}
    </div>
  );
}

/**
 * Individual setting row with toggle switch
 */
function SettingToggle({
  label,
  description,
  checked,
  onCheckedChange,
  disabled = false,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="space-y-0.5">
        <Label
          className={`text-sm font-medium ${disabled ? "text-muted-foreground" : ""}`}
        >
          {label}
        </Label>
        {description && (
          <p className="text-muted-foreground text-xs">{description}</p>
        )}
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
      />
    </div>
  );
}

/**
 * Behavior settings tab content
 */
function SettingsBehaviorContent({
  behavior,
  updateBehavior,
}: {
  behavior: BehaviorSettings;
  updateBehavior: <K extends keyof BehaviorSettings>(
    key: K,
    value: BehaviorSettings[K],
  ) => void;
}) {
  return (
    <div className="space-y-6">
      <SettingsSection title="Mode">
        <SettingToggle
          label="100% Human Mode"
          description="Skip AI generation, write comments manually"
          checked={behavior.humanOnlyMode}
          onCheckedChange={(v) => updateBehavior("humanOnlyMode", v)}
        />
      </SettingsSection>

      <SettingsSection title="Auto-Engage">
        <div className="space-y-4">
          <SettingToggle
            label="Auto-Open on Comment Click"
            description="Trigger generation when clicking LinkedIn's comment button"
            checked={behavior.autoEngageOnCommentClick}
            onCheckedChange={(v) => updateBehavior("autoEngageOnCommentClick", v)}
          />
          <SettingToggle
            label="Spacebar Engage"
            description="Highlight most visible post and trigger on spacebar"
            checked={behavior.spacebarAutoEngage}
            onCheckedChange={(v) => updateBehavior("spacebarAutoEngage", v)}
          />
        </div>
      </SettingsSection>

      <SettingsSection title="UI">
        <SettingToggle
          label="Post Navigator"
          description="Show floating navigator for quick scrolling"
          checked={behavior.postNavigator}
          onCheckedChange={(v) => updateBehavior("postNavigator", v)}
        />
      </SettingsSection>
    </div>
  );
}

/**
 * Filters settings tab content
 */
function SettingsFiltersContent({
  postLoad,
  updatePostLoad,
}: {
  postLoad: PostLoadSettings;
  updatePostLoad: <K extends keyof PostLoadSettings>(
    key: K,
    value: PostLoadSettings[K],
  ) => void;
}) {
  return (
    <div className="space-y-6">
      <SettingsSection title="Target List">
        <SettingToggle
          label="Use Target List"
          description="Only engage with people on your target list"
          checked={postLoad.targetListEnabled}
          onCheckedChange={(v) => {
            updatePostLoad("targetListEnabled", v);
            // Clear selection when disabling
            if (!v) {
              updatePostLoad("selectedTargetListId", null);
            }
          }}
        />
        <div className="mt-2">
          <TargetListSelector />
        </div>
      </SettingsSection>

      <SettingsSection title="Blacklist (Coming Soon)">
        <SettingToggle
          label="Skip Blacklist"
          description="Never engage with people on your blacklist"
          checked={false}
          onCheckedChange={() => {}}
          disabled
        />
      </SettingsSection>

      <SettingsSection title="Time Filter">
        <SettingToggle
          label="Filter by Post Age"
          description="Skip posts older than specified hours"
          checked={postLoad.timeFilterEnabled}
          onCheckedChange={(v) => {
            updatePostLoad("timeFilterEnabled", v);
            // Auto-set default value when enabling
            if (v && postLoad.minPostAge === null) {
              updatePostLoad("minPostAge", 24);
            }
          }}
        />
        {postLoad.timeFilterEnabled && (
          <div className="ml-0 mt-2 flex items-center gap-2">
            <Label className="text-xs">Max age:</Label>
            <input
              type="number"
              min="1"
              max="168"
              value={postLoad.minPostAge ?? 24}
              onChange={(e) =>
                updatePostLoad("minPostAge", parseInt(e.target.value) || null)
              }
              className="border-input bg-background h-8 w-16 rounded-md border px-2 text-sm"
            />
            <span className="text-muted-foreground text-xs">hours</span>
          </div>
        )}
      </SettingsSection>

      <SettingsSection title="Skip Posts">
        <div className="space-y-4">
          <SettingToggle
            label="Skip Promoted Posts"
            description="Skip sponsored/promoted content"
            checked={postLoad.skipPromotedPostsEnabled}
            onCheckedChange={(v) => updatePostLoad("skipPromotedPostsEnabled", v)}
          />
          <SettingToggle
            label="Skip Company Pages"
            description="Skip posts from company/showcase pages"
            checked={postLoad.skipCompanyPagesEnabled}
            onCheckedChange={(v) => updatePostLoad("skipCompanyPagesEnabled", v)}
          />
          <SettingToggle
            label="Skip Friend Activities"
            description='Skip "X liked this" or "X commented" posts'
            checked={postLoad.skipFriendActivitiesEnabled}
            onCheckedChange={(v) =>
              updatePostLoad("skipFriendActivitiesEnabled", v)
            }
          />
        </div>
      </SettingsSection>

      <SettingsSection title="Connection Degree">
        <div className="space-y-4">
          <SettingToggle
            label="Skip 1st Degree"
            description="Skip posts from direct connections"
            checked={postLoad.skipFirstDegree}
            onCheckedChange={(v) => updatePostLoad("skipFirstDegree", v)}
          />
          <SettingToggle
            label="Skip 2nd Degree"
            description="Skip posts from connections of connections"
            checked={postLoad.skipSecondDegree}
            onCheckedChange={(v) => updatePostLoad("skipSecondDegree", v)}
          />
          <SettingToggle
            label="Skip 3rd+ Degree"
            description="Skip posts from distant connections"
            checked={postLoad.skipThirdDegree}
            onCheckedChange={(v) => updatePostLoad("skipThirdDegree", v)}
          />
          <SettingToggle
            label="Skip Following"
            description="Skip posts from people you follow but aren't connected to"
            checked={postLoad.skipFollowing}
            onCheckedChange={(v) => updatePostLoad("skipFollowing", v)}
          />
        </div>
      </SettingsSection>
    </div>
  );
}

/**
 * Submit settings tab content
 */
function SettingsSubmitContent({
  submitComment,
  updateSubmitComment,
}: {
  submitComment: SubmitCommentSettings;
  updateSubmitComment: <K extends keyof SubmitCommentSettings>(
    key: K,
    value: SubmitCommentSettings[K],
  ) => void;
}) {
  // Parse delay range for inputs
  const [minDelay, maxDelay] = submitComment.submitDelayRange
    .split("-")
    .map(Number);

  const updateDelayRange = (min: number, max: number) => {
    updateSubmitComment("submitDelayRange", `${min}-${max}`);
  };

  return (
    <div className="space-y-6">
      <SettingsSection title="Delay Between Submissions">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Label className="text-xs">Min:</Label>
            <input
              type="number"
              min="1"
              max="60"
              value={minDelay}
              onChange={(e) =>
                updateDelayRange(parseInt(e.target.value) || 1, maxDelay ?? 20)
              }
              className="border-input bg-background h-8 w-14 rounded-md border px-2 text-sm"
            />
          </div>
          <span className="text-muted-foreground">-</span>
          <div className="flex items-center gap-1">
            <Label className="text-xs">Max:</Label>
            <input
              type="number"
              min="1"
              max="120"
              value={maxDelay}
              onChange={(e) =>
                updateDelayRange(minDelay ?? 5, parseInt(e.target.value) || 20)
              }
              className="border-input bg-background h-8 w-14 rounded-md border px-2 text-sm"
            />
          </div>
          <span className="text-muted-foreground text-xs">seconds</span>
        </div>
      </SettingsSection>

      <SettingsSection title="Actions After Comment">
        <div className="space-y-4">
          <SettingToggle
            label="Like Post"
            description="Like the post after commenting"
            checked={submitComment.likePostEnabled}
            onCheckedChange={(v) => updateSubmitComment("likePostEnabled", v)}
          />
          <SettingToggle
            label="Like Own Comment"
            description="Like your comment after posting"
            checked={submitComment.likeCommentEnabled}
            onCheckedChange={(v) => updateSubmitComment("likeCommentEnabled", v)}
          />
          <SettingToggle
            label="Tag Post Author"
            description="Mention the author at the end of your comment"
            checked={submitComment.tagPostAuthorEnabled}
            onCheckedChange={(v) =>
              updateSubmitComment("tagPostAuthorEnabled", v)
            }
          />
        </div>
      </SettingsSection>

      <SettingsSection title="Attach Image">
        <SettingToggle
          label="Attach Random Image"
          description="Attach a random image from your library to comments"
          checked={submitComment.attachPictureEnabled}
          onCheckedChange={(v) =>
            updateSubmitComment("attachPictureEnabled", v)
          }
        />
        {submitComment.attachPictureEnabled && (
          <div className="mt-3">
            <SettingsImageManager />
          </div>
        )}
      </SettingsSection>
    </div>
  );
}

/**
 * AI settings tab content
 */
function SettingsAIContent({
  commentGenerate,
  updateCommentGenerate,
}: {
  commentGenerate: CommentGenerateSettings;
  updateCommentGenerate: <K extends keyof CommentGenerateSettings>(
    key: K,
    value: CommentGenerateSettings[K],
  ) => void;
}) {
  return (
    <div className="space-y-6">
      <SettingsSection title="Comment Style (Coming Soon)">
        <div className="space-y-4">
          <SettingToggle
            label="Dynamic Style Selection"
            description="Let AI choose the best style for each post"
            checked={false}
            onCheckedChange={() => {}}
            disabled
          />
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <Label className="text-muted-foreground text-sm font-medium">
                Default Style
              </Label>
              <p className="text-muted-foreground text-xs">
                Select a comment style to use
              </p>
            </div>
            <select
              disabled
              className="border-input bg-background text-muted-foreground h-8 rounded-md border px-2 text-sm opacity-50"
            >
              <option>No styles available</option>
            </select>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection title="Context">
        <SettingToggle
          label="Include Adjacent Comments"
          description="Use existing comments on the post as context for AI generation"
          checked={commentGenerate.adjacentCommentsEnabled}
          onCheckedChange={(v) =>
            updateCommentGenerate("adjacentCommentsEnabled", v)
          }
        />
      </SettingsSection>
    </div>
  );
}
