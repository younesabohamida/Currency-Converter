import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronDown, Coins, Copy, Plus, Send, Share2, Trash2 } from "lucide-react";
import { openWhatsapp } from "@/lib/converter/receipt";
import { OLD_PER_NEW, currencyName } from "@/lib/converter/data";
import { formatNumber, safeEval } from "@/lib/converter/format";
import { t } from "@/lib/converter/i18n";
import { allCurrencies, rateOf } from "@/lib/converter/store";
import { useApp } from "@/lib/converter/settings-context";
import { useBasket } from "@/lib/converter/basket";
import { AppHeader, CurrencyMark, Screen, Trend } from "@/components/converter/shared";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/basket")({
  head: () => ({
    meta: [
      { title: "سلة المبالغ المتعددة — تحويل العملة" },
      { name: "description", content: "اجمع عدة مبالغ بعملات مختلفة واحسب الإجمالي بالليرة الجديدة والقديمة وانسخه أو شاركه كإيصال." },
      { property: "og:title", content: "سلة المبالغ المتعددة" },
      { property: "og:description", content: "جمع عدة عملات معاً وحساب الإجمالي بالليرة الجديدة والقديمة." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BasketScreen,
});

function BasketScreen() {
  const { settings } = useApp();
  const tr = t(settings.lang);
  const { rows, addRow, patchRow, removeRow, clear } = useBasket();
  const [notice, setNotice] = useState("");

  const currencies = useMemo(
    () => allCurrencies(settings.custom).filter((currency) => settings.enabled.includes(currency.id)),
    [settings.custom, settings.enabled],
  );

  const lines = rows.map((row) => {
    const value = row.raw.trim() ? safeEval(row.raw) : NaN;
    const rate = row.currency === "syp" ? 1 : rateOf(settings, row.currency);
    const newPounds = isNaN(value) || !(rate > 0) ? NaN : value * rate;
    return { row, value, newPounds };
  });

  const totalNew = lines.reduce((sum, line) => (isNaN(line.newPounds) ? sum : sum + line.newPounds), 0);
  const totalOld = totalNew * OLD_PER_NEW;
  const hasAny = lines.some((line) => !isNaN(line.newPounds));

  function receiptText() {
    const label = (id: string) =>
      id === "syp" ? tr.syp : currencyName(currencies.find((c) => c.id === id) ?? { id, nameAr: id, nameDe: id, symbol: "" }, settings.lang);
    const body = lines
      .filter((line) => !isNaN(line.newPounds))
      .map((line) => `${formatNumber(line.value, 2)} ${label(line.row.currency)} = ${formatNumber(line.newPounds, 2)}`)
      .join("\n");
    return [
      tr.receiptTitle,
      new Date().toLocaleString(tr.locale, { dateStyle: "short", timeStyle: "short" }),
      `${tr.priceModeHint}: ${settings.priceMode === "buy" ? tr.buy : tr.sell}`,
      "—",
      body,
      "—",
      `${tr.totalNew}: ${formatNumber(totalNew, 2)}`,
      `${tr.totalOld}: ${formatNumber(totalOld, 0)}`,
    ].join("\n");
  }

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setNotice(tr.copied);
      setTimeout(() => setNotice(""), 1800);
    } catch {
      setNotice(tr.copied);
      setTimeout(() => setNotice(""), 1800);
    }
  }

  async function share() {
    const text = receiptText();
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await (navigator as Navigator & { share: (d: ShareData) => Promise<void> }).share({ title: tr.receiptTitle, text });
        return;
      } catch {
        /* المستخدم ألغى المشاركة */
      }
    }
    await copyText(text);
  }

  return (
    <Screen>
      <AppHeader title={tr.basketTitle} subtitle={tr.basketSubtitle} />

      <section className="mt-3 rounded-xl border border-border bg-card p-3 shadow-panel sm:p-4">
        <p className="text-xs font-medium text-muted-foreground">{tr.basketHint}</p>
        <div className="mt-2.5 space-y-2">
          {lines.map(({ row, value }) => (
            <div key={row.id} className="grid grid-cols-[minmax(0,1fr)_8.5rem_auto] items-center gap-2">
              <div>
                <input
                  value={row.raw}
                  onChange={(event) => patchRow(row.id, { raw: event.target.value })}
                  inputMode="decimal"
                  placeholder="0"
                  aria-label={tr.addAmount}
                  className="h-11 w-full rounded-xl border border-input bg-background px-3 text-lg font-extrabold tabular-nums outline-none focus:ring-2 focus:ring-ring"
                />
                {row.raw.trim() && /[+\-*/()]/.test(row.raw) && (
                  <p className={`mt-0.5 px-1 text-[10px] font-bold ${isNaN(value) ? "text-loss" : "text-primary"}`}>
                    {isNaN(value) ? tr.invalid : `= ${formatNumber(value, 2)}`}
                  </p>
                )}
              </div>
              <div className="relative">
                <span className="pointer-events-none absolute start-2 top-1/2 z-10 -translate-y-1/2"><CurrencyMark id={row.currency} /></span>
                <select
                  value={row.currency}
                  onChange={(event) => patchRow(row.id, { currency: event.target.value })}
                  aria-label={tr.inputCurrency}
                  className="h-11 w-full appearance-none rounded-xl border border-input bg-background pe-7 ps-9 text-xs font-bold outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="syp">{tr.syp}</option>
                  {currencies.map((currency) => (
                    <option key={currency.id} value={currency.id}>{currencyName(currency, settings.lang)}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute end-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              </div>
              <Button variant="ghost" size="icon" className="size-9 rounded-xl" aria-label={tr.remove} onClick={() => removeRow(row.id)}>
                <Trash2 className="text-loss" />
              </Button>
            </div>
          ))}
          {rows.length === 0 && <p className="py-4 text-center text-xs font-semibold text-muted-foreground">{tr.emptyBasket}</p>}
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
          <Button variant="secondary" size="sm" className="h-9 rounded-full px-3 font-bold text-primary" onClick={() => addRow(currencies[0]?.id ?? "syp")}>
            <Plus /> {tr.addAmount}
          </Button>
          <Button variant="ghost" size="sm" className="h-9 px-2 text-xs" onClick={clear}>
            <Trash2 /> {tr.clearAll}
          </Button>
        </div>
      </section>

      <section className="mt-3 space-y-2.5">
        <div className="hero-surface hero-waves relative isolate flex min-h-24 items-center gap-3 overflow-hidden rounded-xl p-4 text-hero-foreground shadow-panel">
          <CurrencyMark id="syp" large />
          <div className="relative z-10 min-w-0 flex-1">
            <div className="truncate text-xs font-semibold opacity-90">{tr.totalNew}</div>
            <div className="mt-0.5 flex flex-wrap items-end gap-x-3 gap-y-1">
              <strong className="min-w-0 break-all text-4xl font-black leading-none tabular-nums sm:text-5xl">{hasAny ? formatNumber(totalNew, 2) : "—"}</strong>
              <Trend value={0.32} />
            </div>
          </div>
        </div>

        <div className="flex min-h-20 items-center gap-3 rounded-xl border border-border bg-card p-3.5 shadow-panel">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-secondary text-secondary-foreground"><Coins className="size-6" /></span>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-muted-foreground">{tr.totalOld}</div>
            <strong className="mt-0.5 block break-all text-3xl font-black leading-none tabular-nums">{hasAny ? formatNumber(totalOld, 0) : "—"}</strong>
          </div>
        </div>
      </section>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button variant="outline" className="h-11 rounded-xl font-bold" onClick={() => void copyText(`${formatNumber(totalNew, 2)}`)}>
          <Copy /> {tr.copyTotal}
        </Button>
        <Button variant="outline" className="h-11 rounded-xl font-bold" onClick={() => void copyText(receiptText())}>
          <Copy /> {tr.copyReceipt}
        </Button>
        <Button variant="secondary" className="h-11 rounded-xl font-bold text-primary" onClick={() => void share()}>
          <Share2 /> {tr.shareReceipt}
        </Button>
        <Button className="h-11 rounded-xl font-bold" onClick={() => openWhatsapp(receiptText())}>
          <Send /> {tr.whatsappShare}
        </Button>
      </div>
      {notice && <p className="mt-2 text-center text-xs font-bold text-primary">{notice}</p>}
    </Screen>
  );
}
