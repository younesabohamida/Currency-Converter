export type PriceMode = "buy" | "sell";
export type Lang = "ar" | "de" | "en";

export interface RateEntry {
  buy: number;
  /** كم ليرة جديدة تساوي وحدة واحدة من العملة */
  sell: number;
}

export interface CurrencyDef {
  id: string;
  nameAr: string;
  nameDe: string;
  nameEn?: string;
  symbol: string;
  custom?: boolean;
}

/** العملات الجاهزة — الأساس دائماً: 1 وحدة = X ليرة سورية جديدة */
export const BUILTIN_CURRENCIES: CurrencyDef[] = [
  { id: "usd", nameAr: "دولار أمريكي", nameDe: "US-Dollar", nameEn: "US Dollar", symbol: "$" },
  { id: "eur", nameAr: "يورو", nameDe: "Euro", nameEn: "Euro", symbol: "€" },
  { id: "sar", nameAr: "ريال سعودي", nameDe: "Saudi-Riyal", nameEn: "Saudi Riyal", symbol: "﷼" },
  { id: "aed", nameAr: "درهم إماراتي", nameDe: "VAE-Dirham", nameEn: "UAE Dirham", symbol: "د.إ" },
  { id: "try", nameAr: "ليرة تركية", nameDe: "Türkische Lira", nameEn: "Turkish Lira", symbol: "₺" },
  { id: "egp", nameAr: "جنيه مصري", nameDe: "Ägyptisches Pfund", nameEn: "Egyptian Pound", symbol: "ج.م" },
  { id: "usdt", nameAr: "USDT", nameDe: "USDT", nameEn: "USDT", symbol: "₮" },
  { id: "gold21", nameAr: "غرام ذهب 21", nameDe: "Gold 21K (Gramm)", nameEn: "21K Gold (gram)", symbol: "🥇" },
  { id: "mad", nameAr: "درهم مغربي", nameDe: "Marokkanischer Dirham", nameEn: "Moroccan Dirham", symbol: "د.م" },
];

/** عملات شائعة يمكن إضافتها بلمسة */
export const SUGGESTED_CURRENCIES: CurrencyDef[] = [
  { id: "kwd", nameAr: "دينار كويتي", nameDe: "Kuwait-Dinar", nameEn: "Kuwaiti Dinar", symbol: "د.ك" },
  { id: "qar", nameAr: "ريال قطري", nameDe: "Katar-Riyal", nameEn: "Qatari Riyal", symbol: "ر.ق" },
  { id: "jod", nameAr: "دينار أردني", nameDe: "Jordanischer Dinar", nameEn: "Jordanian Dinar", symbol: "د.أ" },
  { id: "gbp", nameAr: "جنيه إسترليني", nameDe: "Britisches Pfund", nameEn: "British Pound", symbol: "£" },
  { id: "cad", nameAr: "دولار كندي", nameDe: "Kanadischer Dollar", nameEn: "Canadian Dollar", symbol: "C$" },
  { id: "chf", nameAr: "فرنك سويسري", nameDe: "Schweizer Franken", nameEn: "Swiss Franc", symbol: "Fr" },
  { id: "rub", nameAr: "روبل روسي", nameDe: "Russischer Rubel", nameEn: "Russian Ruble", symbol: "₽" },
  { id: "iqd", nameAr: "دينار عراقي", nameDe: "Irakischer Dinar", nameEn: "Iraqi Dinar", symbol: "د.ع" },
  { id: "lbp", nameAr: "ليرة لبنانية", nameDe: "Libanesisches Pfund", nameEn: "Lebanese Pound", symbol: "ل.ل" },
];

/** أسعار انطلاق فقط (ليرة جديدة لكل وحدة) — المستخدم يعدّلها بحرية */
export const DEFAULT_RATES: Record<string, RateEntry> = {
  usd: { buy: 114, sell: 116 },
  eur: { buy: 130, sell: 133 },
  sar: { buy: 30.2, sell: 31 },
  aed: { buy: 30.8, sell: 31.6 },
  try: { buy: 3.3, sell: 3.45 },
  egp: { buy: 2.3, sell: 2.42 },
  usdt: { buy: 113.5, sell: 115.5 },
  gold21: { buy: 10200, sell: 10500 },
  mad: { buy: 11.9, sell: 12.4 },
  kwd: { buy: 372, sell: 380 },
  qar: { buy: 31, sell: 32 },
  jod: { buy: 160, sell: 164 },
  gbp: { buy: 150, sell: 154 },
  cad: { buy: 82, sell: 84 },
  chf: { buy: 140, sell: 144 },
  rub: { buy: 1.3, sell: 1.4 },
  iqd: { buy: 0.087, sell: 0.09 },
  lbp: { buy: 0.00127, sell: 0.00132 },
};

export const DEFAULT_ENABLED = ["usd", "eur", "sar", "aed", "try", "egp", "usdt", "gold21"];

export const OLD_PER_NEW = 100;

export function currencyName(c: CurrencyDef, lang: Lang) {
  if (lang === "de") return c.nameDe || c.nameAr;
  if (lang === "en") return c.nameEn || c.nameDe || c.nameAr;
  return c.nameAr;
}
