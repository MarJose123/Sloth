/**
 * FormField.tsx
 *
 * Reusable form field wrapper that renders a label, children (the input),
 * and an inline error message when the field has a validation error.
 */

import type { ReactNode } from "react";
import { Text, View } from "react-native";

interface FormFieldProps {
  label: string;
  error?: string;
  children: ReactNode;
}

export function FormField({ label, error, children }: FormFieldProps) {
  return (
    <View className="rounded-2xl border border-hairline bg-surface-card px-4 py-3.5">
      <Text className="mb-1 font-mono text-[10.5px] uppercase tracking-[0.06em] text-text-secondary">
        {label}
      </Text>
      {children}
      {error ? (
        <Text className="mt-1 font-mono text-[10px] text-rust">{error}</Text>
      ) : null}
    </View>
  );
}
