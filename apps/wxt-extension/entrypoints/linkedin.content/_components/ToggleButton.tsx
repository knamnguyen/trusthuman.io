import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@sassy/ui/button";

interface ToggleButtonProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function ToggleButton({ isOpen, onToggle }: ToggleButtonProps) {
  return (
    <Button
      onClick={onToggle}
      variant="primary"
      size="icon"
      className="z-10"
      aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
      title={isOpen ? "Close sidebar" : "Open sidebar"}
    >
      {isOpen ? (
        <ChevronRight className="h-4 w-4" />
      ) : (
        <ChevronLeft className="h-4 w-4" />
      )}
    </Button>
  );
}
