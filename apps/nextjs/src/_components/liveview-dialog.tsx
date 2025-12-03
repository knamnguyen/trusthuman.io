import { XIcon } from "lucide-react";

import { Dialog, DialogContent } from "@sassy/ui/dialog";

export function BrowserLiveviewDialog({
  open,
  liveUrl,
  onClose,
}: {
  onClose?: () => void;
  liveUrl: string | null;
  open: boolean;
}) {
  return (
    <Dialog open={open}>
      <DialogContent
        className="h-[90vh] max-h-[90vh] w-[90vw] max-w-[90vw] p-2"
        hideCloseIcon
      >
        <button
          className="absolute top-2 right-2 cursor-pointer"
          onClick={() => {
            onClose?.();
          }}
        >
          <XIcon className="size-4" />
        </button>
        {liveUrl !== null && (
          <iframe
            src={liveUrl}
            width="100%"
            height="100%"
            style={{ border: "none" }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
