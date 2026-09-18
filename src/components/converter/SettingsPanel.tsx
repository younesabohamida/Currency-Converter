import { useState } from "react";
import { Plus, Trash2, Eye, EyeOff } from "lucide-react";
import {
  BUILTIN_CURRENCIES,
  SUGGESTED_CURRENCIES,
  currencyName,
  type CurrencyDef,
} from "@/lib/converter/data";
import { t } from "@/lib/converter/i18n";
import { allCurrencies, type Settings } from "@/lib/converter/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface Props {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
  setRate: (id: string, mode: "buy" | "sell", value: number) => void;
}

export function SettingsPanel({ settings, update, setRate }: Props) {
  const tr = t(settings.lang);
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [rate, setNewRate] = useState("");

  const list = allCurrencies(settings.custom);
  const visible = list.filter((c) => settings.enabled.includes(c.id));

  function toggleEnabled(id: string) {
    const removing = settings.enabled.includes(id);
    const enabled = removing
      ? settings.enabled.filter((x) => x !== id)
      : [...settings.enabled, id];
    update({
      enabled,
      ...(removing && settings.targetCurrency === id ? { targetCurrency: "syp" } : {}),
    });
  }

  function addCustom() {
    const value = parseFloat(rate);
    if (!name.trim() || !(value > 0)) return;
    const id = "c_" + Date.now().toString(36);
    const def: CurrencyDef = {
      id,
      nameAr: name.trim(),
      nameDe: name.trim(),
      nameEn: name.trim(),
      symbol: symbol.trim(),
      custom: true,
    };
    update({
      custom: [...settings.custom, def],
      enabled: [...settings.enabled, id],
      rates: { ...settings.rates, [id]: { buy: value, sell: value } },
      updatedAt: new Date().toISOString(),
    });
    setName("");
    setSymbol("");
    setNewRate("");
  }

  function removeCustom(id: string) {
    update({
      custom: settings.custom.filter((c) => c.id !== id),
      enabled: settings.enabled.filter((x) => x !== id),
      ...(settings.targetCurrency === id ? { targetCurrency: "syp" } : {}),
    });
  }

  const notAdded = [...BUILTIN_CURRENCIES, ...SUGGESTED_CURRENCIES].filter(
    (c) => !settings.enabled.includes(c.id),
  );

  return (
    <div className="rounded-xl border border-border bg-card p-3 shadow-panel sm:p-4">
      <div className="space-y-3 rounded-xl bg-muted p-3">
        <div className="flex items-center justify-between">
          <Label className="text-base">{tr.theme}</Label>
          <Switch checked={settings.dark} onCheckedChange={(v) => update({ dark: v })} />
        </div>
        <div className="flex items-center justify-between">
          <Label className="text-base">{tr.language}</Label>
          <div className="flex gap-2">
            {(["ar", "de", "en"] as const).map((l) => (
              <Button
                key={l}
                size="sm"
                variant={settings.lang === l ? "default" : "outline"}
                onClick={() => update({ lang: l })}
              >
                {l.toUpperCase()}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <h3 className="mt-5 text-lg font-bold">{tr.syncTitle}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{tr.syncDesc}</p>
      <div className="mt-2.5 space-y-3 rounded-xl bg-muted p-3">
        <div className="flex items-center justify-between">
          <Label className="text-base">{tr.syncToggle}</Label>
          <Switch checked={settings.autoSync} onCheckedChange={(v) => update({ autoSync: v })} />
        </div>
        <details className="rounded-lg border border-border p-2.5">
          <summary className="cursor-pointer text-xs font-semibold text-primary">{tr.advancedOptions}</summary>
          <div className="mt-2.5">
            <Label className="text-xs text-muted-foreground">{tr.syncUrl}</Label>
            <Input
              className="mt-1 h-11 text-sm"
              dir="ltr"
              placeholder="https://raw.githubusercontent.com/user/repo/main/public/rates.json"
              value={settings.ratesUrl}
              onChange={(e) => update({ ratesUrl: e.target.value })}
            />
            <p className="mt-1.5 text-[11px] text-muted-foreground">{tr.syncUrlHint}</p>
          </div>
        </details>
        {settings.syncSource && (
          <p className="text-xs text-muted-foreground">
            {settings.syncSource === "github" ? tr.syncSourceGithub : tr.syncSourceFx}
          </p>
        )}
      </div>

      <h3 className="mt-5 text-lg font-bold">{tr.ratesTitle}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{tr.ratesDesc}</p>
      <div className="mt-2.5 space-y-3">
        {visible.map((c) => (
          <div key={c.id} className="rounded-xl border border-border p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-base font-semibold">
                {currencyName(c, settings.lang)} {c.symbol}
              </span>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" aria-label={tr.hide} onClick={() => toggleEnabled(c.id)}>
                  <EyeOff className="size-5" />
                </Button>
                {c.custom && (
                  <Button variant="ghost" size="icon" aria-label={tr.remove} onClick={() => removeCustom(c.id)}>
                    <Trash2 className="size-5 text-destructive" />
                  </Button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {(["buy", "sell"] as const).map((mode) => (
                <div key={mode}>
                  <Label className="text-xs text-muted-foreground">
                    {mode === "buy" ? tr.buy : tr.sell} — {tr.perUnit} {c.symbol || c.id}
                  </Label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="0.0001"
                    className="mt-1 h-11 text-base"
                    defaultValue={settings.rates[c.id]?.[mode] ?? ""}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      if (v > 0) setRate(c.id, mode, v);
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <h3 className="mt-5 text-lg font-bold">{tr.addTitle}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{tr.addDesc}</p>
      {notAdded.length > 0 && (
        <>
          <p className="mt-2.5 text-xs font-medium">{tr.suggested}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {notAdded.map((c) => (
              <Button key={c.id} variant="outline" size="sm" onClick={() => toggleEnabled(c.id)} className="gap-1">
                <Eye className="size-4" />
                {currencyName(c, settings.lang)}
              </Button>
            ))}
          </div>
        </>
      )}

      <div className="mt-3 grid gap-2 rounded-xl bg-muted p-3 sm:grid-cols-[1fr_5rem_7rem_auto]">
        <Input placeholder={tr.customName} value={name} onChange={(e) => setName(e.target.value)} className="h-11" />
        <Input placeholder={tr.customSymbol} value={symbol} onChange={(e) => setSymbol(e.target.value)} className="h-11" />
        <Input
          placeholder={tr.perUnit + " = ?"}
          type="number"
          inputMode="decimal"
          value={rate}
          onChange={(e) => setNewRate(e.target.value)}
          className="h-11"
        />
        <Button onClick={addCustom} className="h-11 gap-1">
          <Plus className="size-5" />
          {tr.add}
        </Button>
      </div>
    </div>
  );
}
