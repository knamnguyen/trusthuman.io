import { AbsoluteFill, Sequence, OffthreadVideo, useVideoConfig  } from 'remotion';
import { secondsToFrames } from '../utils/time-parsing';
import { VideoStitchClip } from '../schema-validators'; 
import { parseTimeRange } from '../utils/time-parsing';

interface VideoStitchProps {
  videoUrl: string;
  clips: VideoStitchClip[];
}

export const VideoStitch: React.FC<VideoStitchProps> = ({
  videoUrl,
  clips,
}) => {
  const { width, height, fps } = useVideoConfig();
  let currentFrame = 0;

  return (
    <AbsoluteFill className="bg-black flex items-center justify-center">
      {clips.map((clip, index) => {
        const { startSeconds, endSeconds } = parseTimeRange(clip.range);
        const startFrame = secondsToFrames(startSeconds, fps);
        const endFrame = secondsToFrames(endSeconds, fps);
        const clipDurationInFrames = endFrame - startFrame;

        const sequenceProps = {
          from: currentFrame,
          durationInFrames: clipDurationInFrames,
        };
        currentFrame += clipDurationInFrames;

        return (
          <Sequence key={index} {...sequenceProps}>
            <AbsoluteFill>
              {/* Video is always fit inside container with aspect ratio 6:19 (object-contain) */}
              <OffthreadVideo
                src={videoUrl}
                startFrom={startFrame}
                endAt={endFrame}
                // Tailwind classes for sizing and object-fit
                className="w-full h-full object-contain"
                volume={1}
                delayRenderTimeoutInMilliseconds={300000}
                delayRenderRetries={3}
              />

              {/* Caption Overlay - TikTok Style */}
              {clip.caption && (
                <div
                  // Absolute positioning at 60% from top and horizontal center
                  className="
                    absolute
                    left-1/2
                    top-[60%]
                    -translate-x-1/2
                    -translate-y-1/2
                    flex
                    justify-center
                    w-full
                    px-8
                  "
                >
                  <div
                    className="
                      bg-black/90
                      text-white
                      px-8
                      py-6
                      rounded-2xl
                      font-black
                      text-center
                      max-w-[85%]
                      shadow-2xl
                      border-2
                      border-white/20
                      backdrop-blur-sm
                    "
                    style={{
                      fontFamily: 'SF Pro Display, system-ui, sans-serif',
                      fontSize: `${Math.max(width * 0.06, 48)}px`,
                      lineHeight: '1.2',
                      textShadow: '2px 2px 4px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.5)',
                      letterSpacing: '0.02em',
                    }}
                  >
                    {clip.caption}
                  </div>
                </div>
              )}
            </AbsoluteFill>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};