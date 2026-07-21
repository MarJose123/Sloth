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

import { useCallback, useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAddTransactionData } from "@/hooks/useAddTransactionData";
import { useColors } from "@/theme/ThemeContext";
import { formatCurrency, formatAmountOnBlur } from "@/lib/format";
import { onAccountSelected, onCategorySelected } from "@/lib/selectionBus";
import { useToast } from "@/hooks/useToast";
import { insertTransaction } from "@/lib/db/repositories/transactions";
import { FormField } from "@/components/ui/FormField";
import Color from "color";

// ─── types ────────────────────────────────────────────────────────────────

type Method = "manual" | "scan" | "import";

// ─── schema ────────────────────────────────────────────────────────────────

const transactionSchema = z.object({
  accountId: z.string().min(1, "Select an account"),
  merchant: z.string().min(1, "Enter a merchant name"),
  amount: z.string().refine((val) => {
    const clean = val.replace(/[$,]/g, "").trim();
    if (clean === "" || clean === "-" || clean === "0" || clean === "0.00")
      return false;
    const num = parseFloat(clean);
    return !isNaN(num) && num > 0;
  }, "Enter a valid amount"),
  date: z.string().min(1, "Enter a date"),
  note: z.string().optional(),
  categoryId: z.string().min(1, "Select a category"),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

// ─── local components ─────────────────────────────────────────────────────

function MethodPill({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      className={`rounded-full px-4 py-2 ${active && "border"}`}
      style={{
        backgroundColor: active
          ? Color(colors.brass).alpha(0.1).toString()
          : colors.surfaceElevated,
        borderColor: active
          ? Color(colors.brass).alpha(0.5).toString()
          : undefined,
      }}
    >
      <Text
        className="text-[12px] font-manrope-semibold "
        style={{ color: active ? colors.brass : colors.textSecondary }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function PickerRow({
  label,
  value,
  onPress,
}: {
  label: string;
  value: string;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      className="rounded-2xl border  px-4 py-3.5 active:opacity-70"
      style={{
        backgroundColor: colors.surfaceCard,
        borderColor: colors.hairline,
      }}
    >
      <Text
        className="mb-1 font-mono text-[10.5px] uppercase tracking-[0.06em] "
        style={{ color: colors.textSecondary }}
      >
        {label}
      </Text>
      <Text className="text-[13.5px] " style={{ color: colors.textPrimary }}>
        {value || "Select\u2026"}
      </Text>
    </Pressable>
  );
}

// ─── screen ───────────────────────────────────────────────────────────────

export default function AddTransactionScreen() {
  const colors = useColors();
  const toast = useToast();
  const formData = useAddTransactionData();
  const params = useLocalSearchParams<{
    merchant?: string;
    amountCents?: string;
    date?: string;
    source?: Method;
    selectedAccountId?: string;
    selectedCategoryId?: string;
  }>();

  const [method, setMethod] = useState<Method>(params.source ?? "manual");
  const [isSaving, setIsSaving] = useState(false);

  const defaultAmount = (() => {
    const cents = parseInt(params.amountCents ?? "", 10);
    return !isNaN(cents) ? (cents / 100).toFixed(2) : "0";
  })();

  const defaultDate = (() => {
    if (params.date) return params.date;
    const d = new Date();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const year = d.getFullYear();
    return `${month}/${day}/${year}`;
  })();

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      accountId: params.selectedAccountId ?? "",
      merchant: params.merchant ?? "",
      amount: defaultAmount,
      date: defaultDate,
      note: "",
      categoryId: params.selectedCategoryId ?? "",
    },
  });

  const selectedAccountId = useWatch({ control, name: "accountId" });
  const selectedCategoryId = useWatch({ control, name: "categoryId" });

  // ── Picker sheet subscriptions ──
  useEffect(() => {
    const unsubAccount = onAccountSelected.subscribe((id) => {
      setValue("accountId", id, { shouldValidate: true });
    });
    const unsubCategory = onCategorySelected.subscribe((id) => {
      setValue("categoryId", id, { shouldValidate: true });
    });
    return () => {
      unsubAccount();
      unsubCategory();
    };
  }, [setValue]);

  const selectedAccount =
    formData.status === "ready"
      ? (formData.data.accounts.find((a) => a.id === selectedAccountId) ?? null)
      : null;

  const selectedCategory =
    formData.status === "ready"
      ? (formData.data.categories.find((c) => c.id === selectedCategoryId) ??
        null)
      : null;

  const onSubmit = useCallback(
    async (data: TransactionFormData) => {
      const clean = data.amount.replace(/[$,]/g, "").trim();
      const amountCents = Math.round(Math.abs(parseFloat(clean)) * 100);
      const occurredAt = Date.parse(data.date);
      const finalDate = isNaN(occurredAt) ? Date.now() : occurredAt;

      setIsSaving(true);
      try {
        await insertTransaction({
          accountId: data.accountId,
          categoryId: data.categoryId,
          merchant: data.merchant.trim(),
          amountCents: -amountCents,
          occurredAt: finalDate,
          note: (data.note ?? "").trim() || undefined,
          source: method,
        });
        router.push("/transactions");
      } catch (err) {
        toast.error("Could not save", {
          description:
            err instanceof Error ? err.message : "Something went wrong.",
        });
      } finally {
        setIsSaving(false);
      }
    },
    [method, toast],
  );

  const handleSave = handleSubmit(onSubmit, (fieldErrors) => {
    const entry = Object.entries(fieldErrors)[0];
    if (entry) {
      const [fieldName, error] = entry;
      const label =
        fieldName === "accountId"
          ? "Account"
          : fieldName === "categoryId"
            ? "Category"
            : fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
      toast.warning(label, { description: error.message as string });
    }
  });

  if (formData.status === "loading") {
    return (
      <View
        className="flex-1 items-center justify-center pt-safe-offset-5 "
        style={{ backgroundColor: colors.surfaceBg }}
      >
        <Text className="text-sm " style={{ color: colors.textSecondary }}>
          {"Loading\u2026"}
        </Text>
      </View>
    );
  }

  if (formData.status === "error") {
    return (
      <View
        className="flex-1 items-center justify-center px-8 pt-safe-offset-5 "
        style={{ backgroundColor: colors.surfaceBg }}
      >
        <Text className="text-center text-sm " style={{ color: colors.rust }}>
          {formData.message}
        </Text>
      </View>
    );
  }

  const { accounts, categories } = formData.data;

  return (
    <View
      className="flex-1 pt-safe-offset-5 "
      style={{ backgroundColor: colors.surfaceBg }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          className="flex-1 px-5"
          contentContainerStyle={{ paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Header ── */}
          <View className="mb-6 flex-row items-center justify-between">
            <Pressable
              onPress={() => router.back()}
              className="active:opacity-60"
            >
              <Text
                className="text-[14.5px] "
                style={{ color: colors.textSecondary }}
              >
                Cancel
              </Text>
            </Pressable>
            <Text
              className="font-fraunces-medium text-[18px] "
              style={{ color: colors.textPrimary }}
            >
              New expense
            </Text>
            <Pressable
              onPress={handleSave}
              disabled={isSaving}
              className="active:opacity-60"
            >
              <Text
                className="font-manrope-bold text-[13px] "
                style={{
                  opacity: isSaving ? 0.4 : 1,
                  color: colors.textPrimary,
                }}
              >
                Save
              </Text>
            </Pressable>
          </View>

          {/*── Amount display ── */}
          <View className="mb-6 items-center">
            <Controller
              control={control}
              name="amount"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  onBlur={() => {
                    onBlur();
                    onChange(formatAmountOnBlur(value));
                  }}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={colors.textSecondary}
                  style={{
                    textAlign: "center",
                    fontWeight: "600",
                    fontSize: 46,
                    color: colors.brass,
                    minWidth: 120,
                  }}
                />
              )}
            />
            {errors.amount && (
              <Text className="mt-1 font-mono text-[10px] text-rust">
                {errors.amount.message}
              </Text>
            )}
            {selectedAccount && (
              <Text
                className="mt-1 font-mono text-[11px] "
                style={{ color: colors.textSecondary }}
              >
                {selectedAccount.name} {"\u00B7 Balance "}
                {formatCurrency(selectedAccount.balanceCents)}
              </Text>
            )}
          </View>

          {/* ── Method pills ── */}
          <View className="mb-5 flex-row gap-2">
            <MethodPill
              active={method === "manual"}
              label="Manual"
              onPress={() => setMethod("manual")}
            />
            <MethodPill
              active={method === "scan"}
              label="Scan receipt"
              onPress={() => router.replace("/receipt-scan")}
            />
            <MethodPill
              active={method === "import"}
              label="Import"
              onPress={() => router.replace("/import")}
            />
          </View>

          {/* ── Field blocks ── */}
          <View className="mb-3 gap-3">
            {/* Account picker */}
            <View>
              <PickerRow
                label="Account"
                value={selectedAccount?.name ?? "Select account"}
                onPress={() => {
                  if (accounts.length === 0) {
                    toast.warning("No accounts", {
                      description: "Create an account first.",
                    });
                    return;
                  }
                  router.push("/select-account");
                }}
              />
              {errors.accountId && (
                <Text className="ml-1 mt-1 font-mono text-[10px] text-rust">
                  {errors.accountId.message}
                </Text>
              )}
            </View>

            {/* Category picker */}
            <View>
              <PickerRow
                label="Category"
                value={
                  selectedCategory
                    ? `${selectedCategory.icon} ${selectedCategory.name}`
                    : "Select category"
                }
                onPress={() => {
                  const expenseCats = categories.filter(
                    (c) => c.kind === "expense",
                  );
                  if (expenseCats.length === 0) {
                    toast.warning("No categories", {
                      description: "Create a category first.",
                    });
                    return;
                  }
                  router.push("/select-category");
                }}
              />
              {errors.categoryId && (
                <Text className="ml-1 mt-1 font-mono text-[10px] text-rust">
                  {errors.categoryId.message}
                </Text>
              )}
            </View>

            {/* Merchant */}
            <FormField label="Merchant" error={errors.merchant?.message}>
              <Controller
                control={control}
                name="merchant"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="e.g. Whole Foods"
                    placeholderTextColor={colors.textSecondary}
                    style={{ fontSize: 13.5, color: colors.textPrimary }}
                    autoCapitalize="words"
                    returnKeyType="next"
                  />
                )}
              />
            </FormField>

            {/* Note */}
            <FormField label="Note (optional)">
              <Controller
                control={control}
                name="note"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="Groceries for the week"
                    placeholderTextColor={colors.textSecondary}
                    style={{ fontSize: 13.5, color: colors.textPrimary }}
                    returnKeyType="done"
                  />
                )}
              />
            </FormField>

            {/* Date */}
            <FormField label="Date" error={errors.date?.message}>
              <Controller
                control={control}
                name="date"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="MM/DD/YYYY"
                    placeholderTextColor={colors.textSecondary}
                    style={{ fontSize: 13.5, color: colors.textPrimary }}
                    keyboardType="numbers-and-punctuation"
                  />
                )}
              />
            </FormField>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
