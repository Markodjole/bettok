import { create } from "zustand";
import { getClipMarkets } from "@/actions/clips";

export interface ClipMarketSide {
  id: string;
  side_key: "yes" | "no";
  current_odds_decimal: number;
  probability: number;
  pool_amount: number;
  bet_count: number;
}

export interface ClipMarket {
  id: string;
  canonical_text: string;
  market_key: string;
  status: string;
  market_sides: ClipMarketSide[];
}

const EMPTY_MARKETS: ClipMarket[] = [];

interface ClipMarketsState {
  byClipId: Record<string, ClipMarket[]>;
  setMarkets: (clipId: string, markets: ClipMarket[]) => void;
  refetchMarkets: (clipId: string) => Promise<void>;
  getMarkets: (clipId: string) => ClipMarket[];
}

export const useClipMarketsStore = create<ClipMarketsState>((set, get) => ({
  byClipId: {},
  setMarkets: (clipId, markets) =>
    set((s) => ({
      byClipId: { ...s.byClipId, [clipId]: markets },
    })),
  refetchMarkets: async (clipId) => {
    const data = await getClipMarkets(clipId);
    const markets = (data || []) as unknown as ClipMarket[];
    set((s) => ({
      byClipId: { ...s.byClipId, [clipId]: markets },
    }));
  },
  getMarkets: (clipId) => get().byClipId[clipId] ?? EMPTY_MARKETS,
}));
