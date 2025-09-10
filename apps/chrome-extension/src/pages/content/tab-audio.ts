export type StartParams = {
  frequencyHz?: number;
  waveform?: OscillatorType;
  gain?: number;
  muted?: boolean;
  loop?: boolean;
  elementId?: string;
  requireUserGestureResume?: boolean;
  injectedCss?: string;
  onStart?: () => void;
  onError?: (err: unknown) => void;
};

let audioContext: AudioContext | null = null;
let oscillatorNode: OscillatorNode | null = null;
let gainNode: GainNode | null = null;
let audioElement: HTMLAudioElement | null = null;

const DEFAULTS: Required<
  Omit<StartParams, "onStart" | "onError" | "injectedCss">
> & {
  injectedCss: string | undefined;
} = {
  frequencyHz: 10000,
  waveform: "sine",
  gain: 0.001,
  muted: true,
  loop: true,
  elementId: "engagekit-tab-audio",
  requireUserGestureResume: true,
  injectedCss: undefined,
};

const getAudioContextCtor = (): typeof window.AudioContext | null => {
  const Ctor =
    (window as any).AudioContext || (window as any).webkitAudioContext;
  return Ctor || null;
};

const ensureStyle = (css?: string): void => {
  if (!css) return;
  const id = "engagekit-tab-audio-style";
  if (document.getElementById(id)) return;
  const style = document.createElement("style");
  style.id = id;
  style.textContent = css;
  document.head.appendChild(style);
};

const start = async (params: StartParams = {}): Promise<void> => {
  if (oscillatorNode && audioElement && audioContext) {
    return;
  }

  const cfg = { ...DEFAULTS, ...params };

  try {
    const Ctor = getAudioContextCtor();
    if (!Ctor) {
      throw new Error(
        "Web Audio API is not supported in this browser. Cannot play audio.",
      );
    }

    audioContext = new Ctor();

    oscillatorNode = audioContext.createOscillator();
    gainNode = audioContext.createGain();
    const mediaStreamDestination = audioContext.createMediaStreamDestination();

    oscillatorNode.connect(gainNode);
    gainNode.connect(mediaStreamDestination);

    oscillatorNode.type = cfg.waveform;
    oscillatorNode.frequency.setValueAtTime(
      cfg.frequencyHz,
      audioContext.currentTime,
    );
    gainNode.gain.setValueAtTime(cfg.gain, audioContext.currentTime);

    audioElement = document.getElementById(
      cfg.elementId,
    ) as HTMLAudioElement | null;
    if (!audioElement) {
      audioElement = document.createElement("audio");
      audioElement.id = cfg.elementId;
    }
    audioElement.srcObject = mediaStreamDestination.stream;
    audioElement.autoplay = true;
    audioElement.loop = cfg.loop;
    audioElement.muted = cfg.muted;
    audioElement.controls = false;
    audioElement.style.cssText = "position: fixed; top: -9999px; opacity: 0;";

    ensureStyle(cfg.injectedCss);
    if (!audioElement.isConnected) document.body.appendChild(audioElement);

    const begin = async () => {
      if (
        cfg.requireUserGestureResume &&
        audioContext &&
        audioContext.state === "suspended"
      ) {
        await audioContext.resume();
      }
      oscillatorNode!.start();
      const playPromise = audioElement!.play();
      if (playPromise && typeof playPromise.then === "function") {
        await playPromise;
      }
      if (typeof cfg.onStart === "function") cfg.onStart();
    };

    await begin();
  } catch (err) {
    try {
      stop();
    } catch {}
    if (typeof params.onError === "function") params.onError(err);
    throw err;
  }
};

const stop = (): void => {
  try {
    if (oscillatorNode) {
      try {
        oscillatorNode.stop();
      } catch {}
    }
    oscillatorNode = null;

    if (audioElement) {
      try {
        audioElement.pause();
      } catch {}
      try {
        audioElement.remove();
      } catch {}
    }
    audioElement = null;

    if (audioContext && audioContext.state !== "closed") {
      try {
        audioContext.close();
      } catch {}
    }
    audioContext = null;
  } catch {}
};

const isActive = (): boolean => {
  return !!(audioContext && oscillatorNode && audioElement);
};

export const tabAudio = {
  start,
  stop,
  isActive,
};
