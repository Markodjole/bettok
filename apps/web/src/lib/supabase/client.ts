import { createBrowserClient as createClient } from "@supabase/ssr";

let browserClient: ReturnType<typeof createClient> | null = null;

/** Single shared Supabase client to avoid auth lock conflicts. */
export function createBrowserClient() {
  if (browserClient) return browserClient;
  browserClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  return browserClient;
}

/** Serialize auth access to prevent "Lock broken by another request with the 'steal' option". */
let authQueue: Promise<unknown> = Promise.resolve(undefined);

function runAuth<T>(fn: () => Promise<T>): Promise<T> {
  const next = authQueue.then(() => fn());
  authQueue = next.catch(() => undefined);
  return next as Promise<T>;
}

/** Use this instead of supabase.auth.getSession() so only one auth op runs at a time. */
export function getSessionQueued() {
  return runAuth(() => createBrowserClient().auth.getSession());
}

/** Use this instead of supabase.auth.getUser() so only one auth op runs at a time. */
export function getUserQueued() {
  return runAuth(() => createBrowserClient().auth.getUser());
}
