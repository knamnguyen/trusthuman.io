import { Camera, ShieldCheck } from "lucide-react";
import { Button } from "@sassy/ui/button";
import { SheetContent, SheetHeader, SheetTitle } from "@sassy/ui/sheet";

import { ToggleButton } from "./ToggleButton";
import { useShadowRootStore } from "./stores/shadow-root-store";
import type { Verification } from "./stores/verification-store";
import { useVerificationStore } from "./stores/verification-store";

interface VerificationSidebarProps {
  onClose: () => void;
}

function VerificationCard({ v }: { v: Verification }) {
  return (
    <div
      className={`rounded-lg border overflow-hidden ${
        v.verified
          ? "border-primary/30 bg-primary/5"
          : "border-secondary/30 bg-secondary/5"
      }`}
    >
      {/* Photo with bounding box overlay */}
      <div className="relative w-full" style={{ aspectRatio: "640/480" }}>
        <img
          src={`data:image/jpeg;base64,${v.photoBase64}`}
          alt="Verification capture"
          className="w-full h-full object-cover"
        />
        {v.boundingBox && (
          <div
            className={`absolute border-2 rounded ${
              v.verified ? "border-primary" : "border-secondary"
            }`}
            style={{
              left: `${v.boundingBox.left * 100}%`,
              top: `${v.boundingBox.top * 100}%`,
              width: `${v.boundingBox.width * 100}%`,
              height: `${v.boundingBox.height * 100}%`,
            }}
          />
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium capitalize">{v.action}</span>
          <span className="text-xs text-muted-foreground">
            {v.timestamp.toLocaleTimeString()}
          </span>
        </div>
        <div className="mt-1 flex items-center justify-between">
          <span
            className={`text-xs font-medium ${
              v.verified ? "text-primary" : "text-secondary"
            }`}
          >
            {v.verified ? "Verified" : "Not verified"}
          </span>
          <span className="text-xs text-muted-foreground">
            {Math.round(v.confidence)}% · {v.faceCount} face{v.faceCount !== 1 ? "s" : ""}
          </span>
        </div>
      </div>
    </div>
  );
}

export function VerificationSidebar({ onClose }: VerificationSidebarProps) {
  const shadowRoot = useShadowRootStore((s) => s.shadowRoot);
  const { verifications, isRecording } = useVerificationStore();

  function handleGrantCamera() {
    chrome.runtime.sendMessage({ action: "openSetup" });
  }

  return (
    <SheetContent
      side="right"
      className="z-[9999] w-[340px] min-w-[340px] gap-0"
      portalContainer={shadowRoot}
    >
      {/* Close button */}
      <div className="absolute top-1/2 left-0 -translate-x-full -translate-y-1/2">
        <ToggleButton isOpen={true} onToggle={onClose} />
      </div>

      <SheetHeader>
        <SheetTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="h-4 w-4 text-primary" />
          Trust a Human
        </SheetTitle>
        {/* Recording indicator */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span
            className={`inline-block h-2 w-2 rounded-full ${
              isRecording ? "bg-primary animate-pulse" : "bg-muted-foreground/30"
            }`}
          />
          {isRecording ? "Monitoring LinkedIn" : "Paused"}
        </div>
      </SheetHeader>

      {/* Camera permission banner */}
      <div className="px-4 pt-3">
        <Button
          onClick={handleGrantCamera}
          variant="outline"
          className="w-full gap-2 text-xs"
          size="sm"
        >
          <Camera className="h-3 w-3" />
          Grant Camera Access
        </Button>
      </div>

      {/* Verification list */}
      <div className="flex-1 overflow-y-auto p-4">
        {verifications.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center mt-8">
            No verifications yet. Grant camera access above, then post a comment
            on LinkedIn.
          </p>
        ) : (
          <div className="space-y-3">
            {verifications.map((v) => (
              <VerificationCard key={v.id} v={v} />
            ))}
          </div>
        )}
      </div>
    </SheetContent>
  );
}
