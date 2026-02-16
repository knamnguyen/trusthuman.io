import { create } from "zustand";

export interface BoundingBox {
  width: number;
  height: number;
  left: number;
  top: number;
}

export interface Verification {
  id: string;
  timestamp: Date;
  action: "comment";
  platform: "linkedin";
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
