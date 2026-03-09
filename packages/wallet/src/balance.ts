import type { WalletTransaction, WalletHold } from "@bettok/types";

export function calculateAvailableBalance(
  transactions: Pick<WalletTransaction, "type" | "amount">[],
  activeHolds: Pick<WalletHold, "amount" | "status">[]
): number {
  const ledgerBalance = transactions.reduce((sum, tx) => {
    return sum + tx.amount;
  }, 0);

  const holdTotal = activeHolds
    .filter((h) => h.status === "active")
    .reduce((sum, h) => sum + h.amount, 0);

  return Math.max(0, ledgerBalance - holdTotal);
}

export function canAffordBet(
  availableBalance: number,
  stakeAmount: number
): boolean {
  return availableBalance >= stakeAmount && stakeAmount > 0;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
