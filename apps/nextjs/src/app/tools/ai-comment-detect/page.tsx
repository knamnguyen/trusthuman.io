import type { Metadata } from "next";

import { AICommentDetectorTool } from "./_components/ai-comment-detector-tool";

export const metadata: Metadata = {
  title: "AI Comment Detector - EngageKit",
  description:
    "Detect AI-generated LinkedIn comments with our powerful analysis tool. Identify artificial engagement and maintain authentic conversations.",
  openGraph: {
    title: "AI Comment Detector - EngageKit",
    description:
      "Detect AI-generated LinkedIn comments with our powerful analysis tool. Identify artificial engagement and maintain authentic conversations.",
    type: "website",
  },
};

export default function AICommentDetectPage() {
  return (
    <div className="min-h-screen">
      <div className="container max-w-7xl py-8">
        <div className="mb-8 space-y-2 text-center">
          <h1 className="text-4xl font-bold tracking-tight">
            AI Comment Detector
          </h1>
          <p className="text-lg text-muted-foreground">
            Analyze LinkedIn comments to detect AI-generated content and maintain
            authentic conversations
          </p>
        </div>
        <AICommentDetectorTool />
      </div>
    </div>
  );
}
