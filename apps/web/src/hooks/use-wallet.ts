"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getWallet, getWalletTransactions, depositDemo } from "@/actions/wallet";
import { useUserStore } from "@/stores/user-store";
import { useToast } from "@/components/ui/toast";

export function useWallet() {
  const setWallet = useUserStore((s) => s.setWallet);

  return useQuery({
    queryKey: ["wallet"],
    queryFn: async () => {
      const data = await getWallet();
      if (data) setWallet(data as never);
      return data;
    },
  });
}

export function useWalletTransactions() {
  return useQuery({
    queryKey: ["wallet", "transactions"],
    queryFn: () => getWalletTransactions(),
  });
}

export function useDeposit() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (amount: number) => depositDemo(amount),
    onSuccess: (result) => {
      if (result.error) {
        toast({
          title: "Deposit failed",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Deposit successful",
          description: `$${result.data?.balance.toFixed(2)} new balance`,
          variant: "success",
        });
        queryClient.invalidateQueries({ queryKey: ["wallet"] });
      }
    },
  });
}
