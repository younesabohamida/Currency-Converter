import { Link } from "@tanstack/react-router";
import { BarChart3, Home, Menu, Repeat2, Tag } from "lucide-react";
import { t } from "@/lib/converter/i18n";
import { useApp } from "@/lib/converter/settings-context";

export function BottomNav() {
  const { settings } = useApp();
  const tr = t(settings.lang);

  const items = [
    { to: "/", label: tr.navHome, Icon: Home },
    { to: "/rates", label: tr.navRates, Icon: BarChart3 },
    { to: "/basket", label: tr.navBasket, Icon: Repeat2 },
    { to: "/pricing", label: tr.navPricing, Icon: Tag },
    { to: "/more", label: tr.navMore, Icon: Menu },
  ] as const;

  return (
    <nav
      aria-label={tr.navHome}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      <ul className="mx-auto flex w-full max-w-[460px] items-stretch sm:max-w-2xl">
        {items.map(({ to, label, Icon }) => (
          <li key={to} className="flex-1">
            <Link
              to={to}
              activeOptions={{ exact: to === "/" }}
              className="group flex flex-col items-center gap-1 py-2 text-muted-foreground data-[status=active]:text-primary"
            >
              <Icon className="size-5" />
              <span className="text-[11px] font-bold">{label}</span>
              <span className="h-0.5 w-6 rounded-full bg-transparent group-data-[status=active]:bg-primary" />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
