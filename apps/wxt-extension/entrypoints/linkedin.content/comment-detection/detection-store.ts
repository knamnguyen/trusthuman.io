// import { create } from "zustand";

// /**
//  * Detection signals for identifying programmatic vs human input
//  */
// export interface DetectionStats {
//   // Programmatic events dispatched with isTrusted=false
//   untrustedEvents: number;
//   // Input events without corresponding keyboard events
//   missingKeyboardEvents: number;
//   // Input events without valid inputType property
//   invalidInputType: number;
//   // Typing velocity exceeding human capability (>50 chars/sec)
//   superhumanVelocity: number;
//   // Bulk insertions (>10 chars in single mutation)
//   bulkInsertions: number;
// }

// interface DetectionState {
//   stats: DetectionStats;
//   // Total comment boxes being monitored
//   monitoredBoxes: number;
//   // Whether detection is active
//   isActive: boolean;
// }

// interface DetectionActions {
//   incrementStat: (stat: keyof DetectionStats) => void;
//   resetStats: () => void;
//   setMonitoredBoxes: (count: number) => void;
//   setActive: (active: boolean) => void;
// }

// type DetectionStore = DetectionState & DetectionActions;

// const initialStats: DetectionStats = {
//   untrustedEvents: 0,
//   missingKeyboardEvents: 0,
//   invalidInputType: 0,
//   superhumanVelocity: 0,
//   bulkInsertions: 0,
// };

// export const useDetectionStore = create<DetectionStore>((set) => ({
//   stats: { ...initialStats },
//   monitoredBoxes: 0,
//   isActive: false,

//   incrementStat: (stat) =>
//     set((state) => ({
//       stats: {
//         ...state.stats,
//         [stat]: state.stats[stat] + 1,
//       },
//     })),

//   resetStats: () => set({ stats: { ...initialStats } }),

//   setMonitoredBoxes: (count) => set({ monitoredBoxes: count }),

//   setActive: (active) => set({ isActive: active }),
// }));

// /**
//  * Human-readable labels for each detection signal
//  */
// export const STAT_LABELS: Record<keyof DetectionStats, string> = {
//   untrustedEvents: "Untrusted Events (isTrusted=false)",
//   missingKeyboardEvents: "Missing Keyboard Events",
//   invalidInputType: "Invalid Input Type",
//   superhumanVelocity: "Superhuman Typing Speed",
//   bulkInsertions: "Bulk Text Insertions",
// };
