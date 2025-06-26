import React from "react";
import {
  AbsoluteFill,
  Audio,
  OffthreadVideo,
  Sequence,
  useVideoConfig,
} from "remotion";

interface CombineVideosProps {
  shortHookUrl: string;
  shortDemoUrl: string;
  originalHookUrl: string;
  shortHookDuration: number;
  shortDemoDuration: number;
  originalHookDuration: number; // Duration of the original hook video in seconds
}

export const CombineVideos: React.FC<CombineVideosProps> = ({
  shortHookUrl,
  shortDemoUrl,
  originalHookUrl,
  shortHookDuration,
  shortDemoDuration,
  originalHookDuration,
}) => {
  const { width, height, fps } = useVideoConfig();

  // Ensure minimum duration to prevent zero-frame sequences
  const validShortHookDuration = Math.max(shortHookDuration, 0.1); // Minimum 0.1 seconds
  const validShortDemoDuration = Math.max(shortDemoDuration, 0.1); // Minimum 0.1 seconds

  const shortHookFrames = Math.ceil(validShortHookDuration * fps);
  const shortDemoFrames = Math.ceil(validShortDemoDuration * fps);

  // Calculate total combined video duration
  const totalCombinedDuration = validShortHookDuration + validShortDemoDuration;

  // Determine if we need to loop the original audio
  const needsAudioLoop = originalHookDuration < totalCombinedDuration;

  return (
    <AbsoluteFill className="flex items-center justify-center bg-black">
      {/* Audio track from original hook video - loops if needed to cover entire video */}
      <Audio src={originalHookUrl} volume={1} loop={needsAudioLoop} />

      {/* First sequence: Short hook video (muted since we use original audio) */}
      <Sequence from={0} durationInFrames={shortHookFrames}>
        <AbsoluteFill>
          <OffthreadVideo
            src={shortHookUrl}
            className="h-full w-full object-contain"
            volume={0} // Muted - we use original hook audio instead
            delayRenderTimeoutInMilliseconds={300000}
            delayRenderRetries={3}
          />
        </AbsoluteFill>
      </Sequence>

      {/* Second sequence: Short demo video (muted since we use original audio) */}
      <Sequence from={shortHookFrames} durationInFrames={shortDemoFrames}>
        <AbsoluteFill>
          <OffthreadVideo
            src={shortDemoUrl}
            className="h-full w-full object-contain"
            volume={0} // Muted - we use original hook audio instead
            delayRenderTimeoutInMilliseconds={300000}
            delayRenderRetries={3}
          />
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};
