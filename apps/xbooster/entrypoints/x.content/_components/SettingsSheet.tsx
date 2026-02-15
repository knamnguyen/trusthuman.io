import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { RotateCcw, Settings, X } from "lucide-react";

import { Button } from "@sassy/ui/button";
import { Label } from "@sassy/ui/label";
import { ScrollArea } from "@sassy/ui/scroll-area";

import { useSettingsStore, type XBoosterSettings } from "../stores/settings-store";
import { useEngageSettingsStore, type EngageSettings } from "../engage-tab/stores/engage-settings-store";
import { SIDEBAR_TABS, useSidebarStore } from "../stores/sidebar-store";
import { SourceInput } from "../engage-tab/SourceInput";
import { DEFAULT_REPLY_PROMPT } from "../utils/ai-reply";

interface SettingsSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsSheet({ isOpen, onClose }: SettingsSheetProps) {
  const selectedTab = useSidebarStore((s) => s.selectedTab);

  const { settings, isLoaded, loadSettings, updateSettings, resetSettings } =
    useSettingsStore();

  const {
    settings: engageSettings,
    isLoaded: engageIsLoaded,
    loadSettings: loadEngageSettings,
    updateSettings: updateEngageSettings,
    resetSettings: resetEngageSettings,
  } = useEngageSettingsStore();

  useEffect(() => {
    if (isOpen && !isLoaded) {
      loadSettings();
    }
  }, [isOpen, isLoaded, loadSettings]);

  useEffect(() => {
    if (isOpen && !engageIsLoaded) {
      loadEngageSettings();
    }
  }, [isOpen, engageIsLoaded, loadEngageSettings]);

  const handleReset = () => {
    if (selectedTab === SIDEBAR_TABS.MENTIONS) {
      resetSettings();
    } else {
      resetEngageSettings();
    }
  };

  const isMentions = selectedTab === SIDEBAR_TABS.MENTIONS;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="pointer-events-auto flex h-full w-[380px] flex-col border-l bg-background"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <h2 className="text-sm font-semibold">
                {isMentions ? "Mentions" : "Engage"} Settings
              </h2>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleReset}
                title="Reset to defaults"
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="space-y-6 p-4">
              {isMentions ? (
                <MentionsSettings
                  settings={settings}
                  updateSettings={updateSettings}
                />
              ) : (
                <EngageSettingsPanel
                  settings={engageSettings}
                  updateSettings={updateEngageSettings}
                />
              )}
            </div>
          </ScrollArea>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Mentions Settings ───────────────────────────────────────────────────────

function MentionsSettings({
  settings,
  updateSettings,
}: {
  settings: XBoosterSettings;
  updateSettings: (partial: Partial<XBoosterSettings>) => Promise<void>;
}) {
  return (
    <>
      {/* Fetch Interval */}
      <SettingsSection title="Fetch Interval">
        <p className="text-xs text-muted-foreground">
          How often to check for new mentions (minutes)
        </p>
        <div className="mt-2 flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Label className="text-xs">Min:</Label>
            <input
              type="number"
              min="0"
              max="240"
              step="0.1"
              value={settings.fetchIntervalMin}
              onChange={(e) =>
                updateSettings({
                  fetchIntervalMin: parseFloat(e.target.value) || 0,
                })
              }
              className="h-8 w-16 rounded-md border border-input bg-background px-2 text-sm"
            />
          </div>
          <span className="text-muted-foreground">-</span>
          <div className="flex items-center gap-1">
            <Label className="text-xs">Max:</Label>
            <input
              type="number"
              min="0"
              max="240"
              step="0.1"
              value={settings.fetchIntervalMax}
              onChange={(e) =>
                updateSettings({
                  fetchIntervalMax: parseFloat(e.target.value) || 0,
                })
              }
              className="h-8 w-16 rounded-md border border-input bg-background px-2 text-sm"
            />
          </div>
          <span className="text-xs text-muted-foreground">min</span>
        </div>
      </SettingsSection>

      {/* Send Delay */}
      <SettingsSection title="Send Delay">
        <p className="text-xs text-muted-foreground">
          Random delay between sending replies (minutes)
        </p>
        <div className="mt-2 flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Label className="text-xs">Min:</Label>
            <input
              type="number"
              min="0"
              max="30"
              step="0.1"
              value={settings.sendDelayMin}
              onChange={(e) =>
                updateSettings({
                  sendDelayMin: parseFloat(e.target.value) || 0,
                })
              }
              className="h-8 w-16 rounded-md border border-input bg-background px-2 text-sm"
            />
          </div>
          <span className="text-muted-foreground">-</span>
          <div className="flex items-center gap-1">
            <Label className="text-xs">Max:</Label>
            <input
              type="number"
              min="0"
              max="30"
              step="0.1"
              value={settings.sendDelayMax}
              onChange={(e) =>
                updateSettings({
                  sendDelayMax: parseFloat(e.target.value) || 0,
                })
              }
              className="h-8 w-16 rounded-md border border-input bg-background px-2 text-sm"
            />
          </div>
          <span className="text-xs text-muted-foreground">min</span>
        </div>
      </SettingsSection>

      {/* Fetch Count */}
      <SettingsSection title="Target Tweets">
        <p className="text-xs text-muted-foreground">
          Target number of filtered tweets to process per fetch
        </p>
        <div className="mt-2 flex items-center gap-2">
          <input
            type="number"
            min="10"
            max="100"
            value={settings.fetchCount}
            onChange={(e) =>
              updateSettings({
                fetchCount: parseInt(e.target.value) || 40,
              })
            }
            className="h-8 w-16 rounded-md border border-input bg-background px-2 text-sm"
          />
          <span className="text-xs text-muted-foreground">tweets</span>
        </div>
      </SettingsSection>

      {/* Max Sends Per Cycle */}
      <SettingsSection title="Max Sends Per Cycle">
        <p className="text-xs text-muted-foreground">
          Cap replies sent per auto-run cycle (prevents burst)
        </p>
        <div className="mt-2 flex items-center gap-2">
          <input
            type="number"
            min="1"
            max="50"
            value={settings.maxSendsPerCycle}
            onChange={(e) =>
              updateSettings({
                maxSendsPerCycle: parseInt(e.target.value) || 10,
              })
            }
            className="h-8 w-16 rounded-md border border-input bg-background px-2 text-sm"
          />
          <span className="text-xs text-muted-foreground">replies</span>
        </div>
      </SettingsSection>

      {/* Reply Length */}
      <SettingsSection title="Reply Length">
        <p className="text-xs text-muted-foreground">
          Word count range for AI-generated replies
        </p>
        <div className="mt-2 flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Label className="text-xs">Min:</Label>
            <input
              type="number"
              min="1"
              max="200"
              value={settings.maxWordsMin}
              onChange={(e) =>
                updateSettings({
                  maxWordsMin: parseInt(e.target.value) || 5,
                })
              }
              className="h-8 w-16 rounded-md border border-input bg-background px-2 text-sm"
            />
          </div>
          <span className="text-muted-foreground">-</span>
          <div className="flex items-center gap-1">
            <Label className="text-xs">Max:</Label>
            <input
              type="number"
              min="1"
              max="200"
              value={settings.maxWordsMax}
              onChange={(e) =>
                updateSettings({
                  maxWordsMax: parseInt(e.target.value) || 15,
                })
              }
              className="h-8 w-16 rounded-md border border-input bg-background px-2 text-sm"
            />
          </div>
          <span className="text-xs text-muted-foreground">words</span>
        </div>
      </SettingsSection>

      {/* Max Mention Age */}
      <SettingsSection title="Max Mention Age">
        <p className="text-xs text-muted-foreground">
          Only reply to mentions newer than this (skip older ones)
        </p>
        <div className="mt-2 flex items-center gap-2">
          <input
            type="number"
            min="1"
            max="10080"
            step="0.1"
            value={settings.maxMentionAgeMinutes}
            onChange={(e) =>
              updateSettings({
                maxMentionAgeMinutes: parseFloat(e.target.value) || 1440,
              })
            }
            className="h-8 w-20 rounded-md border border-input bg-background px-2 text-sm"
          />
          <span className="text-xs text-muted-foreground">min</span>
        </div>
      </SettingsSection>

      {/* Fail Pause */}
      <SettingsSection title="Fail Pause">
        <p className="text-xs text-muted-foreground">
          Pause duration after 3 consecutive send failures
        </p>
        <div className="mt-2 flex items-center gap-2">
          <input
            type="number"
            min="0"
            max="1440"
            step="0.1"
            value={settings.failPauseMinutes}
            onChange={(e) =>
              updateSettings({
                failPauseMinutes: parseFloat(e.target.value) || 0,
              })
            }
            className="h-8 w-16 rounded-md border border-input bg-background px-2 text-sm"
          />
          <span className="text-xs text-muted-foreground">min</span>
        </div>
      </SettingsSection>

      {/* Filtering */}
      <SettingsSection title="Filtering">
        <label className="mt-1 flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.skipMentionsWithReplies}
            onChange={(e) =>
              updateSettings({
                skipMentionsWithReplies: e.target.checked,
              })
            }
            className="h-4 w-4 rounded border-input"
          />
          <span className="text-xs">
            Skip mentions that already have replies
          </span>
        </label>
        <label className="mt-1 flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.skipNoCaption}
            onChange={(e) =>
              updateSettings({
                skipNoCaption: e.target.checked,
              })
            }
            className="h-4 w-4 rounded border-input"
          />
          <span className="text-xs">
            Skip tweets with no caption (image/link only)
          </span>
        </label>
      </SettingsSection>

      {/* Tweet Confirmation */}
      <SettingsSection title="Tweet Confirmation">
        <p className="text-xs text-muted-foreground">
          Navigate to posted tweet after sending to confirm X processed it
        </p>
        <label className="mt-2 flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.confirmTweetByNavigation}
            onChange={(e) =>
              updateSettings({
                confirmTweetByNavigation: e.target.checked,
              })
            }
            className="h-4 w-4 rounded border-input"
          />
          <span className="text-xs">
            Click posted tweet to verify
          </span>
        </label>
        {settings.confirmTweetByNavigation && (
          <div className="mt-2 flex items-center gap-2">
            <Label className="text-xs">Wait:</Label>
            <input
              type="number"
              min="1"
              max="30"
              step="1"
              value={settings.confirmWaitSeconds}
              onChange={(e) =>
                updateSettings({
                  confirmWaitSeconds: parseInt(e.target.value) || 3,
                })
              }
              className="h-8 w-16 rounded-md border border-input bg-background px-2 text-sm"
            />
            <span className="text-xs text-muted-foreground">sec</span>
          </div>
        )}
      </SettingsSection>

      {/* Auto-Prune */}
      <SettingsSection title="History Cleanup">
        <p className="text-xs text-muted-foreground">
          Auto-remove already-replied entries older than
        </p>
        <div className="mt-2 flex items-center gap-2">
          <input
            type="number"
            min="1"
            max="365"
            value={settings.repliedRetentionDays}
            onChange={(e) =>
              updateSettings({
                repliedRetentionDays: parseInt(e.target.value) || 30,
              })
            }
            className="h-8 w-16 rounded-md border border-input bg-background px-2 text-sm"
          />
          <span className="text-xs text-muted-foreground">days</span>
        </div>
      </SettingsSection>

      {/* Custom Prompt */}
      <SettingsSection title="Custom Prompt">
        <p className="text-xs text-muted-foreground">
          Override the default AI system prompt. Leave empty to use
          default.
        </p>
        <textarea
          className="mt-2 min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-xs leading-relaxed placeholder:text-muted-foreground"
          placeholder={DEFAULT_REPLY_PROMPT}
          value={settings.customPrompt}
          onChange={(e) =>
            updateSettings({ customPrompt: e.target.value })
          }
        />
        {settings.customPrompt && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-1 h-6 text-xs"
            onClick={() => updateSettings({ customPrompt: "" })}
          >
            Reset to default prompt
          </Button>
        )}
      </SettingsSection>
    </>
  );
}

// ─── Engage Settings ─────────────────────────────────────────────────────────

function EngageSettingsPanel({
  settings,
  updateSettings,
}: {
  settings: EngageSettings;
  updateSettings: (partial: Partial<EngageSettings>) => Promise<void>;
}) {
  return (
    <>
      {/* Sources */}
      <SettingsSection title="Sources">
        <p className="text-xs text-muted-foreground">
          X list or community URLs to fetch tweets from
        </p>
        <div className="mt-2">
          <SourceInput />
        </div>
      </SettingsSection>

      {/* Cycle Interval */}
      <SettingsSection title="Cycle Interval">
        <p className="text-xs text-muted-foreground">
          Wait between full source rotations (minutes)
        </p>
        <div className="mt-2 flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Label className="text-xs">Min:</Label>
            <input
              type="number"
              min="0"
              max="240"
              step="0.1"
              value={settings.fetchIntervalMin}
              onChange={(e) =>
                updateSettings({
                  fetchIntervalMin: parseFloat(e.target.value) || 0,
                })
              }
              className="h-8 w-16 rounded-md border border-input bg-background px-2 text-sm"
            />
          </div>
          <span className="text-muted-foreground">-</span>
          <div className="flex items-center gap-1">
            <Label className="text-xs">Max:</Label>
            <input
              type="number"
              min="0"
              max="240"
              step="0.1"
              value={settings.fetchIntervalMax}
              onChange={(e) =>
                updateSettings({
                  fetchIntervalMax: parseFloat(e.target.value) || 0,
                })
              }
              className="h-8 w-16 rounded-md border border-input bg-background px-2 text-sm"
            />
          </div>
          <span className="text-xs text-muted-foreground">min</span>
        </div>
      </SettingsSection>

      {/* Source Delay */}
      <SettingsSection title="Source Delay">
        <p className="text-xs text-muted-foreground">
          Wait between processing each source (minutes)
        </p>
        <div className="mt-2 flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Label className="text-xs">Min:</Label>
            <input
              type="number"
              min="0"
              max="60"
              step="0.1"
              value={settings.sourceDelayMin}
              onChange={(e) =>
                updateSettings({
                  sourceDelayMin: parseFloat(e.target.value) || 0,
                })
              }
              className="h-8 w-16 rounded-md border border-input bg-background px-2 text-sm"
            />
          </div>
          <span className="text-muted-foreground">-</span>
          <div className="flex items-center gap-1">
            <Label className="text-xs">Max:</Label>
            <input
              type="number"
              min="0"
              max="60"
              step="0.1"
              value={settings.sourceDelayMax}
              onChange={(e) =>
                updateSettings({
                  sourceDelayMax: parseFloat(e.target.value) || 0,
                })
              }
              className="h-8 w-16 rounded-md border border-input bg-background px-2 text-sm"
            />
          </div>
          <span className="text-xs text-muted-foreground">min</span>
        </div>
      </SettingsSection>

      {/* Send Delay */}
      <SettingsSection title="Send Delay">
        <p className="text-xs text-muted-foreground">
          Random delay between sending replies within a source (minutes)
        </p>
        <div className="mt-2 flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Label className="text-xs">Min:</Label>
            <input
              type="number"
              min="0"
              max="30"
              step="0.1"
              value={settings.sendDelayMin}
              onChange={(e) =>
                updateSettings({
                  sendDelayMin: parseFloat(e.target.value) || 0,
                })
              }
              className="h-8 w-16 rounded-md border border-input bg-background px-2 text-sm"
            />
          </div>
          <span className="text-muted-foreground">-</span>
          <div className="flex items-center gap-1">
            <Label className="text-xs">Max:</Label>
            <input
              type="number"
              min="0"
              max="30"
              step="0.1"
              value={settings.sendDelayMax}
              onChange={(e) =>
                updateSettings({
                  sendDelayMax: parseFloat(e.target.value) || 0,
                })
              }
              className="h-8 w-16 rounded-md border border-input bg-background px-2 text-sm"
            />
          </div>
          <span className="text-xs text-muted-foreground">min</span>
        </div>
      </SettingsSection>

      {/* Tweets Per Fetch */}
      <SettingsSection title="Target Tweets">
        <p className="text-xs text-muted-foreground">
          Target number of filtered tweets to process per source
        </p>
        <div className="mt-2 flex items-center gap-2">
          <input
            type="number"
            min="5"
            max="200"
            value={settings.fetchCount}
            onChange={(e) =>
              updateSettings({
                fetchCount: parseInt(e.target.value) || 100,
              })
            }
            className="h-8 w-16 rounded-md border border-input bg-background px-2 text-sm"
          />
          <span className="text-xs text-muted-foreground">tweets</span>
        </div>
      </SettingsSection>

      {/* Max Sends Per Source */}
      <SettingsSection title="Max Sends Per Source">
        <p className="text-xs text-muted-foreground">
          Cap replies sent per source before moving to next
        </p>
        <div className="mt-2 flex items-center gap-2">
          <input
            type="number"
            min="1"
            max="50"
            value={settings.maxSendsPerSource}
            onChange={(e) =>
              updateSettings({
                maxSendsPerSource: parseInt(e.target.value) || 3,
              })
            }
            className="h-8 w-16 rounded-md border border-input bg-background px-2 text-sm"
          />
          <span className="text-xs text-muted-foreground">replies</span>
        </div>
      </SettingsSection>

      {/* Reply Length */}
      <SettingsSection title="Reply Length">
        <p className="text-xs text-muted-foreground">
          Word count range for AI-generated replies
        </p>
        <div className="mt-2 flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Label className="text-xs">Min:</Label>
            <input
              type="number"
              min="1"
              max="200"
              value={settings.maxWordsMin}
              onChange={(e) =>
                updateSettings({
                  maxWordsMin: parseInt(e.target.value) || 5,
                })
              }
              className="h-8 w-16 rounded-md border border-input bg-background px-2 text-sm"
            />
          </div>
          <span className="text-muted-foreground">-</span>
          <div className="flex items-center gap-1">
            <Label className="text-xs">Max:</Label>
            <input
              type="number"
              min="1"
              max="200"
              value={settings.maxWordsMax}
              onChange={(e) =>
                updateSettings({
                  maxWordsMax: parseInt(e.target.value) || 20,
                })
              }
              className="h-8 w-16 rounded-md border border-input bg-background px-2 text-sm"
            />
          </div>
          <span className="text-xs text-muted-foreground">words</span>
        </div>
      </SettingsSection>

      {/* Max Tweet Age */}
      <SettingsSection title="Max Tweet Age">
        <p className="text-xs text-muted-foreground">
          Only engage with tweets newer than this (skip older ones)
        </p>
        <div className="mt-2 flex items-center gap-2">
          <input
            type="number"
            min="1"
            max="10080"
            step="0.1"
            value={settings.maxTweetAgeMinutes}
            onChange={(e) =>
              updateSettings({
                maxTweetAgeMinutes: parseFloat(e.target.value) || 1440,
              })
            }
            className="h-8 w-20 rounded-md border border-input bg-background px-2 text-sm"
          />
          <span className="text-xs text-muted-foreground">min</span>
        </div>
      </SettingsSection>

      {/* Fail Pause */}
      <SettingsSection title="Fail Pause">
        <p className="text-xs text-muted-foreground">
          Pause duration after 3 consecutive send failures
        </p>
        <div className="mt-2 flex items-center gap-2">
          <input
            type="number"
            min="0"
            max="1440"
            step="0.1"
            value={settings.failPauseMinutes}
            onChange={(e) =>
              updateSettings({
                failPauseMinutes: parseFloat(e.target.value) || 0,
              })
            }
            className="h-8 w-16 rounded-md border border-input bg-background px-2 text-sm"
          />
          <span className="text-xs text-muted-foreground">min</span>
        </div>
      </SettingsSection>

      {/* Filtering */}
      <SettingsSection title="Filtering">
        <label className="mt-1 flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.skipTweetsWithReplies}
            onChange={(e) =>
              updateSettings({
                skipTweetsWithReplies: e.target.checked,
              })
            }
            className="h-4 w-4 rounded border-input"
          />
          <span className="text-xs">
            Skip tweets that already have replies
          </span>
        </label>
        <label className="mt-1 flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.skipNoCaption}
            onChange={(e) =>
              updateSettings({
                skipNoCaption: e.target.checked,
              })
            }
            className="h-4 w-4 rounded border-input"
          />
          <span className="text-xs">
            Skip tweets with no caption (image/link only)
          </span>
        </label>
      </SettingsSection>

      {/* Tweet Confirmation */}
      <SettingsSection title="Tweet Confirmation">
        <p className="text-xs text-muted-foreground">
          Navigate to posted tweet after sending to confirm X processed it
        </p>
        <label className="mt-2 flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.confirmTweetByNavigation}
            onChange={(e) =>
              updateSettings({
                confirmTweetByNavigation: e.target.checked,
              })
            }
            className="h-4 w-4 rounded border-input"
          />
          <span className="text-xs">
            Click posted tweet to verify
          </span>
        </label>
        {settings.confirmTweetByNavigation && (
          <div className="mt-2 flex items-center gap-2">
            <Label className="text-xs">Wait:</Label>
            <input
              type="number"
              min="1"
              max="30"
              step="1"
              value={settings.confirmWaitSeconds}
              onChange={(e) =>
                updateSettings({
                  confirmWaitSeconds: parseInt(e.target.value) || 3,
                })
              }
              className="h-8 w-16 rounded-md border border-input bg-background px-2 text-sm"
            />
            <span className="text-xs text-muted-foreground">sec</span>
          </div>
        )}
      </SettingsSection>

      {/* History Cleanup */}
      <SettingsSection title="History Cleanup">
        <p className="text-xs text-muted-foreground">
          Auto-remove already-replied entries older than
        </p>
        <div className="mt-2 flex items-center gap-2">
          <input
            type="number"
            min="1"
            max="365"
            value={settings.repliedRetentionDays}
            onChange={(e) =>
              updateSettings({
                repliedRetentionDays: parseInt(e.target.value) || 30,
              })
            }
            className="h-8 w-16 rounded-md border border-input bg-background px-2 text-sm"
          />
          <span className="text-xs text-muted-foreground">days</span>
        </div>
      </SettingsSection>

      {/* Custom Prompt */}
      <SettingsSection title="Custom Prompt">
        <p className="text-xs text-muted-foreground">
          Override the default engage AI prompt. Leave empty to use
          default.
        </p>
        <textarea
          className="mt-2 min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-xs leading-relaxed placeholder:text-muted-foreground"
          placeholder="Leave empty to use default engage prompt..."
          value={settings.customPrompt}
          onChange={(e) =>
            updateSettings({ customPrompt: e.target.value })
          }
        />
        {settings.customPrompt && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-1 h-6 text-xs"
            onClick={() =>
              updateSettings({ customPrompt: "" })
            }
          >
            Reset to default prompt
          </Button>
        )}
      </SettingsSection>
    </>
  );
}

// ─── Shared ──────────────────────────────────────────────────────────────────

function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      {children}
    </div>
  );
}
