import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeftRight, BarChart3, Calculator, ChevronDown, Coins, Copy, RotateCcw, Send } from "lucide-react";
import { OLD_PER_NEW, currencyName, type CurrencyDef } from "@/lib/converter/data";
import { formatNumber, safeEval } from "@/lib/converter/format";
import { t } from "@/lib/converter/i18n";
import { allCurrencies, rateOf } from "@/lib/converter/store";
import { useApp } from "@/lib/converter/settings-context";
import { buildReceipt, copyToClipboard, openWhatsapp } from "@/lib/converter/receipt";
import {
  AppHeader,
  CurrencyMark,
  MOVES,
  Screen,
  StatusStrip,
  SyncFooter,
  Trend,
} from "@/components/converter/shared";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "تحويل العملة — أسعار الصرف المباشرة" },
      {
        name: "description",
        content: "تحويل مباشر بين الليرة القديمة والجديدة والعملات العالمية مع أسعار شراء ومبيع ووضع دون إنترنت.",
      },
      { property: "og:title", content: "تحويل العملة" },
      { property: "og:description", content: "أسعار صرف وتحويل مباشر بين الليرة والعملات العالمية." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "theme-color", content: "#087f67" },
    ],
    links: [{ rel: "manifest", href: `${import.meta.env.BASE_URL}manifest.webmanifest` }],
  }),
  component: Index,
});

function Index() {
  const { settings, update } = useApp();
  const tr = t(settings.lang);
  const [raw, setRaw] = useState("");
  const [numericKeyboard, setNumericKeyboard] = useState(true);
  const [inputCurrency, setInputCurrency] = useState("syp");
  const [manualMode, setManualMode] = useState<"old" | "new" | null>(null);
  const [notice, setNotice] = useState("");

  const currencies = useMemo(
    () => allCurrencies(settings.custom).filter((currency) => settings.enabled.includes(currency.id)),
    [settings.custom, settings.enabled],
  );
  const amount = raw.trim() ? safeEval(raw) : NaN;
  const hasAmount = raw.trim().length > 0;
  const invalid = hasAmount && isNaN(amount);
  const isExpression = /[+\-*/()]/.test(raw);
  const autoMode: "old" | "new" = Math.abs(amount) >= 1000 ? "old" : "new";
  const sypMode = manualMode ?? autoMode;

  let newAmount = NaN;
  if (!isNaN(amount)) {
    newAmount = inputCurrency === "syp"
      ? sypMode === "old" ? amount / OLD_PER_NEW : amount
      : amount * rateOf(settings, inputCurrency);
  }
  const oldAmount = newAmount * OLD_PER_NEW;
  const targetCurrency = currencies.find((currency) => currency.id === settings.targetCurrency);
  const targetRate = targetCurrency ? rateOf(settings, targetCurrency.id) : NaN;
  const targetAmount = targetCurrency && targetRate > 0 ? newAmount / targetRate : newAmount;
  const targetLabel = targetCurrency ? currencyName(targetCurrency, settings.lang) : tr.new;
  const targetId = targetCurrency?.id ?? "syp";

  const inputLabel = inputCurrency === "syp"
    ? `${tr.syp} (${sypMode === "old" ? tr.old : tr.new})`
    : currencyName(currencies.find((c) => c.id === inputCurrency) ?? { id: inputCurrency, nameAr: inputCurrency, nameDe: inputCurrency, symbol: "" }, settings.lang);
  const usedRate = inputCurrency === "syp" ? 1 : rateOf(settings, inputCurrency);

  function receiptText() {
    return buildReceipt([
      tr.receiptTitle,
      `${tr.receiptDate}: ${new Date().toLocaleString(tr.locale, { dateStyle: "short", timeStyle: "short" })}`,
      `${tr.receiptAmount}: ${formatNumber(amount, 2)} ${inputLabel}`,
      `${tr.receiptRate}: 1 ${inputLabel} = ${formatNumber(usedRate, 2)} (${settings.priceMode === "buy" ? tr.buy : tr.sell})`,
      "—",
      `${tr.totalNew}: ${formatNumber(newAmount, 2)}`,
      `${tr.totalOld}: ${formatNumber(oldAmount, 0)}`,
    ]);
  }

  async function copyReceipt() {
    await copyToClipboard(receiptText());
    setNotice(tr.copied);
    setTimeout(() => setNotice(""), 1800);
  }

    return (
    <Screen>
      <AppHeader />
      <StatusStrip />

      <section className="mt-3 rounded-xl border border-border bg-card p-3 shadow-panel sm:p-4">
        <div className="flex items-center justify-between">
          <label htmlFor="amount" className="text-xs font-semibold text-muted-foreground">{tr.inputCurrency}</label>
          <button
            type="button"
            onClick={() => setNumericKeyboard((v) => !v)}
            className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground hover:bg-muted"
            aria-label={tr.toggleKeyboard}
          >
            <Calculator className="size-3.5" />
            {numericKeyboard ? tr.mathKeyboard : tr.numericKeyboard}
          </button>
        </div>
        <div className="mt-1.5 grid grid-cols-[minmax(0,1fr)_9rem] gap-2">
          <input
            id="amount"
            type="text"
            inputMode={numericKeyboard ? "decimal" : "text"}
            autoComplete="off"
            value={raw}
            onChange={(event) => setRaw(event.target.value)}
            placeholder="0"
            className="h-12 min-w-0 rounded-xl border border-input bg-background px-3 text-2xl font-extrabold tabular-nums outline-none focus:ring-2 focus:ring-ring"
          />
          <div className="relative">
            <span className="pointer-events-none absolute start-2 top-1/2 z-10 -translate-y-1/2"><CurrencyMark id={inputCurrency} /></span>
            <select
              id="inputCurrency"
              value={inputCurrency}
              onChange={(event) => { setInputCurrency(event.target.value); setManualMode(null); }}
              className="h-12 w-full appearance-none rounded-xl border border-input bg-background pe-7 ps-9 text-sm font-bold outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="syp">{tr.syp}</option>
              {currencies.map((currency) => <option key={currency.id} value={currency.id}>{currencyName(currency, settings.lang)}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute end-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>
        {invalid && <p className="mt-1 text-xs font-semibold text-loss">{tr.invalid}</p>}
        {!invalid && hasAmount && isExpression && (
          <p className="mt-1 px-1 text-xs font-bold text-primary tabular-nums">{tr.calcResult} = {formatNumber(amount, 2)}</p>
        )}
        {!hasAmount && <p className="mt-1 px-1 text-[11px] text-muted-foreground">{tr.calcHint}</p>}

        {inputCurrency === "syp" && (
          <div className="mt-3 grid grid-cols-2 rounded-full bg-muted p-1">
            {(["old", "new"] as const).map((mode) => (
              <Button
                key={mode}
                variant="ghost"
                onClick={() => setManualMode(mode)}
                className={`h-9 rounded-full text-xs font-bold sm:text-sm ${sypMode === mode ? "bg-primary text-primary-foreground shadow-control hover:bg-primary hover:text-primary-foreground" : "text-muted-foreground"}`}
              >
                {mode === "old" ? tr.old : tr.new}
              </Button>
            ))}
          </div>
        )}

        <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{tr.priceModeHint}</span>
            <Button variant="secondary" size="sm" className="h-8 rounded-full px-3 font-bold text-primary" onClick={() => update({ priceMode: settings.priceMode === "buy" ? "sell" : "buy" })}>
              <ArrowLeftRight /> {settings.priceMode === "buy" ? tr.buy : tr.sell}
            </Button>
          </div>
          <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => { setRaw(""); setManualMode(null); }}>
            <RotateCcw /> {tr.reset}
          </Button>
        </div>
      </section>

      <section className="mt-3 space-y-2.5">
        <div className="hero-surface hero-waves relative isolate flex min-h-24 items-center gap-3 overflow-hidden rounded-xl p-4 text-hero-foreground shadow-panel">
          <CurrencyMark id={targetId} large />
          <div className="relative z-10 min-w-0 flex-1">
            <div className="truncate text-xs font-semibold opacity-90">{targetLabel} {targetCurrency?.symbol ?? ""}</div>
            <div className="mt-0.5 flex flex-wrap items-end gap-x-3 gap-y-1">
              <strong className="min-w-0 break-all text-4xl font-black leading-none tabular-nums sm:text-5xl">{isNaN(targetAmount) ? "—" : formatNumber(targetAmount, 2)}</strong>
              <Trend value={0.32} />
            </div>
          </div>
        </div>

        {settings.targetCurrency === "syp" && (
          <div className="flex min-h-20 items-center gap-3 rounded-xl border border-border bg-card p-3.5 shadow-panel">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-secondary text-secondary-foreground"><Coins className="size-6" /></span>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-muted-foreground">{tr.old}</div>
              <div className="mt-0.5 flex flex-wrap items-end gap-x-3 gap-y-1">
                <strong className="break-all text-3xl font-black leading-none tabular-nums">{isNaN(oldAmount) ? "—" : formatNumber(oldAmount, 0)}</strong>
                <Trend value={-0.28} />
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="mt-3 overflow-hidden rounded-xl border border-border bg-card shadow-panel">
        <div className="flex h-11 items-center justify-between border-b border-border px-3.5">
          <div className="flex items-center gap-2 text-sm font-extrabold"><BarChart3 className="size-4 text-primary" />{tr.exchangeRates}</div>
          <ChevronDown className="size-4 -rotate-90 text-muted-foreground rtl:rotate-90" />
        </div>
        <div className="divide-y divide-border px-3.5">
          {settings.targetCurrency !== "syp" && (
            <>
              <div className="grid h-11 grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                <div className="flex min-w-0 items-center gap-2"><CurrencyMark id="syp" /><span className="truncate text-xs font-semibold">{tr.new}</span></div>
                <strong className="text-sm tabular-nums">{isNaN(newAmount) ? "—" : formatNumber(newAmount, 2)}</strong>
              </div>
              <div className="grid h-11 grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                <div className="flex min-w-0 items-center gap-2"><span className="grid size-7 place-items-center rounded-full bg-secondary"><Coins className="size-4" /></span><span className="truncate text-xs font-semibold">{tr.old}</span></div>
                <strong className="text-sm tabular-nums">{isNaN(oldAmount) ? "—" : formatNumber(oldAmount, 0)}</strong>
              </div>
            </>
          )}
          {currencies.filter((currency) => currency.id !== settings.targetCurrency).map((currency: CurrencyDef) => {
            const rate = rateOf(settings, currency.id);
            const value = isNaN(newAmount) || !(rate > 0) ? NaN : newAmount / rate;
            const move = MOVES[currency.id] ?? 0.11;
            return (
              <div key={currency.id} className="grid min-h-11 grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2.5 py-1.5">
                <div className="flex min-w-0 items-center gap-2">
                  <CurrencyMark id={currency.id} />
                  <span className="truncate text-xs font-semibold sm:text-sm">{currencyName(currency, settings.lang)}</span>
                  <span className="shrink-0 text-[10px] text-muted-foreground">{currency.symbol}</span>
                </div>
                <Trend value={move} />
                <strong className="min-w-14 text-end text-sm font-extrabold tabular-nums">{isNaN(value) ? "—" : formatNumber(value, 2)}</strong>
              </div>
            );
          })}
        </div>
      </section>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button variant="outline" className="h-11 rounded-xl font-bold" disabled={isNaN(newAmount)} onClick={() => void copyReceipt()}>
          <Copy /> {tr.copyReceipt}
        </Button>
        <Button className="h-11 rounded-xl font-bold" disabled={isNaN(newAmount)} onClick={() => openWhatsapp(receiptText())}>
          <Send /> {tr.whatsappShare}
        </Button>
      </div>
      {notice && <p className="mt-2 text-center text-xs font-bold text-primary">{notice}</p>}

      <SyncFooter />
    </Screen>
  );
}
