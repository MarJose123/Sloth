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
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { Appearance } from "react-native";
import type { ColorPalette, ThemePreference, ThemeContextValue } from "@/types";
import { darkColors, lightColors } from "@/theme/colors";
import { storage } from "@/lib/storage";

// ─── resolve helpers ──────────────────────────────────────────────────────────

function resolveScheme(
  preference: ThemePreference,
  systemScheme: "light" | "dark",
): "light" | "dark" {
  return preference === "auto" ? systemScheme : preference;
}

function paletteFor(resolved: "light" | "dark"): ColorPalette {
  return resolved === "light" ? lightColors : darkColors;
}

// ─── context ──────────────────────────────────────────────────────────────────

const ThemeContext = createContext<ThemeContextValue | null>(null);

// ─── provider ─────────────────────────────────────────────────────────────────

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>("auto");
  const [systemScheme, setSystemScheme] = useState<"light" | "dark">("light");
  const [loaded, setLoaded] = useState(false);

  // Read stored preference + current system scheme on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = await storage.getThemePreference();
      if (cancelled) return;
      setPreferenceState(stored);

      // "auto" must not inherit a scheme forced by a previous session
      // (AppCompatDelegate.setDefaultNightMode persists across app restarts
      // on Android). Reset to follow-the-system first, then read the real
      // system scheme; the change listener below re-reports it if this read
      // is momentarily stale.
      if (stored === "auto") {
        Appearance.setColorScheme("unspecified");
      }
      const scheme = Appearance.getColorScheme();
      setSystemScheme(scheme === "dark" ? "dark" : "light");
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Subscribe to system appearance changes (for "auto" mode)
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme === "dark" ? "dark" : "light");
    });
    return () => subscription.remove();
  }, []);

  const resolved = resolveScheme(preference, systemScheme);
  const palette = paletteFor(resolved);

  const setPreference = useCallback(async (newPreference: ThemePreference) => {
    setPreferenceState(newPreference);
    await storage.setThemePreference(newPreference);
  }, []);

  // Sync the native appearance so that:
  //  - An explicit "light"/"dark" preference is forced at the native layer,
  //    updating the CSS @media (prefers-color-scheme) query in global.css and
  //    the system chrome to the chosen theme.
  //  - "auto" clears the override ("unspecified" = follow the system) instead
  //    of pinning the app to the resolved scheme. Pinning was the bug: once
  //    forced via AppCompatDelegate, Android stops emitting appearanceChanged
  //    when the device theme changes, so "auto" froze on the scheme captured
  //    at mount time and never followed the device.
  //  - Only runs after the stored preference is loaded to avoid a flash.
  useEffect(() => {
    if (!loaded) return;
    Appearance.setColorScheme(
      preference === "auto" ? "unspecified" : preference,
    );
  }, [preference, loaded]);

  // ── render ──────────────────────────────────────────────────────────────────

  const value: ThemeContextValue = {
    preference,
    resolved,
    palette,
    loaded,
    setPreference,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

// ─── hooks ────────────────────────────────────────────────────────────────────

/**
 * Access the full theme context: preference, resolved, palette, loaded, setPreference.
 * Throws if used outside of `<ThemeProvider>`.
 */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a <ThemeProvider>");
  }
  return ctx;
}

/**
 * Returns the active colour palette for the resolved theme.
 * Shorthand — equivalent to `useTheme().palette`.
 * Throws if used outside of `<ThemeProvider>`.
 */
export function useColors(): ColorPalette {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useColors must be used within a <ThemeProvider>");
  }
  return ctx.palette;
}
