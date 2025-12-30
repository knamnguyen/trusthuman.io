// import { useDetectionStore } from "./detection-store";

// /**
//  * Threshold for superhuman typing speed (characters per second)
//  * Average human types 5-10 chars/sec, fast typists ~15 chars/sec
//  */
// const SUPERHUMAN_VELOCITY_THRESHOLD = 50;

// /**
//  * Threshold for bulk insertion detection (characters)
//  */
// const BULK_INSERTION_THRESHOLD = 10;

// /**
//  * Valid inputType values for human typing
//  */
// const VALID_INPUT_TYPES = [
//   "insertText",
//   "insertCompositionText",
//   "insertParagraph",
//   "insertLineBreak",
//   "deleteContentBackward",
//   "deleteContentForward",
//   "deleteByCut",
//   "insertFromPaste", // Paste is also tracked as non-human per requirements
// ];

// /**
//  * Tracks state per monitored comment box
//  */
// interface BoxState {
//   hasKeyboardEvent: boolean;
//   lastLength: number;
//   lastTime: number;
// }

// // WeakMap to store state per element (auto-cleanup when element is GC'd)
// const boxStates = new WeakMap<HTMLElement, BoxState>();

// // Set of currently monitored boxes
// const monitoredBoxes = new Set<HTMLElement>();

// // MutationObserver to watch for new comment boxes
// let domObserver: MutationObserver | null = null;

// /**
//  * Get or create state for a comment box
//  */
// function getBoxState(element: HTMLElement): BoxState {
//   let state = boxStates.get(element);
//   if (!state) {
//     state = {
//       hasKeyboardEvent: false,
//       lastLength: element.textContent?.length ?? 0,
//       lastTime: Date.now(),
//     };
//     boxStates.set(element, state);
//   }
//   return state;
// }

// /**
//  * Handle keyboard events (keydown) on a comment box
//  */
// function handleKeydown(event: Event): void {
//   const element = event.target as HTMLElement;
//   const state = getBoxState(element);
//   state.hasKeyboardEvent = true;
// }

// /**
//  * Handle input events on a comment box
//  * This is where we detect programmatic vs human input
//  */
// function handleInput(event: Event): void {
//   const store = useDetectionStore.getState();
//   const element = event.target as HTMLElement;
//   const state = getBoxState(element);
//   const inputEvent = event as InputEvent;

//   // 1. Check isTrusted - most reliable signal
//   if (!event.isTrusted) {
//     store.incrementStat("untrustedEvents");
//   }

//   // 2. Check for missing keyboard events
//   // (paste also won't have keyboard events - counted as non-human per requirements)
//   if (!state.hasKeyboardEvent) {
//     store.incrementStat("missingKeyboardEvents");
//   }

//   // 3. Check inputType validity
//   // Programmatically created events often lack inputType
//   // Paste has "insertFromPaste" which we also count
//   const inputType = inputEvent.inputType;
//   if (!inputType || !VALID_INPUT_TYPES.includes(inputType)) {
//     store.incrementStat("invalidInputType");
//   } else if (inputType === "insertFromPaste") {
//     // Paste is valid but still counts as non-human
//     store.incrementStat("invalidInputType");
//   }

//   // 4. Check typing velocity
//   const currentLength = element.textContent?.length ?? 0;
//   const timeDelta = Date.now() - state.lastTime;
//   const charDelta = Math.abs(currentLength - state.lastLength);

//   if (timeDelta > 0 && charDelta > 0) {
//     const charsPerSecond = (charDelta / timeDelta) * 1000;
//     if (charsPerSecond > SUPERHUMAN_VELOCITY_THRESHOLD) {
//       store.incrementStat("superhumanVelocity");
//     }
//   }

//   // 5. Check for bulk insertion (many chars at once)
//   if (charDelta > BULK_INSERTION_THRESHOLD) {
//     store.incrementStat("bulkInsertions");
//   }

//   // Reset state for next input
//   state.hasKeyboardEvent = false;
//   state.lastLength = currentLength;
//   state.lastTime = Date.now();
// }

// /**
//  * Attach detection listeners to a comment box
//  */
// function attachListeners(element: HTMLElement): void {
//   if (monitoredBoxes.has(element)) return;

//   element.addEventListener("keydown", handleKeydown, { capture: true });
//   element.addEventListener("input", handleInput, { capture: true });

//   monitoredBoxes.add(element);
//   useDetectionStore.getState().setMonitoredBoxes(monitoredBoxes.size);
// }

// /**
//  * Detach detection listeners from a comment box
//  */
// function detachListeners(element: HTMLElement): void {
//   if (!monitoredBoxes.has(element)) return;

//   element.removeEventListener("keydown", handleKeydown, { capture: true });
//   element.removeEventListener("input", handleInput, { capture: true });

//   monitoredBoxes.delete(element);
//   boxStates.delete(element);
//   useDetectionStore.getState().setMonitoredBoxes(monitoredBoxes.size);
// }

// /**
//  * Find and attach to all LinkedIn comment boxes on the page
//  */
// function scanForCommentBoxes(): void {
//   // LinkedIn uses contenteditable divs for comment input
//   const commentBoxes = document.querySelectorAll<HTMLElement>(
//     'div[contenteditable="true"]',
//   );

//   commentBoxes.forEach((box) => {
//     // Filter to likely comment boxes (exclude rich text editors, etc.)
//     // LinkedIn comment boxes are usually within forms with specific classes
//     const form = box.closest("form");
//     if (form || box.closest(".comments-comment-box")) {
//       attachListeners(box);
//     }
//   });
// }

// /**
//  * Clean up boxes that are no longer in the DOM
//  */
// function cleanupRemovedBoxes(): void {
//   for (const box of monitoredBoxes) {
//     if (!document.contains(box)) {
//       detachListeners(box);
//     }
//   }
// }

// /**
//  * Start the detection system
//  * Watches the DOM for comment boxes and attaches detection listeners
//  */
// export function startDetection(): void {
//   const store = useDetectionStore.getState();
//   if (store.isActive) return;

//   store.setActive(true);

//   // Initial scan
//   scanForCommentBoxes();

//   // Watch for new comment boxes being added to the DOM
//   domObserver = new MutationObserver((mutations) => {
//     let shouldScan = false;

//     for (const mutation of mutations) {
//       if (mutation.type === "childList") {
//         // Check if any added nodes might contain comment boxes
//         for (const node of mutation.addedNodes) {
//           if (node instanceof HTMLElement) {
//             if (
//               node.matches?.('div[contenteditable="true"]') ||
//               node.querySelector?.('div[contenteditable="true"]')
//             ) {
//               shouldScan = true;
//               break;
//             }
//           }
//         }

//         // Check for removed nodes
//         for (const node of mutation.removedNodes) {
//           if (node instanceof HTMLElement) {
//             if (monitoredBoxes.has(node)) {
//               detachListeners(node);
//             }
//           }
//         }
//       }
//     }

//     if (shouldScan) {
//       scanForCommentBoxes();
//     }

//     // Periodic cleanup of removed boxes
//     cleanupRemovedBoxes();
//   });

//   domObserver.observe(document.body, {
//     childList: true,
//     subtree: true,
//   });
// }

// /**
//  * Stop the detection system
//  */
// export function stopDetection(): void {
//   const store = useDetectionStore.getState();
//   if (!store.isActive) return;

//   // Stop DOM observer
//   if (domObserver) {
//     domObserver.disconnect();
//     domObserver = null;
//   }

//   // Detach from all monitored boxes
//   for (const box of [...monitoredBoxes]) {
//     detachListeners(box);
//   }

//   store.setActive(false);
// }

// /**
//  * Check if detection is currently running
//  */
// export function isDetectionActive(): boolean {
//   return useDetectionStore.getState().isActive;
// }
