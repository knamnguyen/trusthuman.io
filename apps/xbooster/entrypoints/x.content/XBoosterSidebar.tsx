import { useState } from "react";
import { AtSign, Crosshair, Settings, Zap } from "lucide-react";

import { Button } from "@sassy/ui/button";
import { ExpandableTabs } from "@sassy/ui/expandable-tabs";
import { SheetContent, SheetHeader, SheetTitle } from "@sassy/ui/sheet";

import { ToggleButton } from "./_components/ToggleButton";
import { SettingsSheet } from "./_components/SettingsSheet";
import { MentionsTab } from "./mentions-tab/MentionsTab";
import { EngageTab } from "./engage-tab/EngageTab";
import { useShadowRootStore } from "./stores/shadow-root-store";
import { SIDEBAR_TABS, useSidebarStore } from "./stores/sidebar-store";

interface XBoosterSidebarProps {
  onClose: () => void;
}

const tabs = [
  { title: "Mentions", icon: AtSign },
  { title: "Engage", icon: Crosshair },
];

export function XBoosterSidebar({ onClose }: XBoosterSidebarProps) {
  const shadowRoot = useShadowRootStore((s) => s.shadowRoot);
  const { selectedTab, setSelectedTab } = useSidebarStore();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <SheetContent
      side="right"
      className="z-[9999] w-[380px] min-w-[380px] gap-0"
      portalContainer={shadowRoot}
    >
      {/* Close button */}
      <div className="absolute top-1/2 left-0 -translate-x-full -translate-y-1/2">
        <ToggleButton isOpen={true} onToggle={onClose} />
      </div>

      {/* Settings sheet — positioned at sidebar's left edge */}
      <div className="pointer-events-none absolute top-0 bottom-0 left-0 z-10 w-[380px] -translate-x-full overflow-hidden">
        <SettingsSheet
          isOpen={settingsOpen}
          onClose={() => setSettingsOpen(false)}
        />
      </div>

      <SheetHeader>
        <div className="flex items-center justify-between">
          <SheetTitle className="flex items-center gap-2 text-base">
            <Zap className="h-4 w-4 text-primary" />
            xBooster
          </SheetTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setSettingsOpen(!settingsOpen)}
            title="Settings"
          >
            <Settings className="h-3.5 w-3.5" />
          </Button>
        </div>
        <ExpandableTabs
          tabs={tabs}
          value={selectedTab}
          onChange={setSelectedTab}
        />
      </SheetHeader>

      {/* Tab content */}
      {selectedTab === SIDEBAR_TABS.MENTIONS && <MentionsTab />}
      {selectedTab === SIDEBAR_TABS.ENGAGE && <EngageTab />}
    </SheetContent>
  );
}
