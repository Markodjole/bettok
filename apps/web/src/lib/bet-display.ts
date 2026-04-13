/** Human phrases for markets (yes/no) and clip resolution lines. */

function stripTrailingQuestion(s: string): string {
  return s.replace(/\?\s*$/, "").trim();
}

function lcFirst(s: string): string {
  if (!s) return s;
  return s.charAt(0).toLowerCase() + s.slice(1);
}

/** How the user framed their side in plain language. */
export function describeUserBet(sideKey: string, canonicalText: string): string {
  const raw = canonicalText.replace(/\s+/g, " ").trim();
  const t = stripTrailingQuestion(raw);
  const startsWill = /^will\b/i.test(t);

  if (sideKey === "yes") {
    if (startsWill) return t;
    if (raw.endsWith("?")) return `Yes — ${stripTrailingQuestion(raw)}`;
    return `Yes: ${t}`;
  }

  if (startsWill) {
    const rest = t.replace(/^will\s+/i, "").trim();
    return `Will not ${lcFirst(rest)}`;
  }
  if (raw.endsWith("?")) return `No — ${stripTrailingQuestion(raw)}`;
  return `No: ${t}`;
}

/** What actually resolved for one market (for “what hit” list). */
export function marketResolvedPhrase(canonicalText: string, winnerSide: "yes" | "no"): string {
  const raw = canonicalText.replace(/\s+/g, " ").trim();
  const t = stripTrailingQuestion(raw);
  const startsWill = /^will\b/i.test(t);

  if (winnerSide === "yes") {
    if (startsWill) return t;
    return `Yes — ${t}`;
  }

  if (startsWill) {
    const rest = t.replace(/^will\s+/i, "").trim();
    return `Will not ${lcFirst(rest)}`;
  }
  return `No — ${t}`;
}

/** Parse `Market results: A: YES · B: NO` from resolution_reason_text. */
export function parseMarketResultsFromResolutionText(text: string): Array<{
  winner_side: "yes" | "no";
  canonical_text: string;
}> {
  const m = text.match(/Market results:\s*([^\n]+)/i);
  if (!m?.[1]) return [];
  const parts = m[1].split(/\s*·\s*/);
  const out: Array<{ winner_side: "yes" | "no"; canonical_text: string }> = [];
  for (const p of parts) {
    const mm = p.trim().match(/^(.+?):\s*(YES|NO)\s*$/i);
    if (!mm) continue;
    out.push({
      canonical_text: mm[1].trim(),
      winner_side: mm[2].toUpperCase() === "YES" ? "yes" : "no",
    });
  }
  return out;
}
