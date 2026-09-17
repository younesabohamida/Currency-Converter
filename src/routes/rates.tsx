import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { BarChart3, Search } from "lucide-react";
import { currencyName } from "@/lib/converter/data";
import { formatNumber } from "@/lib/converter/format";
import { t } from "@/lib/converter/i18n";
import { allCurrencies } from "@/lib/converter/store";
import { useApp } from "@/lib/converter/settings-context";
import { AppHeader, CurrencyMark, MOVES, Screen, StatusStrip, SyncFooter, Trend } from "@/components/converter/shared";

export const Route = createFileRoute("/rates")({
  head: () => ({
    meta: [
      { title: "أسعار الصرف والذهب — تحويل العملة" },
      { name: "description", content: "أسعار شراء ومبيع العملات وغرام الذهب مع نسبة التغير اليومي وبحث فوري." },
      { property: "og:title", content: "أسعار الصرف والذهب" },
      { property: "og:description", content: "أسعار شراء ومبيع العملات وغرام الذهب مع نسبة التغير اليومي." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RatesScreen,
});

function RatesScreen() {
  const { settings } = useApp();
  const tr = t(settings.lang);
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allCurrencies(settings.custom)
      .filter((currency) => settings.enabled.includes(currency.id))
      .filter((currency) =>
        !q ||
        currencyName(currency, settings.lang).toLowerCase().includes(q) ||
        currency.symbol.toLowerCase().includes(q) ||
        currency.id.includes(q),
      );
  }, [query, settings.custom, settings.enabled, settings.lang]);

  return (
    <Screen>
      <AppHeader title={tr.exchangeRates} subtitle={tr.ratesScreenSubtitle} />
      <StatusStrip />

      <div className="relative mt-3">
        <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={tr.searchCurrency}
          aria-label={tr.searchCurrency}
          className="h-11 w-full rounded-xl border border-input bg-card ps-9 pe-3 text-sm font-semibold shadow-control outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <section className="mt-3 overflow-hidden rounded-xl border border-border bg-card shadow-panel">
        <div className="flex h-11 items-center justify-between border-b border-border px-3.5 text-sm font-extrabold">
          <span className="flex items-center gap-2"><BarChart3 className="size-4 text-primary" />{tr.exchangeRates}</span>
          <span className="text-[11px] font-semibold text-muted-foreground">{tr.buy} / {tr.sell}</span>
        </div>
        <div className="divide-y divide-border px-3.5">
          {rows.map((currency) => {
            const entry = settings.rates[currency.id];
            const move = MOVES[currency.id] ?? 0.11;
            return (
              <div key={currency.id} className="grid min-h-14 grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2.5 py-2">
                <div className="flex min-w-0 items-center gap-2">
                  <CurrencyMark id={currency.id} />
                  <div className="min-w-0">
                    <div className="truncate text-xs font-bold sm:text-sm">{currencyName(currency, settings.lang)}</div>
                    <div className="text-[10px] text-muted-foreground">{currency.symbol}</div>
                  </div>
                </div>
                <Trend value={move} />
                <div className="min-w-20 text-end">
                  <strong className="block text-sm font-extrabold tabular-nums">{entry ? formatNumber(entry.sell, 2) : "—"}</strong>
                  <span className="text-[10px] text-muted-foreground tabular-nums">{entry ? formatNumber(entry.buy, 2) : "—"}</span>
                </div>
              </div>
            );
          })}
          {rows.length === 0 && (
            <p className="py-6 text-center text-xs font-semibold text-muted-foreground">{tr.noResults}</p>
          )}
        </div>
      </section>

      <SyncFooter />
    </Screen>
  );
}
