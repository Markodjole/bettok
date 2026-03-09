"use server";

import { createServerClient, createServiceClient } from "@/lib/supabase/server";

export async function getWallet() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("wallets")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return data;
}

export async function getWalletTransactions(limit = 50) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: wallet } = await supabase
    .from("wallets")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!wallet) return [];

  const { data } = await supabase
    .from("wallet_transactions")
    .select("*")
    .eq("wallet_id", wallet.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  return data || [];
}

export async function depositDemo(amount: number) {
  const supabase = await createServerClient();
  const serviceClient = await createServiceClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  if (amount <= 0 || amount > 100000) {
    return { error: "Invalid amount" };
  }

  const { data: wallet } = await supabase
    .from("wallets")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!wallet) return { error: "Wallet not found" };

  const newBalance = Number(wallet.balance) + amount;

  const { error: txError } = await serviceClient
    .from("wallet_transactions")
    .insert({
      wallet_id: wallet.id,
      type: "deposit_demo",
      amount,
      balance_after: newBalance,
      description: `Demo deposit of $${amount.toFixed(2)}`,
    });

  if (txError) return { error: "Transaction failed" };

  await serviceClient
    .from("wallets")
    .update({
      balance: newBalance,
      total_deposited: Number(wallet.total_deposited) + amount,
    })
    .eq("id", wallet.id);

  return { data: { balance: newBalance } };
}

export async function getAvailableBalance() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;

  const { data: wallet } = await supabase
    .from("wallets")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!wallet) return 0;

  const { data: holds } = await supabase
    .from("wallet_holds")
    .select("amount")
    .eq("wallet_id", wallet.id)
    .eq("status", "active");

  const holdTotal = (holds || []).reduce(
    (sum, h) => sum + Number(h.amount),
    0
  );

  return Math.max(0, Number(wallet.balance) - holdTotal);
}
