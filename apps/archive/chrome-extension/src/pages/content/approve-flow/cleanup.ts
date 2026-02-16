import { removeApprovePanel } from "./inject-sidebar";

export function cleanupManualApproveUI(): void {
  try {
    removeApprovePanel();
  } catch {}
}

