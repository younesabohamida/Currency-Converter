import { toast } from "sonner";
import { t } from "./i18n";
import type { Lang } from "./data";

export function buildReceipt(lines: string[]): string {
  return lines.filter(Boolean).join("\n");
}

function getStoredLang(): Lang {
  try {
    const raw = localStorage.getItem("syr_converter_v2");
    if (raw) {
      const parsed = JSON.parse(raw) as { lang?: string };
      if (parsed.lang === "ar" || parsed.lang === "de" || parsed.lang === "en") {
        return parsed.lang;
      }
    }
  } catch {
    /* تجاهل البيانات التالفة */
  }
  return "ar";
}

export function whatsappUrl(text: string): string {
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(text.slice(0, 1500))}`;
}

export function whatsappDeepLink(text: string): string {
  return `whatsapp://send?text=${encodeURIComponent(text.slice(0, 1500))}`;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function triggerLinkClick(href: string) {
  const link = document.createElement("a");
  link.href = href;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.style.position = "fixed";
  link.style.opacity = "0";
  link.style.pointerEvents = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function openWhatsapp(text: string) {
  if (typeof window === "undefined") return;

  const lang = getStoredLang();
  const texts = t(lang);

  // 1. انسخ الإيصال تلقائياً كإجراء احتياطي فوري
  const copied = await copyToClipboard(text);

  // 2. على الهواتف التي تدعم المشاركة الأصلية، افتح واتساب المثبت مباشرة
  if (typeof navigator !== "undefined" && "share" in navigator) {
    try {
      await navigator.share({ title: texts.receiptTitle, text });
      return;
    } catch {
      /* المستخدم ألغى أو المشاركة غير متاحة — انتقل للخطوة التالية */
    }
  }

  // 3. استخدم رابط حقيقي (a tag) بدلاً من window.open لتجنب حجب النوافذ المنبثقة
  triggerLinkClick(whatsappUrl(text));

  // 4. أخبر المستخدم أنه يمكنه اللصق إذا لم يفتح التطبيق
  if (copied) {
    toast(texts.whatsappFallback);
  }
}
