/**
 * FormField.tsx
 *
 * Reusable form field wrapper that renders a label, children (the input),
 * and an inline error message when the field has a validation error.
 */

import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { useColors } from "@/theme/ThemeContext";

interface FormFieldProps {
  label: string;
  error?: string;
  children: ReactNode;
}

export function FormField({ label, error, children }: FormFieldProps) {
  const colors = useColors();
  return (
    <View
      className="rounded-2xl border   px-4 py-3.5"
      style={{
        borderColor: colors.hairline,
        backgroundColor: colors.surfaceCard,
      }}
    >
      <Text
        className="mb-1 font-mono text-[10.5px] uppercase tracking-[0.06em] "
        style={{ color: colors.textSecondary }}
      >
        {label}
      </Text>
      {children}
      {error ? (
        <Text
          className="mt-1 font-mono text-[10px] "
          style={{ color: colors.rust }}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}
