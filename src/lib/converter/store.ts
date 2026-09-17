import { useCallback, useEffect, useRef, useState } from "react";

export type SyncStatus = "idle" | "syncing" | "ok" | "error";
import {
  BUILTIN_CURRENCIES,
  DEFAULT_ENABLED,
  DEFAULT_RATES,
  SUGGESTED_CURRENCIES,
  type CurrencyDef,
  type Lang,
  type PriceMode,
  type RateEntry,
} from "./data";
import { syncRates, type SyncSource } from "./remote";

const KEY = "syr_converter_v2";

export interface Settings {
  version: 2;
  lang: Lang;
  dark: boolean;
  priceMode: PriceMode;
  targetCurrency: string;
  rates: Record<string, RateEntry>;
  custom: CurrencyDef[];
  enabled: string[];
  updatedAt: string;
  /** رابط ملف rates.json على GitHub (raw) */
  ratesUrl: string;
  autoSync: boolean;
  syncedAt: string;
  syncSource: SyncSource | null;
}

export const DEFAULT_RATES_URL = `${import.meta.env.BASE_URL}rates.json`;

export function defaultSettings(): Settings {
  return {
    version: 2,
    lang: "ar",
    dark: false,
    priceMode: "sell",
    targetCurrency: "syp",
    rates: { ...DEFAULT_RATES },
    custom: [],
    enabled: [...DEFAULT_ENABLED],
    updatedAt: new Date().toISOString(),
    ratesUrl: DEFAULT_RATES_URL,
    autoSync: true,
    syncedAt: "",
    syncSource: null,
  };
}

function migrateLegacy(base: Settings): Settings {
  try {
    const legacy = localStorage.getItem("syr_local_rate");
    if (legacy) {
      const parsed = JSON.parse(legacy) as Record<string, number>;
      for (const id of ["usd", "eur", "sar", "try", "egp", "mad"]) {
        const v = Number(parsed[id]);
        if (v > 0) base.rates[id] = { buy: v, sell: v };
      }
    }
    const lang = localStorage.getItem("syr_lang");
    if (lang === "ar" || lang === "de") base.lang = lang;
  } catch {
    /* تجاهل البيانات التالفة */
  }
  return base;
}

function load(): Settings {
  const base = defaultSettings();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return migrateLegacy(base);
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return {
      ...base,
      ...parsed,
      version: 2,
      rates: { ...base.rates, ...(parsed.rates ?? {}) },
      custom: parsed.custom ?? [],
      enabled: parsed.enabled?.length ? parsed.enabled : base.enabled,
    };
  } catch {
    return base;
  }
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSettings(load());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(KEY, JSON.stringify(settings));
  }, [settings, ready]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("dark", settings.dark);
    document.documentElement.lang = settings.lang;
    document.documentElement.dir = settings.lang === "ar" ? "rtl" : "ltr";
  }, [settings.dark, settings.lang]);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const setRate = useCallback((id: string, mode: PriceMode, value: number) => {
    setSettings((prev) => {
      const entry = prev.rates[id] ?? { buy: value, sell: value };
      const next = { ...entry, [mode]: value };
      if (!(next.buy > 0)) next.buy = next.sell;
      if (!(next.sell > 0)) next.sell = next.buy;
      return {
        ...prev,
        rates: { ...prev.rates, [id]: next },
        updatedAt: new Date().toISOString(),
      };
    });
  }, []);

  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const refreshConnection = () => setIsOnline(navigator.onLine);
    refreshConnection();
    window.addEventListener("online", refreshConnection);
    window.addEventListener("offline", refreshConnection);
    return () => {
      window.removeEventListener("online", refreshConnection);
      window.removeEventListener("offline", refreshConnection);
    };
  }, []);

  const sync = useCallback(async () => {
    const current = settingsRef.current;
    if (!navigator.onLine) {
      setSyncStatus("error");
      setIsOnline(false);
      return;
    }
    setSyncStatus("syncing");
    const result = await syncRates(
      current.ratesUrl,
      current.rates["usd"] ?? { buy: 0, sell: 0 },
    );
    if (!result) {
      setSyncStatus("error");
      return;
    }
    setSettings((prev) => ({
      ...prev,
      rates: { ...prev.rates, ...result.rates },
      syncedAt: result.updatedAt,
      syncSource: result.source,
      updatedAt: result.updatedAt,
    }));
    setSyncStatus("ok");
  }, []);

  useEffect(() => {
    if (!ready || !settings.autoSync) return;
    void sync();
    const id = setInterval(() => void sync(), 10 * 60 * 1000);
    const onOnline = () => void sync();
    window.addEventListener("online", onOnline);
    return () => {
      clearInterval(id);
      window.removeEventListener("online", onOnline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, settings.autoSync, settings.ratesUrl, sync]);

  return { settings, ready, update, setRate, sync, syncStatus, isOnline };
}

export function allCurrencies(custom: CurrencyDef[]): CurrencyDef[] {
  return [...BUILTIN_CURRENCIES, ...SUGGESTED_CURRENCIES, ...custom];
}

export function findCurrency(id: string, custom: CurrencyDef[]): CurrencyDef | undefined {
  return allCurrencies(custom).find((c) => c.id === id);
}

export function rateOf(settings: Settings, id: string): number {
  const entry = settings.rates[id];
  if (!entry) return NaN;
  const v = settings.priceMode === "buy" ? entry.buy : entry.sell;
  return v > 0 ? v : entry.buy || entry.sell;
}
