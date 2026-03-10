import { create } from "zustand";

interface FeedState {
  currentIndex: number;
  isMuted: boolean;
  lastStakeAmount: number;
  setCurrentIndex: (index: number) => void;
  toggleMute: () => void;
  setLastStakeAmount: (amount: number) => void;
}

export const useFeedStore = create<FeedState>((set) => ({
  currentIndex: 0,
  isMuted: true,
  lastStakeAmount: 10,
  setCurrentIndex: (currentIndex) => set({ currentIndex }),
  toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),
  setLastStakeAmount: (lastStakeAmount) => set({ lastStakeAmount }),
}));
