import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Appearance } from "react-native";
import { VariableContextProvider } from "nativewind";
import { StatusBar } from "expo-status-bar";
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

// ─── helpers ───────────────────────────────────────────────────────────────────

/**
 * Maps the JS palette to CSS custom property names that the @theme tokens
 * reference (e.g. --color-surface-bg: var(--sloth-surface-bg)). This is how
 * CSS variables are propagated on native — via VariableContextProvider,
 * not @media queries.
 */
function paletteToCssVars(palette: ColorPalette): Record<string, string> {
  return {
    "--sloth-surface-bg": palette.surfaceBg,
    "--sloth-surface-card": palette.surfaceCard,
    "--sloth-surface-elevated": palette.surfaceElevated,
    "--sloth-text-primary": palette.textPrimary,
    "--sloth-text-secondary": palette.textSecondary,
    "--sloth-brass": palette.brass,
    "--sloth-brass-soft": palette.brassSoft,
    "--sloth-sage": palette.sage,
    "--sloth-rust": palette.rust,
    "--sloth-dusty-blue": palette.dustyBlue,
    "--sloth-ochre": palette.ochre,
    "--sloth-hairline": palette.hairline,
    "--sloth-tab-bar": palette.tabBar,
    "--sloth-ink": palette.ink,
    "--sloth-parchment": palette.parchment,
  };
}

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

  // ── sync React Native Appearance so the dark: variant also updates ──────────
  // This is in addition to VariableContextProvider — it enables the dark: Tailwind
  // variant for any edge cases where it's used, and also updates the StatusBar.
  useEffect(() => {
    if (loaded) {
      Appearance.setColorScheme(resolved);
    }
  }, [resolved, loaded]);

  const palette = resolved === "light" ? lightColors : darkColors;

  const cssVars = useMemo(() => paletteToCssVars(palette), [palette]);

  const value = useMemo<ThemeContextValue>(
    () => ({ preference, resolved, palette, setPreference, loaded }),
    [preference, resolved, palette, setPreference, loaded],
  );

  return (
    <>
      <StatusBar style={resolved === "dark" ? "light" : "dark"} />
      <VariableContextProvider value={cssVars}>
        <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
      </VariableContextProvider>
    </>
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
