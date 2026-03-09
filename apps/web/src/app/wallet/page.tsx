"use client";

import { useEffect, useState, useTransition } from "react";
import { Wallet, ArrowDownLeft, ArrowUpRight, Clock, Loader2 } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { useUserStore } from "@/stores/user-store";
import { getWallet, getWalletTransactions, depositDemo } from "@/actions/wallet";
import { cn, formatCurrency, formatRelativeTime } from "@/lib/utils";

type Transaction = {
  id: string;
  type: string;
  amount: number;
  balance_after: number;
  description: string | null;
  created_at: string;
};

const DEPOSIT_AMOUNTS = [100, 500, 1000];

const txConfig: Record<string, { label: string; variant: "success" | "destructive" | "warning" | "default"; sign: string }> = {
  deposit_demo: { label: "Deposit", variant: "success", sign: "+" },
  bet_win: { label: "Win", variant: "success", sign: "+" },
  referral_bonus: { label: "Bonus", variant: "success", sign: "+" },
  creator_reward: { label: "Reward", variant: "success", sign: "+" },
  bet_loss: { label: "Loss", variant: "destructive", sign: "-" },
  bet_hold: { label: "Hold", variant: "destructive", sign: "-" },
  bet_release: { label: "Release", variant: "warning", sign: "+" },
  withdrawal_demo: { label: "Withdrawal", variant: "destructive", sign: "-" },
  admin_adjustment: { label: "Adjustment", variant: "default", sign: "" },
};

function getTxMeta(type: string) {
  return txConfig[type] ?? { label: type, variant: "default" as const, sign: "" };
}

export default function WalletPage() {
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [depositingAmount, setDepositingAmount] = useState<number | null>(null);
  const { toast } = useToast();
  const setWallet = useUserStore((s) => s.setWallet);

  useEffect(() => {
    async function load() {
      const [walletData, txData] = await Promise.all([
        getWallet(),
        getWalletTransactions(),
      ]);
      if (walletData) {
        setBalance(Number(walletData.balance));
        setWallet(walletData);
      }
      setTransactions(txData as Transaction[]);
      setLoading(false);
    }
    load();
  }, [setWallet]);

  function handleDeposit(amount: number) {
    setDepositingAmount(amount);
    startTransition(async () => {
      const result = await depositDemo(amount);
      if (result.error) {
        toast({ title: "Deposit failed", description: result.error, variant: "destructive" });
      } else if (result.data) {
        setBalance(result.data.balance);
        toast({ title: "Deposit successful", description: `${formatCurrency(amount)} added to your wallet`, variant: "success" });
        const txData = await getWalletTransactions();
        setTransactions(txData as Transaction[]);
        const walletData = await getWallet();
        if (walletData) setWallet(walletData);
      }
      setDepositingAmount(null);
    });
  }

  return (
    <AppShell>
      <div className="flex h-full flex-col overflow-y-auto no-scrollbar">
        <div className="space-y-4 p-4">
          {/* Balance Card */}
          <Card className="bg-gradient-to-br from-primary/20 via-card to-card border-primary/30">
            <CardContent className="flex flex-col items-center gap-1 py-8">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Wallet className="h-4 w-4" />
                <span className="text-sm font-medium">Available Balance</span>
              </div>
              {loading ? (
                <Skeleton className="h-10 w-40 mt-1" />
              ) : (
                <p className="text-4xl font-bold tracking-tight">
                  {formatCurrency(balance ?? 0)}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Quick Deposit */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quick Deposit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {DEPOSIT_AMOUNTS.map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    className="h-12 text-base font-semibold"
                    disabled={isPending}
                    onClick={() => handleDeposit(amount)}
                  >
                    {depositingAmount === amount ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      formatCurrency(amount)
                    )}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Transaction History */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Transaction History</CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              {loading ? (
                <div className="space-y-4 px-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="space-y-1.5">
                          <Skeleton className="h-3.5 w-24" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </div>
              ) : transactions.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                  <Clock className="h-8 w-8" />
                  <p className="text-sm">No transactions yet</p>
                </div>
              ) : (
                <div>
                  {transactions.map((tx, i) => {
                    const meta = getTxMeta(tx.type);
                    const isPositive = meta.sign === "+";
                    return (
                      <div key={tx.id}>
                        {i > 0 && <Separator className="mx-4" />}
                        <div className="flex items-center justify-between px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                "flex h-8 w-8 items-center justify-center rounded-full",
                                isPositive ? "bg-success/10" : "bg-destructive/10"
                              )}
                            >
                              {isPositive ? (
                                <ArrowDownLeft className="h-4 w-4 text-success" />
                              ) : (
                                <ArrowUpRight className="h-4 w-4 text-destructive" />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <Badge variant={meta.variant} className="text-[10px] px-1.5 py-0">
                                  {meta.label}
                                </Badge>
                              </div>
                              <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                                {tx.description ?? meta.label}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p
                              className={cn(
                                "text-sm font-semibold",
                                isPositive ? "text-success" : "text-destructive"
                              )}
                            >
                              {meta.sign}{formatCurrency(Math.abs(tx.amount))}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {formatRelativeTime(tx.created_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
