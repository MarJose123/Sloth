import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Appearance } from "react-native";
import { colorScheme as rnCssColorScheme } from "react-native-css/native";
import { storage, type ThemePreference } from "@/lib/storage";
import { darkColors, lightColors } from "@/theme/colors";
import type { ColorPalette } from "@/theme/colors";

// ─── types ────────────────────────────────────────────────────────────────────

interface ThemeContextValue {
  /** The user's stored preference (light / dark / auto). */
  preference: ThemePreference;
  /** The resolved theme — always "light" or "dark" (auto is resolved). */
  resolved: "light" | "dark";
  /** The active colour palette matching the resolved theme. */
  palette: ColorPalette;
  /** Update the stored preference. */
  setPreference: (next: ThemePreference) => Promise<void>;
  /** True once preferences have been loaded from storage. */
  loaded: boolean;
}

// ─── context ───────────────────────────────────────────────────────────────────

const ThemeContext = createContext<ThemeContextValue | null>(null);

// ─── provider ──────────────────────────────────────────────────────────────────

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>("auto");
  const [loaded, setLoaded] = useState(false);

  // ── load stored preference on mount ──────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = await storage.getThemePreference();
      if (cancelled) return;
      setPreferenceState(stored);
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ── persist preference changes ──────────────────────────────────────────────
  const setPreference = useCallback(async (next: ThemePreference) => {
    setPreferenceState(next);
    await storage.setThemePreference(next);
  }, []);

  // ── resolve "auto" to the system colour scheme ──────────────────────────────
  const [systemScheme, setSystemScheme] = useState<"light" | "dark">(
    Appearance.getColorScheme() ?? "dark",
  );

  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme ?? "dark");
    });
    return () => sub.remove();
  }, []);

  const resolved = preference === "auto" ? systemScheme : preference;

  // ── sync react-native-css colorScheme with resolved theme ───────────────
  // This makes @media (prefers-color-scheme: light/dark) in global.css
  // re-evaluate, which swaps all CSS variables and thus all Tailwind utilities.
  useEffect(() => {
    if (loaded) {
      rnCssColorScheme.set(resolved);
    }
  }, [resolved, loaded]);

  const palette = resolved === "light" ? lightColors : darkColors;

  const value = useMemo<ThemeContextValue>(
    () => ({ preference, resolved, palette, setPreference, loaded }),
    [preference, resolved, palette, setPreference, loaded],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

// ─── hooks ─────────────────────────────────────────────────────────────────────

/**
 * Access the full theme context (preference, resolved, palette, setter).
 * Throws if used outside of <ThemeProvider>.
 */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}

/**
 * Convenience hook — returns only the active colour palette.
 * Use this in components that need inline-style colours that change with theme.
 */
export function useColors(): ColorPalette {
  return useTheme().palette;
}
