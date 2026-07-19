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
import { useAddTransactionData } from "@/hooks/useAddTransactionData";
import { useColors } from "@/theme/ThemeContext";
import { formatCurrency, formatAmountOnBlur } from "@/lib/format";
import { onAccountSelected, onCategorySelected } from "@/lib/selectionBus";
import { useToast } from "@/hooks/useToast";
import { insertTransaction } from "@/lib/db/repositories/transactions";
import Color from "color";

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
        style={{
          color: active ? colors.brass : colors.textSecondary,
        }}
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
        {value || "Select…"}
      </Text>
    </Pressable>
  );
}

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
  const [amountText, setAmountText] = useState(() => {
    const cents = parseInt(params.amountCents ?? "", 10);
    return !isNaN(cents) ? (cents / 100).toFixed(2) : "0";
  });
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    params.selectedAccountId ?? null,
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    params.selectedCategoryId ?? null,
  );
  const [merchant, setMerchant] = useState(params.merchant ?? "");
  const [note, setNote] = useState("");
  const [dateText, setDateText] = useState(() => {
    if (params.date) return params.date;
    const d = new Date();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const year = d.getFullYear();
    return `${month}/${day}/${year}`;
  });
  const [isSaving, setIsSaving] = useState(false);

  // ── Picker sheet subscriptions ──
  useEffect(() => {
    const unsubAccount = onAccountSelected.subscribe((id) => {
      setSelectedAccountId(id);
    });
    const unsubCategory = onCategorySelected.subscribe((id) => {
      setSelectedCategoryId(id);
    });
    return () => {
      unsubAccount();
      unsubCategory();
    };
  }, []);

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
      toast.warning("Missing account", {
        description: "Please select an account.",
      });
      return;
    }
    if (!merchant.trim()) {
      toast.warning("Missing merchant", {
        description: "Please enter a merchant name.",
      });
      return;
    }

    const amountCents = parseAmountCents();
    if (amountCents === 0) {
      toast.warning("Missing amount", {
        description: "Please enter an amount.",
      });
      return;
    }

    const occurredAt = Date.parse(dateText);
    const finalDate = isNaN(occurredAt) ? Date.now() : occurredAt;

    setIsSaving(true);
    try {
      await insertTransaction({
        accountId: selectedAccountId,
        categoryId: selectedCategoryId,
        merchant: merchant.trim(),
        amountCents: -Math.abs(amountCents),
        occurredAt: finalDate,
        note: note.trim() || undefined,
        source: method,
      });
      router.back();
    } catch (err) {
      toast.error("Could not save", {
        description:
          err instanceof Error ? err.message : "Something went wrong.",
      });
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
    toast,
  ]);

  if (formData.status === "loading") {
    return (
      <View
        className="flex-1 items-center justify-center pt-safe "
        style={{
          backgroundColor: colors.surfaceBg,
        }}
      >
        <Text
          className="text-sm "
          style={{
            color: colors.textSecondary,
          }}
        >
          Loading…
        </Text>
      </View>
    );
  }

  if (formData.status === "error") {
    return (
      <View
        className="flex-1 items-center justify-center px-8 pt-safe "
        style={{
          backgroundColor: colors.surfaceBg,
        }}
      >
        <Text
          className="text-center text-sm "
          style={{
            color: colors.rust,
          }}
        >
          {formData.message}
        </Text>
      </View>
    );
  }

  const { accounts, categories } = formData.data;

  return (
    <View
      className="flex-1 pt-safe-offset-5 "
      style={{
        backgroundColor: colors.surfaceBg,
      }}
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
          <View className="mb-6 flex-row items-center justify-between">
            <Pressable
              onPress={() => router.back()}
              className="active:opacity-60"
            >
              <Text
                className="text-[14.5px] "
                style={{
                  color: colors.textSecondary,
                }}
              >
                Cancel
              </Text>
            </Pressable>
            <Text
              className="font-fraunces-medium text-[18px] "
              style={{
                color: colors.textPrimary,
              }}
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
            <TextInput
              value={amountText}
              onChangeText={setAmountText}
              onBlur={() => setAmountText(formatAmountOnBlur(amountText))}
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
            {selectedAccount && (
              <Text
                className="mt-1 font-mono text-[11px] "
                style={{ color: colors.textSecondary }}
              >
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
                if (accounts.length === 0) {
                  toast.warning("No accounts", {
                    description: "Create an account first.",
                  });
                  return;
                }
                router.push("/select-account");
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

            <View
              className="rounded-2xl border   px-4 py-3.5"
              style={{
                backgroundColor: colors.surfaceCard,
                borderColor: colors.hairline,
              }}
            >
              <Text
                className="mb-1 font-mono text-[10.5px] uppercase tracking-[0.06em] "
                style={{
                  color: colors.textSecondary,
                }}
              >
                Merchant
              </Text>
              <TextInput
                value={merchant}
                onChangeText={setMerchant}
                placeholder="e.g. Whole Foods"
                placeholderTextColor={colors.textSecondary}
                style={{
                  fontSize: 13.5,
                  color: colors.textPrimary,
                }}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>

            <View
              className="rounded-2xl border   px-4 py-3.5"
              style={{
                backgroundColor: colors.surfaceCard,
                borderColor: colors.hairline,
              }}
            >
              <Text
                className="mb-1 font-mono text-[10.5px] uppercase tracking-[0.06em] "
                style={{ color: colors.textSecondary }}
              >
                Note (optional)
              </Text>
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="Groceries for the week"
                placeholderTextColor={colors.textSecondary}
                style={{
                  fontSize: 13.5,
                  color: colors.textPrimary,
                }}
                returnKeyType="done"
              />
            </View>

            <View
              className="rounded-2xl border  px-4 py-3.5"
              style={{
                backgroundColor: colors.surfaceCard,
                borderColor: colors.hairline,
              }}
            >
              <Text
                className="mb-1 font-mono text-[10.5px] uppercase tracking-[0.06em] "
                style={{
                  color: colors.textSecondary,
                }}
              >
                Date
              </Text>
              <TextInput
                value={dateText}
                onChangeText={setDateText}
                placeholder="MM/DD/YYYY"
                placeholderTextColor={colors.textSecondary}
                style={{
                  fontSize: 13.5,
                  color: colors.textPrimary,
                }}
                keyboardType="numbers-and-punctuation"
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
