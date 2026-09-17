export function safeEval(expr: string): number {
  const cleaned = expr.replace(/[^0-9+\-*/().\s]/g, "");
  if (!cleaned.trim()) return NaN;
  try {
    // eslint-disable-next-line no-new-func
    const result = Function('"use strict"; return (' + cleaned + ")")();
    return typeof result === "number" && isFinite(result) ? result : NaN;
  } catch {
    return NaN;
  }
}

export function formatNumber(n: number, decimals = 0): string {
  if (!isFinite(n)) return "—";
  const abs = Math.abs(n);
  let max = decimals;
  if (abs > 0 && abs < 1) max = Math.max(decimals, 4);
  return n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: max });
}
