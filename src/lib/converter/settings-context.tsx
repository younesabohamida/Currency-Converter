import { createContext, useContext, type ReactNode } from "react";
import { useSettings } from "./store";

type AppState = ReturnType<typeof useSettings>;

const Ctx = createContext<AppState | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const value = useSettings();
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used inside SettingsProvider");
  return ctx;
}
