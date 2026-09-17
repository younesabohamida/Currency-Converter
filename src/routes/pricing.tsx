import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronDown, Coins, Copy, Percent, Send } from "lucide-react";
import { OLD_PER_NEW, currencyName } from "@/lib/converter/data";
import { formatNumber, safeEval } from "@/lib/converter/format";
import { t } from "@/lib/converter/i18n";
import { allCurrencies, rateOf } from "@/lib/converter/store";
import { useApp } from "@/lib/converter/settings-context";
import { buildReceipt, copyToClipboard, openWhatsapp } from "@/lib/converter/receipt";
import { AppHeader, CurrencyMark, Screen, Trend } from "@/components/converter/shared";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "تسعير البضائع وهامش الربح — تحويل العملة" },
      { name: "description", content: "أدخل تكلفة القطعة بالدولار أو أي عملة ونسبة الربح ليُحسب سعر البيع بالليرة الجديدة والقديمة فوراً." },
      { property: "og:title", content: "تسعير البضائع وهامش الربح" },
      { property: "og:description", content: "حساب سعر البيع بالليرة من التكلفة بالعملة الأجنبية ونسبة الربح." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PricingScreen,
});

const PRESETS = [5, 10, 15, 20, 30];

function PricingScreen() {
  const { settings } = useApp();
  const tr = t(settings.lang);
  const [raw, setRaw] = useState("");
  const [currency, setCurrency] = useState("usd");
  const [margin, setMargin] = useState("15");
  const [saleCurrency, setSaleCurrency] = useState("syp");
  const [notice, setNotice] = useState("");

  const currencies = useMemo(
    () => allCurrencies(settings.custom).filter((c) => settings.enabled.includes(c.id)),
    [settings.custom, settings.enabled],
  );

  const cost = raw.trim() ? safeEval(raw) : NaN;
  const marginPct = margin.trim() ? safeEval(margin) : 0;
  const rate = currency === "syp" ? 1 : rateOf(settings, currency);
  const costNew = isNaN(cost) || !(rate > 0) ? NaN : cost * rate;
  const saleNew = isNaN(costNew) || isNaN(marginPct) ? NaN : costNew * (1 + marginPct / 100);
  const saleOld = saleNew * OLD_PER_NEW;
  const profit = saleNew - costNew;
  const currencyLabel = currency === "syp"
    ? tr.syp
    : currencyName(currencies.find((c) => c.id === currency) ?? { id: currency, nameAr: currency, nameDe: currency, symbol: "" }, settings.lang);
  const nameOf = (id: string) =>
    id === "syp"
      ? tr.syp
      : currencyName(currencies.find((c) => c.id === id) ?? { id, nameAr: id, nameDe: id, symbol: "" }, settings.lang);
  const saleCurrencyLabel = nameOf(saleCurrency);
  const saleRate = saleCurrency === "syp" ? 1 : rateOf(settings, saleCurrency);
  const saleInCurrency = isNaN(saleNew) || !(saleRate > 0) ? NaN : saleNew / saleRate;
  const profitInCurrency = isNaN(profit) || !(saleRate > 0) ? NaN : profit / saleRate;

  function receipt() {
    return buildReceipt([
      tr.pricingTitle,
      `${tr.receiptDate}: ${new Date().toLocaleString(tr.locale, { dateStyle: "short", timeStyle: "short" })}`,
      `${tr.pricingCost}: ${formatNumber(cost, 2)} ${currencyLabel}`,
      `${tr.receiptRate}: 1 ${currencyLabel} = ${formatNumber(rate, 2)} (${settings.priceMode === "buy" ? tr.buy : tr.sell})`,
      `${tr.pricingMargin}: ${formatNumber(marginPct, 2)}%`,
      "—",
      saleCurrency === "syp"
        ? `${tr.pricingSaleNew}: ${formatNumber(saleNew, 2)}`
        : `${tr.pricingSaleIn(saleCurrencyLabel)}: ${formatNumber(saleInCurrency, 2)}`,
      saleCurrency === "syp" ? `${tr.pricingSaleOld}: ${formatNumber(saleOld, 0)}` : "",
      saleCurrency === "syp"
        ? `${tr.pricingProfit}: ${formatNumber(profit, 2)}`
        : `${tr.pricingProfitIn(saleCurrencyLabel)}: ${formatNumber(profitInCurrency, 2)}`,
    ]);
  }

  async function copy() {
    await copyToClipboard(receipt());
    setNotice(tr.copied);
    setTimeout(() => setNotice(""), 1800);
  }

  return (
    <Screen>
      <AppHeader title={tr.pricingTitle} subtitle={tr.pricingSubtitle} />

      <section className="mt-3 rounded-xl border border-border bg-card p-3 shadow-panel sm:p-4">
        <p className="text-xs font-medium text-muted-foreground">{tr.pricingHint(saleCurrencyLabel)}</p>

        <label htmlFor="cost" className="mt-3 block text-xs font-semibold text-muted-foreground">{tr.pricingCost}</label>
        <div className="mt-1.5 grid grid-cols-[minmax(0,1fr)_9rem] gap-2">
          <input
            id="cost"
            value={raw}
            onChange={(event) => setRaw(event.target.value)}
            inputMode="text"
            placeholder="0"
            className="h-12 min-w-0 rounded-xl border border-input bg-background px-3 text-2xl font-extrabold tabular-nums outline-none focus:ring-2 focus:ring-ring"
          />
          <div className="relative">
            <span className="pointer-events-none absolute start-2 top-1/2 z-10 -translate-y-1/2"><CurrencyMark id={currency} /></span>
            <select
              value={currency}
              onChange={(event) => setCurrency(event.target.value)}
              aria-label={tr.inputCurrency}
              className="h-12 w-full appearance-none rounded-xl border border-input bg-background pe-7 ps-9 text-sm font-bold outline-none focus:ring-2 focus:ring-ring"
            >
              {currencies.map((c) => <option key={c.id} value={c.id}>{currencyName(c, settings.lang)}</option>)}
              <option value="syp">{tr.syp}</option>
            </select>
            <ChevronDown className="pointer-events-none absolute end-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>

        <label htmlFor="margin" className="mt-3 block text-xs font-semibold text-muted-foreground">{tr.pricingMargin}</label>
        <div className="mt-1.5 flex items-center gap-2">
          <div className="relative w-28">
            <input
              id="margin"
              value={margin}
              onChange={(event) => setMargin(event.target.value)}
              inputMode="decimal"
              className="h-11 w-full rounded-xl border border-input bg-background px-3 pe-8 text-lg font-extrabold tabular-nums outline-none focus:ring-2 focus:ring-ring"
            />
            <Percent className="pointer-events-none absolute end-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          </div>
          <div className="flex flex-1 flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              <Button
                key={p}
                variant={margin === String(p) ? "default" : "secondary"}
                size="sm"
                className="h-9 rounded-full px-3 text-xs font-bold"
                onClick={() => setMargin(String(p))}
              >
                {p}%
              </Button>
            ))}
          </div>
        </div>

        <label htmlFor="sale-currency" className="mt-3 block text-xs font-semibold text-muted-foreground">{tr.pricingSaleCurrency}</label>
        <div className="relative mt-1.5">
          <span className="pointer-events-none absolute start-2 top-1/2 z-10 -translate-y-1/2"><CurrencyMark id={saleCurrency} /></span>
          <select
            id="sale-currency"
            value={saleCurrency}
            onChange={(event) => setSaleCurrency(event.target.value)}
            className="h-11 w-full appearance-none rounded-xl border border-input bg-background pe-7 ps-10 text-sm font-bold outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="syp">{tr.syp}</option>
            {currencies.map((c) => <option key={c.id} value={c.id}>{currencyName(c, settings.lang)}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute end-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        </div>


        {saleCurrency === "syp" && !isNaN(costNew) && (
          <p className="mt-2 px-1 text-[11px] font-bold text-muted-foreground tabular-nums">
            {tr.pricingCostInPounds}: {formatNumber(costNew, 2)}
          </p>
        )}
      </section>

      <section className="mt-3 space-y-2.5">
        <div className="hero-surface hero-waves relative isolate flex min-h-24 items-center gap-3 overflow-hidden rounded-xl p-4 text-hero-foreground shadow-panel">
          <CurrencyMark id={saleCurrency} large />
          <div className="relative z-10 min-w-0 flex-1">
            <div className="truncate text-xs font-semibold opacity-90">
              {saleCurrency === "syp" ? tr.pricingSaleNew : tr.pricingSaleIn(saleCurrencyLabel)}
            </div>
            <div className="mt-0.5 flex flex-wrap items-end gap-x-3 gap-y-1">
              <strong className="min-w-0 break-all text-4xl font-black leading-none tabular-nums sm:text-5xl">
                {saleCurrency === "syp"
                  ? isNaN(saleNew) ? "—" : formatNumber(saleNew, 2)
                  : isNaN(saleInCurrency) ? "—" : formatNumber(saleInCurrency, 2)}
              </strong>
              <Trend value={isNaN(marginPct) ? 0 : marginPct} />
            </div>
          </div>
        </div>

        {saleCurrency === "syp" && (
          <div className="flex min-h-20 items-center gap-3 rounded-xl border border-border bg-card p-3.5 shadow-panel">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-secondary text-secondary-foreground"><Coins className="size-6" /></span>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-muted-foreground">{tr.pricingSaleOld}</div>
              <strong className="mt-0.5 block break-all text-3xl font-black leading-none tabular-nums">{isNaN(saleOld) ? "—" : formatNumber(saleOld, 0)}</strong>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between rounded-xl border border-border bg-card px-3.5 py-3 shadow-panel">
          <span className="text-xs font-semibold text-muted-foreground">
            {saleCurrency === "syp" ? tr.pricingProfit : tr.pricingProfitIn(saleCurrencyLabel)}
          </span>
          <strong className="text-lg font-black text-success tabular-nums">
            {saleCurrency === "syp"
              ? isNaN(profit) ? "—" : formatNumber(profit, 2)
              : isNaN(profitInCurrency) ? "—" : formatNumber(profitInCurrency, 2)}
          </strong>
        </div>
      </section>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button variant="outline" className="h-11 rounded-xl font-bold" disabled={isNaN(saleNew)} onClick={() => void copy()}>
          <Copy /> {tr.copyReceipt}
        </Button>
        <Button className="h-11 rounded-xl font-bold" disabled={isNaN(saleNew)} onClick={() => openWhatsapp(receipt())}>
          <Send /> {tr.whatsappShare}
        </Button>
      </div>
      {notice && <p className="mt-2 text-center text-xs font-bold text-primary">{notice}</p>}
    </Screen>
  );
}
