import { useCallback, useEffect, useState } from "react";

const KEY = "syr_basket_v1";

export interface BasketRow {
  id: string;
  currency: string;
  /** التعبير كما كتبه المستخدم (يدعم العمليات الحسابية) */
  raw: string;
}

function newRow(currency = "usd"): BasketRow {
  return { id: Math.random().toString(36).slice(2), currency, raw: "" };
}

export function useBasket() {
  const [rows, setRows] = useState<BasketRow[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      const parsed = raw ? (JSON.parse(raw) as BasketRow[]) : [];
      setRows(parsed.length ? parsed : [newRow("usd"), newRow("eur")]);
    } catch {
      setRows([newRow("usd"), newRow("eur")]);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(KEY, JSON.stringify(rows));
  }, [rows, ready]);

  const addRow = useCallback((currency: string) => {
    setRows((prev) => [...prev, newRow(currency)]);
  }, []);

  const patchRow = useCallback((id: string, patch: Partial<BasketRow>) => {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }, []);

  const removeRow = useCallback((id: string) => {
    setRows((prev) => prev.filter((row) => row.id !== id));
  }, []);

  const clear = useCallback(() => setRows([newRow("usd")]), []);

  return { rows, addRow, patchRow, removeRow, clear };
}
