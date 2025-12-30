// import { useEffect } from "react";
// import {
//   Activity,
//   AlertTriangle,
//   Keyboard,
//   Play,
//   RotateCcw,
//   Square,
//   Type,
//   Zap,
// } from "lucide-react";

// import { Badge } from "@sassy/ui/badge";
// import { Button } from "@sassy/ui/button";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@sassy/ui/card";

// import {
//   type DetectionStats as DetectionStatsType,
//   STAT_LABELS,
//   useDetectionStore,
// } from "./detection-store";
// import { startDetection, stopDetection } from "./detection-observer";

// /**
//  * Icon mapping for each stat type
//  */
// const STAT_ICONS: Record<keyof DetectionStatsType, typeof Activity> = {
//   untrustedEvents: AlertTriangle,
//   missingKeyboardEvents: Keyboard,
//   invalidInputType: Type,
//   superhumanVelocity: Zap,
//   bulkInsertions: Activity,
// };

// /**
//  * Stat display row component
//  */
// function StatRow({
//   statKey,
//   value,
// }: {
//   statKey: keyof DetectionStatsType;
//   value: number;
// }) {
//   const Icon = STAT_ICONS[statKey];
//   const label = STAT_LABELS[statKey];

//   return (
//     <div className="flex items-center justify-between py-2">
//       <div className="flex items-center gap-2">
//         <Icon className="text-muted-foreground h-4 w-4" />
//         <span className="text-sm">{label}</span>
//       </div>
//       <Badge variant={value > 0 ? "destructive" : "secondary"}>{value}</Badge>
//     </div>
//   );
// }

// /**
//  * Detection Statistics Display Component
//  * Shows counters for each detection signal in the Mail tab
//  */
// export function DetectionStats() {
//   const { stats, monitoredBoxes, isActive, resetStats } = useDetectionStore();

//   // Auto-start detection when component mounts
//   useEffect(() => {
//     startDetection();

//     return () => {
//       // Optionally stop on unmount - keeping active for now
//       // stopDetection();
//     };
//   }, []);

//   const totalDetections = Object.values(stats).reduce(
//     (sum, count) => sum + count,
//     0,
//   );

//   return (
//     <div className="flex flex-col gap-4 px-4">
//       {/* Status Card */}
//       <Card>
//         <CardHeader className="pb-3">
//           <div className="flex items-center justify-between">
//             <CardTitle className="flex items-center gap-2 text-base">
//               <Activity className="h-4 w-4" />
//               Comment Detection
//             </CardTitle>
//             <Badge variant={isActive ? "default" : "secondary"}>
//               {isActive ? "Active" : "Inactive"}
//             </Badge>
//           </div>
//           <CardDescription>
//             Monitors comment boxes for programmatic input
//           </CardDescription>
//         </CardHeader>
//         <CardContent>
//           <div className="flex items-center justify-between text-sm">
//             <span className="text-muted-foreground">Monitored Boxes</span>
//             <span className="font-mono">{monitoredBoxes}</span>
//           </div>
//           <div className="flex items-center justify-between text-sm">
//             <span className="text-muted-foreground">Total Detections</span>
//             <Badge variant={totalDetections > 0 ? "destructive" : "secondary"}>
//               {totalDetections}
//             </Badge>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Controls */}
//       <div className="flex gap-2">
//         {isActive ? (
//           <Button
//             variant="outline"
//             size="sm"
//             className="flex-1"
//             onClick={stopDetection}
//           >
//             <Square className="mr-2 h-4 w-4" />
//             Stop
//           </Button>
//         ) : (
//           <Button
//             variant="outline"
//             size="sm"
//             className="flex-1"
//             onClick={startDetection}
//           >
//             <Play className="mr-2 h-4 w-4" />
//             Start
//           </Button>
//         )}
//         <Button variant="outline" size="sm" className="flex-1" onClick={resetStats}>
//           <RotateCcw className="mr-2 h-4 w-4" />
//           Reset
//         </Button>
//       </div>

//       {/* Stats Card */}
//       <Card>
//         <CardHeader className="pb-2">
//           <CardTitle className="text-base">Detection Signals</CardTitle>
//           <CardDescription>
//             Non-human input events detected (includes copy-paste)
//           </CardDescription>
//         </CardHeader>
//         <CardContent>
//           <div className="divide-y">
//             {(Object.keys(stats) as Array<keyof DetectionStatsType>).map(
//               (key) => (
//                 <StatRow key={key} statKey={key} value={stats[key]} />
//               ),
//             )}
//           </div>
//         </CardContent>
//       </Card>

//       {/* Legend */}
//       <Card>
//         <CardHeader className="pb-2">
//           <CardTitle className="text-sm">What We Detect</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <ul className="text-muted-foreground flex flex-col gap-1 text-xs">
//             <li>
//               <strong>Untrusted Events:</strong> Events with isTrusted=false
//               (programmatic)
//             </li>
//             <li>
//               <strong>Missing Keyboard:</strong> Input without keydown events
//             </li>
//             <li>
//               <strong>Invalid Type:</strong> Missing or paste inputType
//             </li>
//             <li>
//               <strong>Superhuman Speed:</strong> {">"} 50 chars/second
//             </li>
//             <li>
//               <strong>Bulk Insertion:</strong> {">"} 10 chars in one event
//             </li>
//           </ul>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }
