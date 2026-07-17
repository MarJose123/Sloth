import { useColorScheme } from "react-native";
import { VariableContextProvider } from "nativewind";
import { lightColors } from "@/theme/lightColors";
import { darkColors } from "@/theme/darkColors";

const themes = {
  default: {
    light: {
      "--color-surface-bg": lightColors.surfaceBg,
      "--color-surface-card": lightColors.surfaceCard,
      "--color-surface-elevated": lightColors.surfaceElevated,

      "--color-text-primary": lightColors.textPrimary,
      "--color-text-secondary": lightColors.textSecondary,

      "--color-brass": lightColors.brass,
      "--color-brass-soft": lightColors.brassSoft,
      "--color-sage": lightColors.sage,
      "--color-rust": lightColors.rust,

      "--color-dusty-blue": lightColors.dustyBlue,
      "--color-ochre": lightColors.ochre,

      "--color-ink": lightColors.ink,
      "--color-parchment": lightColors.parchment,

      "--color-hairline": lightColors.hairline,
      "--color-tab-bar": lightColors.tabBar,
    },
    dark: {
      " --color-surface-bg": darkColors.surfaceBg,
      "--color-surface-card": darkColors.surfaceCard,
      "--color-surface-elevated": darkColors.surfaceElevated,

      "--color-text-primary": darkColors.textPrimary,
      "--color-text-secondary": darkColors.textSecondary,

      "--color-brass": darkColors.brass,
      "--color-brass-soft": darkColors.brassSoft,
      "--color-sage": darkColors.sage,
      "--color-rust": darkColors.rust,

      "--color-dusty-blue": darkColors.dustyBlue,
      "--color-ochre": darkColors.ochre,

      "--color-ink": darkColors.ink,
      "--color-parchment": darkColors.parchment,

      "--color-hairline": darkColors.hairline,
      "--color-tab-bar": darkColors.tabBar,
    },
  },
};

export function ThemeProvider({
  name,
  children,
}: {
  name: keyof typeof themes;
  children: React.ReactNode;
}) {
  const colorScheme = useColorScheme() ?? "light";

  return (
    <VariableContextProvider value={themes[name][colorScheme]}>
      {children}
    </VariableContextProvider>
  );
}
