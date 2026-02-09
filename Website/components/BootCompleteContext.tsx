"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { useWebsiteSettings } from "@/components/WebsiteSettingsProvider";

type BootCompleteContextValue = {
  bootComplete: boolean;
  setBootComplete: (value: boolean) => void;
};

const BootCompleteContext = createContext<BootCompleteContextValue | null>(null);

export function BootCompleteProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { settings } = useWebsiteSettings();
  const [bootComplete, setBootCompleteState] = useState(false);

  const setBootComplete = useCallback((value: boolean) => {
    setBootCompleteState(value);
  }, []);

  useEffect(() => {
    if (pathname !== "/") {
      setBootCompleteState(true);
    } else if (pathname === "/" && !settings.showBootSequence) {
      setBootCompleteState(true);
    } else {
      setBootCompleteState(false);
    }
  }, [pathname, settings.showBootSequence]);

  return (
    <BootCompleteContext.Provider value={{ bootComplete, setBootComplete }}>
      {children}
    </BootCompleteContext.Provider>
  );
}

export function useBootComplete() {
  const ctx = useContext(BootCompleteContext);
  return ctx ?? { bootComplete: true, setBootComplete: () => {} };
}
