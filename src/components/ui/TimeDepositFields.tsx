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

/**
 * TimeDepositFields.tsx
 *
 * Conditional form block for time-deposit accounts: interest rate, placement
 * term, interest payout, and an optional note. Shared by add-account and
 * edit-account so the two forms cannot drift. The placement amount lives in
 * each form's own balance field; it is passed in only to render the summary.
 */

import { Pressable, Text, TextInput, View } from "react-native";
import {
  Controller,
  useWatch,
  type Control,
  type FieldErrors,
} from "react-hook-form";
import { useColors } from "@/theme/ThemeContext";
import { FormField } from "@/components/ui/FormField";
import { formatCurrency } from "@/lib/format";
import {
  TIME_DEPOSIT_PAYOUT_OPTIONS,
  interestRateToBps,
  parsePlacementTermMonths,
  type AccountFormData,
} from "@/lib/timeDeposit";
import Color from "color";

interface TimeDepositFieldsProps {
  /** react-hook-form control from the host form (add/edit account). */
  control: Control<AccountFormData>;
  errors: FieldErrors<AccountFormData>;
  /** When provided (> 0), the summary line includes the placement amount. */
  placementAmountCents?: number;
}

export function TimeDepositFields({
  control,
  errors,
  placementAmountCents,
}: TimeDepositFieldsProps) {
  const colors = useColors();
  const watched = useWatch({ control });

  const rate = interestRateToBps(watched.interestRate ?? "");
  const term = parsePlacementTermMonths(watched.placementTerm ?? "");
  const amount = placementAmountCents ?? 0;
  const summary =
    rate !== null && term !== null && amount > 0
      ? `${formatCurrency(amount)} at ${(rate / 100).toFixed(2)}% for ${term} months`
      : null;

  return (
    <View className="gap-4">
      <FormField label="Interest rate" error={errors.interestRate?.message}>
        <Controller
          control={control}
          name="interestRate"
          render={({ field: { onChange, onBlur, value } }) => (
            <View className="flex-row items-center">
              <TextInput
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="3.50"
                placeholderTextColor={colors.textSecondary}
                keyboardType="decimal-pad"
                className="flex-1 font-fraunces-medium text-[18px]"
                style={{ color: colors.textPrimary }}
              />
              <Text
                className="font-mono text-sm"
                style={{ color: colors.textSecondary }}
              >
                %
              </Text>
            </View>
          )}
        />
      </FormField>

      <FormField label="Placement term" error={errors.placementTerm?.message}>
        <Controller
          control={control}
          name="placementTerm"
          render={({ field: { onChange, onBlur, value } }) => (
            <View className="flex-row items-center">
              <TextInput
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="12"
                placeholderTextColor={colors.textSecondary}
                keyboardType="number-pad"
                className="flex-1 font-fraunces-medium text-[18px]"
                style={{ color: colors.textPrimary }}
              />
              <Text
                className="font-mono text-sm"
                style={{ color: colors.textSecondary }}
              >
                months
              </Text>
            </View>
          )}
        />
      </FormField>

      <FormField label="Interest payout" error={errors.interestPayout?.message}>
        <Controller
          control={control}
          name="interestPayout"
          render={({ field: { value, onChange } }) => (
            <View className="flex-row flex-wrap gap-2 pt-1">
              {TIME_DEPOSIT_PAYOUT_OPTIONS.map((option) => {
                const active = value === option.value;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => onChange(option.value)}
                    className="rounded-lg border px-3 py-2 active:opacity-80"
                    style={{
                      borderColor: active
                        ? Color(colors.brass).alpha(0.5).toString()
                        : colors.hairline,
                      backgroundColor: active
                        ? Color(colors.brass).alpha(0.1).toString()
                        : "transparent",
                    }}
                  >
                    <Text
                      className="text-[11px] font-manrope-semibold"
                      style={{
                        color: active ? colors.brassText : colors.textSecondary,
                      }}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        />
      </FormField>

      <FormField label="Note (optional)" error={errors.note?.message}>
        <Controller
          control={control}
          name="note"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="e.g. Branch, reference number"
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={3}
              className="text-sm"
              style={{
                color: colors.textPrimary,
                minHeight: 60,
                textAlignVertical: "top",
              }}
            />
          )}
        />
      </FormField>

      {summary ? (
        <Text
          className="font-mono text-[11px]"
          style={{ color: colors.textSecondary }}
        >
          {summary}
        </Text>
      ) : null}
    </View>
  );
}
