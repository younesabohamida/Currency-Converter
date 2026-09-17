import { ChevronDown, Globe2, Moon, RefreshCw, Sun, TrendingDown, TrendingUp } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { t } from "@/lib/converter/i18n";
import type { Lang } from "@/lib/converter/data";
import { useApp } from "@/lib/converter/settings-context";
import { Button } from "@/components/ui/button";

export const FLAGS: Record<string, string> = {
  syp: "sy", usd: "us", eur: "eu", sar: "sa", aed: "ae", try: "tr",
  egp: "eg", mad: "ma", kwd: "kw", qar: "qa", jod: "jo", gbp: "gb",
  cad: "ca", chf: "ch", rub: "ru", iqd: "iq", lbp: "lb",
};

export const MOVES: Record<string, number> = {
  usd: 0.15, eur: -0.12, sar: 0.21, aed: 0.18, try: -0.33, egp: 0.09,
  usdt: 0.07, gold21: 0.26, mad: -0.08,
};

export function CurrencyMark({ id, large = false }: { id: string; large?: boolean }) {
  const countryCode = FLAGS[id];
  const fallback = id === "usdt" ? "₮" : id === "gold21" ? "◆" : "¤";
  return (
    <span
      aria-hidden="true"
      className={`flag-mark relative grid shrink-0 place-items-center overflow-hidden rounded-full border border-border bg-surface-raised shadow-control ${
        large ? "size-12 text-base sm:size-14 sm:text-lg" : "size-7 text-[9px]"
      }`}
    >
      {countryCode ? (
        <span className={`fi fi-${countryCode} fis absolute inset-0`} />
      ) : (
        <span className={`flag-symbol flag-symbol-${id}`}>{fallback}</span>
      )}
    </span>
  );
}

export function Trend({ value }: { value: number }) {
  const up = value >= 0;
  return (
    <span className={`flex shrink-0 items-center gap-1 text-[11px] font-bold tabular-nums ${up ? "text-success" : "text-loss"}`}>
      {up ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
      {up ? "+" : ""}{value.toFixed(2)}%
    </span>
  );
}

export function AppHeader({ title, subtitle }: { title?: string; subtitle?: string }) {
  const { settings, update } = useApp();
  const tr = t(settings.lang);
  
  return (
    <header className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="grid size-11 shrink-0 place-items-center rounded-full bg-primary text-2xl font-black text-primary-foreground shadow-control sm:size-12">£</div>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-extrabold leading-tight sm:text-2xl">{title ?? tr.title}</h1>
          <p className="truncate text-xs font-medium text-muted-foreground">{subtitle ?? tr.subtitle}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <div className="relative">
          <select
            aria-label={tr.language}
            value={settings.lang}
            onChange={(event) => update({ lang: event.target.value as Lang })}
            className="h-9 appearance-none rounded-xl border border-input bg-card py-0 pe-7 ps-2.5 text-xs font-bold shadow-control outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="en">EN</option><option value="ar">AR</option><option value="de">DE</option>
          </select>
          <ChevronDown className="pointer-events-none absolute end-2 top-1/2 size-3 -translate-y-1/2 text-muted-foreground" />
        </div>
        <Button variant="outline" size="icon" className="size-9 rounded-xl shadow-control" aria-label={tr.theme} onClick={() => update({ dark: !settings.dark })}>
          {settings.dark ? <Sun /> : <Moon />}
        </Button>
      </div>
    </header>
  );
}

export function StatusStrip() {
  const { settings, sync, syncStatus, isOnline } = useApp();
  const tr = t(settings.lang);
  const healthy = isOnline && syncStatus !== "error";
  return (
    <div className="mt-3 flex h-9 items-center justify-between rounded-xl bg-secondary px-3 text-[11px] font-semibold text-secondary-foreground sm:text-xs">
      <div className="flex min-w-0 items-center gap-2">
        <Globe2 className="size-4 shrink-0 text-primary" />
        <span className="truncate">{tr.old} ↔ {tr.new}</span><span className="text-muted-foreground">•</span>
        <span className="truncate text-muted-foreground">{tr.worldCurrencies}</span>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="flex items-center gap-1.5">
          <span className={`size-2 rounded-full ${healthy ? "status-dot-online bg-success" : "bg-loss"}`} />
          {healthy ? tr.live : tr.cachedStatus}
        </span>
        <Button variant="ghost" size="icon" className="size-7 rounded-full text-primary" onClick={() => void sync()} disabled={syncStatus === "syncing"} aria-label={tr.syncNow}>
          <RefreshCw className={syncStatus === "syncing" ? "animate-spin" : ""} />
        </Button>
      </div>
    </div>
  );
}

export function SyncFooter() {
  const { settings, sync, syncStatus } = useApp();
  const tr = t(settings.lang);
  return (
    <footer className="mt-3 flex items-center justify-between gap-3 px-1 text-[10px] text-muted-foreground">
      <span className="truncate">
        {syncStatus === "ok"
          ? tr.syncedNow
          : settings.syncedAt
            ? tr.syncSaved(new Date(settings.syncedAt).toLocaleString(tr.locale, { dateStyle: "short", timeStyle: "short" }))
            : tr.syncNone}
      </span>
      <Button variant="ghost" size="sm" className="h-7 shrink-0 px-2 text-[10px]" onClick={() => void sync()} disabled={syncStatus === "syncing"}>
        <RefreshCw className={syncStatus === "syncing" ? "animate-spin" : ""} />{tr.syncNow}
      </Button>
    </footer>
  );
}

export function Screen({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto w-full max-w-[460px] px-3 pb-28 pt-3 sm:max-w-2xl sm:px-5 sm:pb-32 sm:pt-5">{children}</main>
    </div>
  );
}

export { Link };
