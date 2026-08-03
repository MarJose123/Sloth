/*
 * Copyright (C) 2026
 *
 * Owner: MarJose123 (https://github.com/MarJose123/sloth)
 * Project: Sloth
 * License: GPLv3 <https://choosealicense.com/licenses/gpl-3.0/>
 *
 * Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { storage } from "@/lib/storage";

interface AmountsVisibilityValue {
  /** When true, amount figures across the app render as "₱ ••••••". */
  amountsHidden: boolean;
  toggleAmountsHidden: () => void;
}

const AmountsVisibilityContext = createContext<AmountsVisibilityValue | null>(
  null,
);

/**
 * App-wide "hide amounts" state (the dashboard eye toggle), persisted in
 * SecureStore and shared by every screen that displays balances/amounts.
 *
 * Starts masked so real figures never flash before the stored value loads.
 */
export function AmountsVisibilityProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [amountsHidden, setAmountsHidden] = useState(true);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    storage.getAmountsHidden().then((value) => {
      if (!cancelled) {
        setAmountsHidden(value);
        setLoaded(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist after the initial load so the stored preference is never
  // overwritten by the "masked" default.
  useEffect(() => {
    if (!loaded) return;
    storage.setAmountsHidden(amountsHidden).catch(() => {
      /* non-critical — defaults to visible next launch */
    });
  }, [amountsHidden, loaded]);

  const toggleAmountsHidden = useCallback(() => {
    setAmountsHidden((value) => !value);
  }, []);

  return (
    <AmountsVisibilityContext.Provider
      value={{ amountsHidden, toggleAmountsHidden }}
    >
      {children}
    </AmountsVisibilityContext.Provider>
  );
}

export function useAmountsVisibility(): AmountsVisibilityValue {
  const ctx = useContext(AmountsVisibilityContext);
  if (!ctx) {
    throw new Error(
      "useAmountsVisibility must be used within AmountsVisibilityProvider",
    );
  }
  return ctx;
}
