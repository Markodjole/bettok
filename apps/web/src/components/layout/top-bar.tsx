"use client";

import Link from "next/link";
import { useUserStore } from "@/stores/user-store";
import { formatCurrency } from "@/lib/utils";
import { Wallet } from "lucide-react";

export function TopBar() {
  const wallet = useUserStore((s) => s.wallet);

  return (
    <header className="fixed left-0 right-0 top-0 z-50 flex h-12 items-center justify-between bg-background/80 px-4 backdrop-blur-lg">
      <Link href="/feed" className="text-lg font-bold tracking-tight">
        <span className="text-primary">Bet</span>
        <span className="text-foreground">Tok</span>
      </Link>
      <Link
        href="/wallet"
        className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-sm font-medium transition-colors hover:bg-secondary/80"
      >
        <Wallet className="h-3.5 w-3.5 text-primary" />
        <span>{wallet ? formatCurrency(wallet.balance) : "..."}</span>
      </Link>
    </header>
  );
}
