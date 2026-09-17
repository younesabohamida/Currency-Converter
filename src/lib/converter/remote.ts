import type { RateEntry } from "./data";

/** رمز ISO لكل عملة في التطبيق (للجلب من واجهات الأسعار المجانية) */
export const ISO_CODES: Record<string, string> = {
  usd: "USD",
  eur: "EUR",
  sar: "SAR",
  aed: "AED",
  try: "TRY",
  egp: "EGP",
  mad: "MAD",
  kwd: "KWD",
  qar: "QAR",
  jod: "JOD",
  gbp: "GBP",
  chf: "CHF",
  rub: "RUB",
  iqd: "IQD",
  lbp: "LBP",
};

export type SyncSource = "github" | "fx";

export interface RemoteResult {
  rates: Record<string, RateEntry>;
  updatedAt: string;
  source: SyncSource;
}

function entry(v: unknown): RateEntry | null {
  if (typeof v === "number" && v > 0) return { buy: v, sell: v };
  if (v && typeof v === "object") {
    const o = v as { buy?: unknown; sell?: unknown };
    const buy = Number(o.buy);
    const sell = Number(o.sell);
    if (buy > 0 || sell > 0) {
      return { buy: buy > 0 ? buy : sell, sell: sell > 0 ? sell : buy };
    }
  }
  return null;
}

/**
 * جلب ملف rates.json من GitHub (raw) — الصيغة:
 * { "updatedAt": "...", "rates": { "usd": { "buy": 114, "sell": 116 }, "eur": 131 } }
 * كل القيم = عدد الليرات السورية الجديدة لوحدة واحدة.
 */
export async function fetchGithubRates(url: string): Promise<RemoteResult | null> {
  if (!url.trim()) return null;
  try {
    const res = await fetch(url.trim(), { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as { updatedAt?: string; rates?: Record<string, unknown> };
    const src = data.rates ?? (data as unknown as Record<string, unknown>);
    const rates: Record<string, RateEntry> = {};
    for (const [id, value] of Object.entries(src)) {
      const e = entry(value);
      if (e) rates[id] = e;
    }
    if (!Object.keys(rates).length) return null;
    return { rates, updatedAt: data.updatedAt || new Date().toISOString(), source: "github" };
  } catch {
    return null;
  }
}

async function usdCrossRates(): Promise<Record<string, number> | null> {
  const sources = [
    "https://open.er-api.com/v6/latest/USD",
    "https://api.frankfurter.app/latest?from=USD",
  ];
  for (const url of sources) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) continue;
      const data = (await res.json()) as { rates?: Record<string, number> };
      if (data.rates && Object.keys(data.rates).length) return data.rates;
    } catch {
      /* نتابع مع المصدر التالي */
    }
  }
  return null;
}

/**
 * احتساب أسعار العملات العالمية انطلاقاً من سعر الدولار المحلي (الذي يحدده المستخدم)
 * وأسعار الصرف العالمية المجانية: سعر العملة = سعر الدولار ÷ (وحدات العملة لكل دولار).
 */
export async function fetchFxRates(usd: RateEntry): Promise<RemoteResult | null> {
  const anchorBuy = usd.buy > 0 ? usd.buy : usd.sell;
  const anchorSell = usd.sell > 0 ? usd.sell : usd.buy;
  if (!(anchorBuy > 0) || !(anchorSell > 0)) return null;
  const cross = await usdCrossRates();
  if (!cross) return null;

  const rates: Record<string, RateEntry> = { usd: { buy: anchorBuy, sell: anchorSell } };
  for (const [id, code] of Object.entries(ISO_CODES)) {
    if (id === "usd") continue;
    const perUsd = Number(cross[code]);
    if (!(perUsd > 0)) continue;
    rates[id] = { buy: anchorBuy / perUsd, sell: anchorSell / perUsd };
  }
  rates["usdt"] = { buy: anchorBuy, sell: anchorSell };
  return { rates, updatedAt: new Date().toISOString(), source: "fx" };
}

export async function syncRates(url: string, usd: RateEntry): Promise<RemoteResult | null> {
  return (await fetchGithubRates(url)) ?? (await fetchFxRates(usd));
}
