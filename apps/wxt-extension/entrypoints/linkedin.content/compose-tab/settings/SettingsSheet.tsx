import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Brain, Cog, ExternalLink, Filter, Send, Settings, X } from "lucide-react";

import { Button } from "@sassy/ui/button";
import { ExpandableTabs } from "@sassy/ui/expandable-tabs";
import { ScrollArea } from "@sassy/ui/scroll-area";

import { useAuthStore } from "../../../../lib/auth-store";
import { getWebAppDomain } from "../../../../lib/get-sync-host-url";
import { useTRPC } from "../../../../lib/trpc/client";
import { useAccountStore } from "../../stores/account-store";
import { useSettingsDBStore } from "../../stores/settings-db-store";
import { useSettingsLocalStore } from "../../stores/settings-local-store";

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

  // Get behavior settings from LOCAL store (not synced to DB)
  const behavior = useSettingsLocalStore((state) => state.behavior);
  const updateBehavior = useSettingsLocalStore((state) => state.updateBehavior);

  // Get DB-synced settings
  const postLoad = useSettingsDBStore((state) => state.postLoad);
  const submitComment = useSettingsDBStore((state) => state.submitComment);
  const commentGenerate = useSettingsDBStore((state) => state.commentGenerate);
  const isDBLoaded = useSettingsDBStore((state) => state.isLoaded);

  // Get update actions for DB settings
  const updatePostLoad = useSettingsDBStore((state) => state.updatePostLoad);
  const updateSubmitComment = useSettingsDBStore(
    (state) => state.updateSubmitComment,
  );
  const updateCommentGenerate = useSettingsDBStore(
    (state) => state.updateCommentGenerate,
  );

  // Get account data for quick links
  const authOrganization = useAuthStore((state) => state.organization);
  const matchingAccount = useAccountStore((state) => state.matchingAccount);

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
                  isLoaded={isDBLoaded}
                  orgSlug={authOrganization?.slug}
                  accountSlug={matchingAccount?.profileSlug}
                />
              )}
              {selectedTab === 2 && (
                <SettingsSubmitContent
                  submitComment={submitComment}
                  updateSubmitComment={updateSubmitComment}
                  isLoaded={isDBLoaded}
                  orgSlug={authOrganization?.slug}
                  accountSlug={matchingAccount?.profileSlug}
                />
              )}
              {selectedTab === 3 && (
                <SettingsAIContent
                  commentGenerate={commentGenerate}
                  updateCommentGenerate={updateCommentGenerate}
                  isLoaded={isDBLoaded}
                  orgSlug={authOrganization?.slug}
                  accountSlug={matchingAccount?.profileSlug}
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

import type { BehaviorSettings } from "../../stores/settings-local-store";
import type {
  CommentGenerateSettingDB,
  PostLoadSettingDB,
  SubmitCommentSettingDB,
} from "../../stores/settings-db-store";

import { Label } from "@sassy/ui/label";
import { Switch } from "@sassy/ui/switch";

import { BlacklistSelector } from "./BlacklistSelector";
import { CommentStyleSelector } from "./CommentStyleSelector";
import { SettingsImageManager } from "./SettingsImageManager";
import { TargetListSelector } from "./TargetListSelector";

/**
 * Section header component for organizing settings
 */
function SettingsSection({
  title,
  children,
  quickLink,
  quickLinkLabel,
}: {
  title: string;
  children: React.ReactNode;
  quickLink?: string;
  quickLinkLabel?: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
          {title}
        </h3>
        {quickLink && quickLinkLabel && (
          <a
            href={quickLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary/80 transition-colors flex items-center gap-1.5 text-xs font-medium"
            title="Open in dashboard"
          >
            {quickLinkLabel}
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
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

      <SettingsSection title="Auto-Submit">
        <SettingToggle
          label="Auto-Submit After Generate"
          description="Automatically submit all comments after batch generation completes"
          checked={behavior.autoSubmitAfterGenerate}
          onCheckedChange={(v) => updateBehavior("autoSubmitAfterGenerate", v)}
        />
      </SettingsSection>
    </div>
  );
}

// Default values for PostLoadSetting (matches Prisma schema defaults)
const DEFAULT_POST_LOAD: Omit<PostLoadSettingDB, "accountId" | "createdAt" | "updatedAt"> = {
  targetListEnabled: false,
  targetListIds: [],
  timeFilterEnabled: false,
  minPostAge: null,
  skipFriendActivitiesEnabled: false,
  skipCompanyPagesEnabled: true,
  skipPromotedPostsEnabled: true,
  skipBlacklistEnabled: false,
  blacklistId: null,
  skipFirstDegree: false,
  skipSecondDegree: false,
  skipThirdDegree: false,
  skipFollowing: false,
  skipCommentsLoading: false,
};

/**
 * Filters settings tab content
 */
function SettingsFiltersContent({
  postLoad,
  updatePostLoad,
  isLoaded,
  orgSlug,
  accountSlug,
}: {
  postLoad: PostLoadSettingDB | null;
  updatePostLoad: (
    data: Partial<Omit<PostLoadSettingDB, "accountId" | "createdAt" | "updatedAt">>
  ) => Promise<void>;
  isLoaded: boolean;
  orgSlug: string | null | undefined;
  accountSlug: string | null | undefined;
}) {
  // Show loading only if fetch hasn't completed
  if (!isLoaded) {
    return (
      <div className="text-muted-foreground text-center text-sm py-4">
        Loading settings...
      </div>
    );
  }

  // Use saved settings or defaults (null means no settings saved yet)
  const settings = postLoad ?? DEFAULT_POST_LOAD as PostLoadSettingDB;

  // Build quick links
  const targetListLink = orgSlug && accountSlug
    ? `${getWebAppDomain()}/${orgSlug}/${accountSlug}/target-list`
    : undefined;

  return (
    <div className="space-y-6">
      <SettingsSection
        title="Target List"
        quickLink={targetListLink}
        quickLinkLabel="Manage Target Lists"
      >
        <SettingToggle
          label="Use Target List"
          description="Only engage with people on your target list"
          checked={settings.targetListEnabled}
          onCheckedChange={(v) => {
            // Only update the enabled flag - preserve selection for when user re-enables
            void updatePostLoad({ targetListEnabled: v });
          }}
        />
        <div className="mt-2">
          <TargetListSelector />
        </div>
      </SettingsSection>

      <SettingsSection title="Blacklist">
        <SettingToggle
          label="Skip Blacklist"
          description="Never engage with people on your blacklist"
          checked={settings.skipBlacklistEnabled}
          onCheckedChange={(v) => {
            // Only update the enabled flag - preserve selection for when user re-enables
            void updatePostLoad({ skipBlacklistEnabled: v });
          }}
        />
        <div className="mt-2">
          <BlacklistSelector />
        </div>
      </SettingsSection>

      <SettingsSection title="Time Filter">
        <SettingToggle
          label="Filter by Post Age"
          description="Skip posts older than specified hours"
          checked={settings.timeFilterEnabled}
          onCheckedChange={(v) => {
            void updatePostLoad({
              timeFilterEnabled: v,
              // Auto-set default value when enabling
              ...(v && settings.minPostAge === null ? { minPostAge: 24 } : {}),
            });
          }}
        />
        {settings.timeFilterEnabled && (
          <div className="ml-0 mt-2 flex items-center gap-2">
            <Label className="text-xs">Max age:</Label>
            <input
              type="number"
              min="1"
              max="168"
              value={settings.minPostAge ?? 24}
              onChange={(e) =>
                void updatePostLoad({
                  minPostAge: parseInt(e.target.value) || null,
                })
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
            checked={settings.skipPromotedPostsEnabled}
            onCheckedChange={(v) =>
              void updatePostLoad({ skipPromotedPostsEnabled: v })
            }
          />
          <SettingToggle
            label="Skip Company Pages"
            description="Skip posts from company/showcase pages"
            checked={settings.skipCompanyPagesEnabled}
            onCheckedChange={(v) =>
              void updatePostLoad({ skipCompanyPagesEnabled: v })
            }
          />
          <SettingToggle
            label="Skip Friend Activities"
            description='Skip "X liked this" or "X commented" posts'
            checked={settings.skipFriendActivitiesEnabled}
            onCheckedChange={(v) =>
              void updatePostLoad({ skipFriendActivitiesEnabled: v })
            }
          />
        </div>
      </SettingsSection>

      <SettingsSection title="Connection Degree">
        <div className="space-y-4">
          <SettingToggle
            label="Skip 1st Degree"
            description="Skip posts from direct connections"
            checked={settings.skipFirstDegree}
            onCheckedChange={(v) => void updatePostLoad({ skipFirstDegree: v })}
          />
          <SettingToggle
            label="Skip 2nd Degree"
            description="Skip posts from connections of connections"
            checked={settings.skipSecondDegree}
            onCheckedChange={(v) => void updatePostLoad({ skipSecondDegree: v })}
          />
          <SettingToggle
            label="Skip 3rd+ Degree"
            description="Skip posts from distant connections"
            checked={settings.skipThirdDegree}
            onCheckedChange={(v) => void updatePostLoad({ skipThirdDegree: v })}
          />
          <SettingToggle
            label="Skip Following"
            description="Skip posts from people you follow but aren't connected to"
            checked={settings.skipFollowing}
            onCheckedChange={(v) => void updatePostLoad({ skipFollowing: v })}
          />
        </div>
      </SettingsSection>

      <SettingsSection title="Performance">
        <SettingToggle
          label="Skip Loading Comments"
          description="50% faster post loading (AI uses caption only, no adjacent comments)"
          checked={settings.skipCommentsLoading}
          onCheckedChange={(v) =>
            void updatePostLoad({ skipCommentsLoading: v })
          }
        />
      </SettingsSection>
    </div>
  );
}

// Default values for SubmitCommentSetting (matches Prisma schema defaults)
const DEFAULT_SUBMIT_COMMENT: Omit<SubmitCommentSettingDB, "accountId" | "createdAt" | "updatedAt"> = {
  submitDelayRange: "5-20",
  likePostEnabled: false,
  likeCommentEnabled: false,
  tagPostAuthorEnabled: false,
  attachPictureEnabled: false,
  defaultPictureAttachUrl: null,
};

/**
 * Submit settings tab content
 */
function SettingsSubmitContent({
  submitComment,
  updateSubmitComment,
  isLoaded,
  orgSlug,
  accountSlug,
}: {
  submitComment: SubmitCommentSettingDB | null;
  updateSubmitComment: (
    data: Partial<Omit<SubmitCommentSettingDB, "accountId" | "createdAt" | "updatedAt">>
  ) => Promise<void>;
  isLoaded: boolean;
  orgSlug: string | null | undefined;
  accountSlug: string | null | undefined;
}) {
  // Show loading only if fetch hasn't completed
  if (!isLoaded) {
    return (
      <div className="text-muted-foreground text-center text-sm py-4">
        Loading settings...
      </div>
    );
  }

  // Use saved settings or defaults (null means no settings saved yet)
  const settings = submitComment ?? DEFAULT_SUBMIT_COMMENT as SubmitCommentSettingDB;

  // Parse delay range for inputs
  const [minDelay, maxDelay] = settings.submitDelayRange
    .split("-")
    .map(Number);

  const updateDelayRange = (min: number, max: number) => {
    void updateSubmitComment({ submitDelayRange: `${min}-${max}` });
  };

  // Build quick link to history
  const historyLink = orgSlug && accountSlug
    ? `${getWebAppDomain()}/${orgSlug}/${accountSlug}/history`
    : undefined;

  return (
    <div className="space-y-6">
      <SettingsSection
        title="Delay Between Submissions"
        quickLink={historyLink}
        quickLinkLabel="View Comment History"
      >
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
            checked={settings.likePostEnabled}
            onCheckedChange={(v) =>
              void updateSubmitComment({ likePostEnabled: v })
            }
          />
          <SettingToggle
            label="Like Own Comment"
            description="Like your comment after posting"
            checked={settings.likeCommentEnabled}
            onCheckedChange={(v) =>
              void updateSubmitComment({ likeCommentEnabled: v })
            }
          />
          <SettingToggle
            label="Tag Post Author"
            description="Mention the author at the end of your comment"
            checked={settings.tagPostAuthorEnabled}
            onCheckedChange={(v) =>
              void updateSubmitComment({ tagPostAuthorEnabled: v })
            }
          />
        </div>
      </SettingsSection>

      <SettingsSection title="Attach Image">
        <SettingToggle
          label="Attach Image"
          description="Attach your saved image to comments"
          checked={settings.attachPictureEnabled}
          onCheckedChange={(v) =>
            void updateSubmitComment({ attachPictureEnabled: v })
          }
        />
        {settings.attachPictureEnabled && (
          <div className="mt-3">
            <SettingsImageManager />
          </div>
        )}
      </SettingsSection>
    </div>
  );
}

// Default values for CommentGenerateSetting (matches Prisma schema defaults)
const DEFAULT_COMMENT_GENERATE: Omit<CommentGenerateSettingDB, "accountId" | "createdAt" | "updatedAt"> = {
  commentStyleId: null,
  dynamicChooseStyleEnabled: false,
  adjacentCommentsEnabled: false,
};

/**
 * AI settings tab content
 */
function SettingsAIContent({
  commentGenerate,
  updateCommentGenerate,
  isLoaded,
  orgSlug,
  accountSlug,
}: {
  commentGenerate: CommentGenerateSettingDB | null;
  updateCommentGenerate: (
    data: Partial<Omit<CommentGenerateSettingDB, "accountId" | "createdAt" | "updatedAt">>
  ) => Promise<void>;
  isLoaded: boolean;
  orgSlug: string | null | undefined;
  accountSlug: string | null | undefined;
}) {
  // Show loading only if fetch hasn't completed
  if (!isLoaded) {
    return (
      <div className="text-muted-foreground text-center text-sm py-4">
        Loading settings...
      </div>
    );
  }

  // Use saved settings or defaults (null means no settings saved yet)
  const settings = commentGenerate ?? DEFAULT_COMMENT_GENERATE as CommentGenerateSettingDB;

  // Build quick link to personas
  const personasLink = orgSlug && accountSlug
    ? `${getWebAppDomain()}/${orgSlug}/${accountSlug}/personas`
    : undefined;

  return (
    <div className="space-y-6">
      <SettingsSection
        title="Comment Style"
        quickLink={personasLink}
        quickLinkLabel="Manage Personas"
      >
        <div className="space-y-4">
          <SettingToggle
            label="Dynamic Style Selection"
            description="Let AI choose the best style for each post"
            checked={settings.dynamicChooseStyleEnabled}
            onCheckedChange={(v) =>
              void updateCommentGenerate({ dynamicChooseStyleEnabled: v })
            }
          />
          <div className="space-y-2">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Default Style</Label>
              <p className="text-muted-foreground text-xs">
                Select a comment style to use
              </p>
            </div>
            <CommentStyleSelector />
          </div>
        </div>
      </SettingsSection>

      <SettingsSection title="Context">
        <SettingToggle
          label="Include Adjacent Comments"
          description="Use existing comments on the post as context for AI generation"
          checked={settings.adjacentCommentsEnabled}
          onCheckedChange={(v) =>
            void updateCommentGenerate({ adjacentCommentsEnabled: v })
          }
        />
      </SettingsSection>
    </div>
  );
}
