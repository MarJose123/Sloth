import { useCallback, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useAddTransactionData } from "@/hooks/useAddTransactionData";
import { insertTransaction } from "@/lib/db/repositories/transactions";
import { formatCurrency } from "@/lib/format";
import { colors } from "@/theme/colors";

type Method = "manual" | "scan" | "import";

function MethodPill({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`rounded-full px-4 py-2 ${
        active ? "border border-brass/50 bg-brass/10" : "bg-surface-elevated"
      }`}
    >
      <Text
        className={`text-[12px] font-manrope-semibold ${
          active ? "text-brass" : "text-text-secondary"
        }`}
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
  return (
    <Pressable
      onPress={onPress}
      className="rounded-2xl border border-hairline bg-surface-card px-4 py-3.5 active:opacity-70"
    >
      <Text className="mb-1 font-mono text-[10.5px] uppercase tracking-[0.06em] text-text-secondary">
        {label}
      </Text>
      <Text className="text-[13.5px] text-text-primary">
        {value || "Select…"}
      </Text>
    </Pressable>
  );
}

export default function AddTransactionScreen() {
  const formData = useAddTransactionData();
  const params = useLocalSearchParams<{
    merchant?: string;
    amountCents?: string;
    date?: string;
    source?: Method;
  }>();

  const [method, setMethod] = useState<Method>(params.source ?? "manual");
  const [amountText, setAmountText] = useState(() => {
    const cents = parseInt(params.amountCents ?? "", 10);
    return !isNaN(cents) ? (cents / 100).toFixed(2) : "0";
  });
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    null,
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  const [merchant, setMerchant] = useState(params.merchant ?? "");
  const [note, setNote] = useState("");
  const [dateText, setDateText] = useState(
    params.date ?? new Date().toISOString().slice(0, 10),
  );
  const [isSaving, setIsSaving] = useState(false);

  // Parse amount: user types "12.50" → 1250 cents (expense = negative)
  const parseAmountCents = useCallback(() => {
    const clean = amountText.replace(/[$,]/g, "").trim();
    if (clean === "" || clean === "-") return 0;
    const num = parseFloat(clean);
    if (isNaN(num)) return 0;
    return Math.round(Math.abs(num) * 100);
  }, [amountText]);

  const selectedAccount =
    formData.status === "ready"
      ? (formData.data.accounts.find((a) => a.id === selectedAccountId) ?? null)
      : null;

  const selectedCategory =
    formData.status === "ready"
      ? (formData.data.categories.find((c) => c.id === selectedCategoryId) ??
        null)
      : null;

  const handleSave = useCallback(async () => {
    if (!selectedAccountId) {
      Alert.alert("Missing account", "Please select an account.");
      return;
    }
    if (!merchant.trim()) {
      Alert.alert("Missing merchant", "Please enter a merchant name.");
      return;
    }

    const amountCents = parseAmountCents();
    if (amountCents === 0) {
      Alert.alert("Missing amount", "Please enter an amount.");
      return;
    }

    // Parse date — default to today if invalid
    const occurredAt = Date.parse(dateText);
    const finalDate = isNaN(occurredAt) ? Date.now() : occurredAt;

    setIsSaving(true);
    try {
      await insertTransaction({
        accountId: selectedAccountId,
        categoryId: selectedCategoryId,
        merchant: merchant.trim(),
        amountCents: -Math.abs(amountCents), // expense = negative cents
        occurredAt: finalDate,
        note: note.trim() || undefined,
        source: method,
      });
      router.back();
    } catch (err) {
      Alert.alert(
        "Could not save",
        err instanceof Error ? err.message : "Something went wrong.",
      );
    } finally {
      setIsSaving(false);
    }
  }, [
    selectedAccountId,
    selectedCategoryId,
    merchant,
    note,
    dateText,
    method,
    parseAmountCents,
  ]);

  if (formData.status === "loading") {
    return (
      <View className="flex-1 items-center justify-center pt-safe bg-surface-bg">
        <Text className="text-sm text-text-secondary">Loading…</Text>
      </View>
    );
  }

  if (formData.status === "error") {
    return (
      <View className="flex-1 items-center justify-center px-8 pt-safe bg-surface-bg">
        <Text className="text-center text-sm text-rust">
          {formData.message}
        </Text>
      </View>
    );
  }

  const { accounts, categories } = formData.data;

  return (
    <View className="flex-1 pt-safe bg-surface-bg">
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
              <Text className="text-[14.5px] text-text-secondary">Cancel</Text>
            </Pressable>
            <Text className="font-fraunces-medium text-[18px] text-text-primary">
              New expense
            </Text>
            <Pressable
              onPress={handleSave}
              disabled={isSaving}
              className="active:opacity-60"
            >
              <Text
                className="font-manrope-bold text-[13px] text-brass"
                style={{ opacity: isSaving ? 0.4 : 1 }}
              >
                Save
              </Text>
            </Pressable>
          </View>

          {/* ── Amount display ── */}
          <View className="mb-6 items-center">
            <TextInput
              value={amountText}
              onChangeText={setAmountText}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={colors.textSecondary}
              className="text-center font-fraunces-medium text-[46px] text-brass"
              style={{ minWidth: 120 }}
            />
            {selectedAccount && (
              <Text className="mt-1 font-mono text-[11px] text-text-secondary">
                {selectedAccount.name} · Balance{" "}
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
            <PickerRow
              label="Account"
              value={selectedAccount?.name ?? "Select account"}
              onPress={() => {
                // Toggle between first account and null for quick demo;
                // a full picker modal would be used in production.
                const next =
                  selectedAccountId === null && accounts.length > 0
                    ? accounts[0].id
                    : accounts.length > 1 &&
                        accounts[0].id === selectedAccountId
                      ? accounts[1].id
                      : null;
                setSelectedAccountId(next);
              }}
            />

            <PickerRow
              label="Category"
              value={
                selectedCategory
                  ? `${selectedCategory.icon} ${selectedCategory.name}`
                  : "Select category"
              }
              onPress={() => {
                const expenseCategories = categories.filter(
                  (c) => c.kind === "expense",
                );
                if (expenseCategories.length === 0) return;
                const currentIdx = expenseCategories.findIndex(
                  (c) => c.id === selectedCategoryId,
                );
                const nextIdx =
                  currentIdx < expenseCategories.length - 1
                    ? currentIdx + 1
                    : 0;
                setSelectedCategoryId(expenseCategories[nextIdx].id);
              }}
            />

            <View className="rounded-2xl border border-hairline bg-surface-card px-4 py-3.5">
              <Text className="mb-1 font-mono text-[10.5px] uppercase tracking-[0.06em] text-text-secondary">
                Merchant
              </Text>
              <TextInput
                value={merchant}
                onChangeText={setMerchant}
                placeholder="e.g. Whole Foods"
                placeholderTextColor={colors.textSecondary}
                className="text-[13.5px] text-text-primary"
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>

            <View className="rounded-2xl border border-hairline bg-surface-card px-4 py-3.5">
              <Text className="mb-1 font-mono text-[10.5px] uppercase tracking-[0.06em] text-text-secondary">
                Note (optional)
              </Text>
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="Groceries for the week"
                placeholderTextColor={colors.textSecondary}
                className="text-[13.5px] text-text-primary"
                returnKeyType="done"
              />
            </View>

            <View className="rounded-2xl border border-hairline bg-surface-card px-4 py-3.5">
              <Text className="mb-1 font-mono text-[10.5px] uppercase tracking-[0.06em] text-text-secondary">
                Date
              </Text>
              <TextInput
                value={dateText}
                onChangeText={setDateText}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textSecondary}
                className="text-[13.5px] text-text-primary"
                keyboardType="numbers-and-punctuation"
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
