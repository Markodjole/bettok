import { create } from "zustand";
import type { Profile, Wallet } from "@bettok/types";

interface UserState {
  profile: Profile | null;
  wallet: Wallet | null;
  isLoading: boolean;
  setProfile: (profile: Profile | null) => void;
  setWallet: (wallet: Wallet | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useUserStore = create<UserState>((set) => ({
  profile: null,
  wallet: null,
  isLoading: true,
  setProfile: (profile) => set({ profile }),
  setWallet: (wallet) => set({ wallet }),
  setLoading: (isLoading) => set({ isLoading }),
}));
