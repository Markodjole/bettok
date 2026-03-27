import { create } from "zustand";

const STAKE_STORAGE_KEY = "bettok_last_stake_amount";
const MUTE_STORAGE_KEY = "bettok_is_muted";
const VALID_AMOUNTS = [1, 2, 5, 10, 20, 50];

function getStoredStakeAmount(): number {
  if (typeof window === "undefined") return 10;
  try {
    const stored = localStorage.getItem(STAKE_STORAGE_KEY);
    const n = stored ? parseInt(stored, 10) : NaN;
    return VALID_AMOUNTS.includes(n) ? n : 10;
  } catch {
    return 10;
  }
}

function getStoredMuted(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(MUTE_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

interface FeedState {
  currentIndex: number;
  isMuted: boolean;
  lastStakeAmount: number;
  setCurrentIndex: (index: number) => void;
  hydratePreferences: () => void;
  toggleMute: () => void;
  setLastStakeAmount: (amount: number) => void;
}

export const useFeedStore = create<FeedState>((set) => ({
  currentIndex: 0,
  isMuted: false,
  lastStakeAmount: 10,
  setCurrentIndex: (currentIndex) => set({ currentIndex }),
  hydratePreferences: () => {
    set({
      isMuted: getStoredMuted(),
      lastStakeAmount: getStoredStakeAmount(),
    });
  },
  toggleMute: () =>
    set((s) => {
      const next = !s.isMuted;
      try { localStorage.setItem(MUTE_STORAGE_KEY, String(next)); } catch {}
      return { isMuted: next };
    }),
  setLastStakeAmount: (amount: number) => {
    if (VALID_AMOUNTS.includes(amount)) {
      try {
        localStorage.setItem(STAKE_STORAGE_KEY, String(amount));
      } catch {}
      set({ lastStakeAmount: amount });
    }
  },
}));
