// تسجيل خدمة العمل بدون إنترنت — يُمنع تسجيلها في المعاينة أو أثناء التطوير.
const SW_URL = `${import.meta.env.BASE_URL}sw.js`;

function isBlockedContext(): boolean {
  if (!import.meta.env.PROD) return true;
  if (typeof window === "undefined") return true;
  if (window.top !== window.self) return true;

  const host = window.location.hostname;
  if (host.startsWith("id-preview--") || host.startsWith("preview--")) return true;
  if (new URL(window.location.href).searchParams.get("sw") === "off") return true;

  return false;
}

async function unregisterExisting() {
  if (!("serviceWorker" in navigator)) return;
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.allSettled(
    registrations
      .filter((r) => (r.active?.scriptURL ?? r.installing?.scriptURL ?? "").endsWith(SW_URL))
      .map((r) => r.unregister()),
  );
}

export function registerServiceWorker() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  if (isBlockedContext()) {
    void unregisterExisting();
    return;
  }
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register(SW_URL, { scope: import.meta.env.BASE_URL }).catch(() => {
      /* تجاهل الفشل — التطبيق يعمل بشكل طبيعي */
    });
  });
}
