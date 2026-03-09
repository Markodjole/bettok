"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUserBets, placeBet as placeBetAction } from "@/actions/bets";
import { useToast } from "@/components/ui/toast";

export function useUserBets(status?: string) {
  return useQuery({
    queryKey: ["bets", status],
    queryFn: () => getUserBets(status),
  });
}

export function usePlaceBet() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (input: {
      prediction_market_id: string;
      side_key: "yes" | "no";
      stake_amount: number;
    }) => placeBetAction(input),
    onSuccess: (result) => {
      if (result.error) {
        toast({
          title: "Bet failed",
          description: result.error,
          variant: "destructive",
        });
      } else {
        queryClient.invalidateQueries({ queryKey: ["bets"] });
        queryClient.invalidateQueries({ queryKey: ["wallet"] });
      }
    },
  });
}
