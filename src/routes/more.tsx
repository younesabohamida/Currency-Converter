import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, Tags } from "lucide-react";
import { t } from "@/lib/converter/i18n";
import { useApp } from "@/lib/converter/settings-context";
import { AppHeader, Screen, SyncFooter } from "@/components/converter/shared";
import { SettingsPanel } from "@/components/converter/SettingsPanel";

export const Route = createFileRoute("/more")({
  head: () => ({
    meta: [
      { title: "الإعدادات والعملات المخصصة — تحويل العملة" },
      { name: "description", content: "عدّل أسعار الشراء والمبيع، أضف عملات مخصصة، وبدّل اللغة والوضع الليلي والتحديث التلقائي." },
      { property: "og:title", content: "الإعدادات والعملات المخصصة" },
      { property: "og:description", content: "تعديل الأسعار والعملات المخصصة واللغة والوضع الليلي." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MoreScreen,
});

function MoreScreen() {
  const { settings, update, setRate } = useApp();
  const tr = t(settings.lang);
  return (
    <Screen>
      <AppHeader title={tr.settings} subtitle={tr.subtitle} />
      <Link
        to="/pricing"
        className="mt-3 flex items-center gap-3 rounded-xl border border-border bg-card p-3.5 shadow-panel"
      >
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-secondary text-primary"><Tags className="size-5" /></span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-extrabold">{tr.pricingTitle}</span>
          <span className="block truncate text-xs text-muted-foreground">{tr.openPricing}</span>
        </span>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground rtl:rotate-180" />
      </Link>
      <div className="mt-3">
        <SettingsPanel settings={settings} update={update} setRate={setRate} />
      </div>
      <SyncFooter />
    </Screen>
  );
}
