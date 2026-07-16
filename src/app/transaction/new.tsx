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
import { router } from "expo-router";
import { useAddTransactionData } from "@/hooks/useAddTransactionData";
import { insertTransaction } from "@/lib/db/repositories/transactions";
import { formatCurrency } from "@/lib/format";
import { useColors } from "@/theme/ThemeContext";

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
        active ? "border border-brass/50 bg-brass/10" : "bg-ink-3"
      }`}
    >
      <Text
        className={`text-[12px] font-manrope-semibold ${
          active ? "text-brass" : "text-parchment-dim"
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
      className="rounded-2xl border border-white/[0.09] bg-ink-2 px-4 py-3.5 active:opacity-70"
    >
      <Text className="mb-1 font-mono text-[10.5px] uppercase tracking-[0.06em] text-parchment-dim">
        {label}
      </Text>
      <Text className="text-[13.5px] text-parchment">{value || "Select…"}</Text>
    </Pressable>
  );
}

export default function AddTransactionScreen() {
  const colors = useColors();
  const formData = useAddTransactionData();

  const [method, setMethod] = useState<Method>("manual");
  const [amountText, setAmountText] = useState("0");
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    null,
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  const [merchant, setMerchant] = useState("");
  const [note, setNote] = useState("");
  const [dateText, setDateText] = useState(
    new Date().toISOString().slice(0, 10),
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
    parseAmountCents,
  ]);

  if (formData.status === "loading") {
    return (
      <View className="flex-1 items-center justify-center bg-ink pt-safe">
        <Text className="text-sm text-parchment-dim">Loading…</Text>
      </View>
    );
  }

  if (formData.status === "error") {
    return (
      <View className="flex-1 items-center justify-center bg-ink px-8 pt-safe">
        <Text className="text-center text-sm text-rust">
          {formData.message}
        </Text>
      </View>
    );
  }

  const { accounts, categories } = formData.data;

  return (
    <View className="flex-1 bg-ink pt-safe">
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
              <Text className="text-[14.5px] text-parchment-dim">Cancel</Text>
            </Pressable>
            <Text className="font-fraunces-medium text-[18px] text-parchment">
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
              placeholderTextColor={colors.parchmentDim}
              className="text-center font-fraunces-medium text-[46px] text-brass"
              style={{ minWidth: 120 }}
            />
            {selectedAccount && (
              <Text className="mt-1 font-mono text-[11px] text-parchment-dim">
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

            <View className="rounded-2xl border border-white/[0.09] bg-ink-2 px-4 py-3.5">
              <Text className="mb-1 font-mono text-[10.5px] uppercase tracking-[0.06em] text-parchment-dim">
                Merchant
              </Text>
              <TextInput
                value={merchant}
                onChangeText={setMerchant}
                placeholder="e.g. Whole Foods"
                placeholderTextColor={colors.parchmentDim}
                className="text-[13.5px] text-parchment"
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>

            <View className="rounded-2xl border border-white/[0.09] bg-ink-2 px-4 py-3.5">
              <Text className="mb-1 font-mono text-[10.5px] uppercase tracking-[0.06em] text-parchment-dim">
                Note (optional)
              </Text>
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="Groceries for the week"
                placeholderTextColor={colors.parchmentDim}
                className="text-[13.5px] text-parchment"
                returnKeyType="done"
              />
            </View>

            <View className="rounded-2xl border border-white/[0.09] bg-ink-2 px-4 py-3.5">
              <Text className="mb-1 font-mono text-[10.5px] uppercase tracking-[0.06em] text-parchment-dim">
                Date
              </Text>
              <TextInput
                value={dateText}
                onChangeText={setDateText}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.parchmentDim}
                className="text-[13.5px] text-parchment"
                keyboardType="numbers-and-punctuation"
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
