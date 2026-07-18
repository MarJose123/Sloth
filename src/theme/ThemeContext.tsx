import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { Appearance } from "react-native";
import type { ColorPalette } from "@/theme/colors";
import { darkColors, lightColors } from "@/theme/colors";
import type { ThemePreference } from "@/lib/storage";
import { storage } from "@/lib/storage";

// ─── types ────────────────────────────────────────────────────────────────────

export interface ThemeContextValue {
  /** The user's stored preference: "light", "dark", or "auto" (follow system). */
  preference: ThemePreference;
  /** The resolved effective theme: always "light" or "dark". */
  resolved: "light" | "dark";
  /** The active colour palette matching the resolved theme. */
  palette: ColorPalette;
  /** True once the stored preference has been loaded from SecureStore. */
  loaded: boolean;
  /** Persist a new preference and apply it immediately. */
  setPreference: (preference: ThemePreference) => void;
}

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

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>("auto");
  const [systemScheme, setSystemScheme] = useState<"light" | "dark">("light");
  const [loaded, setLoaded] = useState(false);

  // Read stored preference + current system scheme on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [stored, scheme] = await Promise.all([
        storage.getThemePreference(),
        Appearance.getColorScheme(),
      ]);
      if (cancelled) return;
      setPreferenceState(stored);
      setSystemScheme(scheme ?? "light");
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Subscribe to system appearance changes (for "auto" mode)
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme ?? "light");
    });
    return () => subscription.remove();
  }, []);

  const resolved = resolveScheme(preference, systemScheme);
  const palette = paletteFor(resolved);

  const setPreference = useCallback(async (newPreference: ThemePreference) => {
    setPreferenceState(newPreference);
    await storage.setThemePreference(newPreference);
  }, []);

  // Sync Appearance API so that:
  //  - The CSS @media (prefers-color-scheme) query in global.css uses the
  //    resolved theme, updating all Tailwind utility classes automatically.
  //  - System chrome (status bar, etc.) follows the app theme.
  //  - Only runs after the stored preference is loaded to avoid a flash.
  useEffect(() => {
    if (!loaded) return;
    Appearance.setColorScheme(resolved);
  }, [resolved, loaded]);

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
