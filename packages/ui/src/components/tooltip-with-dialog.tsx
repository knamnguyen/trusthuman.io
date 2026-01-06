"use client";

import * as React from "react";

import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../ui/tooltip";

interface TooltipWithDialogProps {
  /** The element that triggers the tooltip on hover */
  children: React.ReactNode;
  /** Content to display in the tooltip */
  tooltipContent: React.ReactNode;
  /** Text for the button inside the tooltip that opens the dialog */
  buttonText?: string;
  /** Title of the dialog */
  dialogTitle?: string;
  /** Description text in the dialog header */
  dialogDescription?: string;
  /** Content to display inside the dialog (e.g., video, form, etc.) */
  dialogContent: React.ReactNode;
  /** Side of the tooltip relative to trigger */
  tooltipSide?: "top" | "right" | "bottom" | "left";
  /** Custom className for the dialog content */
  dialogClassName?: string;
  /** Hide the close icon in the dialog */
  hideCloseIcon?: boolean;
  /** Container element for portals (required for shadow DOM contexts like browser extensions) */
  portalContainer?: HTMLElement | null;
  /** Delay in ms before tooltip appears (default: 300) */
  tooltipDelayDuration?: number;
  /** Whether the dialog should be modal (blocks interaction with rest of page). Default: false */
  dialogModal?: boolean;
}

export function TooltipWithDialog({
  children,
  tooltipContent,
  buttonText = "Learn more",
  dialogTitle,
  dialogDescription,
  dialogContent,
  tooltipSide = "top",
  dialogClassName,
  hideCloseIcon,
  portalContainer,
  tooltipDelayDuration = 300,
  dialogModal = false,
}: TooltipWithDialogProps) {
  const [dialogOpen, setDialogOpen] = React.useState(false);

  return (
    <>
      <Tooltip delayDuration={tooltipDelayDuration}>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent
          side={tooltipSide}
          className="flex flex-col gap-2 p-3"
          container={portalContainer}
        >
          <div>{tooltipContent}</div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDialogOpen(true)}
          >
            {buttonText}
          </Button>
        </TooltipContent>
      </Tooltip>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen} modal={dialogModal}>
        <DialogContent
          className={dialogClassName}
          hideCloseIcon={hideCloseIcon}
          portalContainer={portalContainer}
          hideOverlay={!dialogModal}
        >
          {(dialogTitle || dialogDescription) && (
            <DialogHeader>
              {dialogTitle && <DialogTitle>{dialogTitle}</DialogTitle>}
              {dialogDescription && (
                <DialogDescription>{dialogDescription}</DialogDescription>
              )}
            </DialogHeader>
          )}
          {dialogContent}
        </DialogContent>
      </Dialog>
    </>
  );
}
