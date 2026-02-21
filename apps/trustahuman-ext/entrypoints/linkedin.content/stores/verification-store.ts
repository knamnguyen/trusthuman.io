import { create } from "zustand";

export interface BoundingBox {
  width: number;
  height: number;
  left: number;
  top: number;
}

export type ActivityType = "linkedin_comment" | "linkedin_post" | "x_comment" | "x_post";
export type Platform = "linkedin" | "x";

export interface Verification {
  id: string;
  timestamp: Date;
  action: ActivityType;
  platform: Platform;
  verified: boolean;
  confidence: number;
  faceCount: number;
  photoBase64: string;
  boundingBox: BoundingBox | null;
}

interface VerificationStore {
  verifications: Verification[];
  isRecording: boolean;
  addVerification: (v: Verification) => void;
  setRecording: (r: boolean) => void;
}

export const useVerificationStore = create<VerificationStore>((set) => ({
  verifications: [],
  isRecording: true,
  addVerification: (v) =>
    set((state) => ({
      verifications: [v, ...state.verifications],
    })),
  setRecording: (isRecording) => set({ isRecording }),
}));
