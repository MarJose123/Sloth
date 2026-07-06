import { useCallback, useMemo, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAddTransactionData } from "@/hooks/useAddTransactionData";
import { insertTransaction } from "@/lib/db/repositories/transactions";
import type { AccountWithBalance } from "@/lib/db/repositories/accounts";
import type { Category } from "@/lib/db/repositories/categories";
import { colors } from "@/theme/colors";
import { formatCurrency } from "@/lib/format";

// ─── helpers ─────────────────────────────────────────────────────────────────

function getAccountInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return (words[0] ?? "").slice(0, 2).toUpperCase();
  return words
    .slice(0, 2)
    .map((w) => (w[0] ?? "").toUpperCase())
    .join("");
}

function formatTimeDisplay(d: Date): string {
  const hours = d.getHours();
  const mins = String(d.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  const h = hours % 12 || 12;
  return `Today, ${h}:${mins} ${ampm}`;
}

// ─── picker item components ───────────────────────────────────────────────────

function AccountPickerItem({
  account,
  selected,
  onSelect,
}: {
  account: AccountWithBalance;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <Pressable
      onPress={onSelect}
      className={`mb-2 flex-row items-center gap-3 rounded-2xl border p-4 active:opacity-80 ${
        selected
          ? "border-brass/50 bg-brass/10"
          : "border-white/[0.09] bg-ink-2"
      }`}
    >
      <View
        className="h-10 w-10 flex-shrink-0 items-center justify-center rounded-[11px]"
        style={{ backgroundColor: account.colorHex }}
      >
        <Text
          className="font-mono-medium text-xs"
          style={{ color: colors.ink }}
        >
          {getAccountInitials(account.name)}
        </Text>
      </View>
      <View className="flex-1">
        <Text
          className="text-sm font-manrope-semibold text-parchment"
          numberOfLines={1}
        >
          {account.name}
        </Text>
        <Text className="font-mono text-[11px] text-parchment-dim">
          {account.type.toUpperCase()}
        </Text>
      </View>
      <Text
        className={`font-mono text-xs ${selected ? "text-brass" : "text-parchment-dim"}`}
      >
        {selected ? "✓" : formatCurrency(account.balanceCents)}
      </Text>
    </Pressable>
  );
}

function CategoryPickerItem({
  category,
  selected,
  onSelect,
}: {
  category: Category;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <Pressable
      onPress={onSelect}
      className={`mb-2 flex-row items-center gap-3 rounded-2xl border p-4 active:opacity-80 ${
        selected
          ? "border-brass/50 bg-brass/10"
          : "border-white/[0.09] bg-ink-2"
      }`}
    >
      <View
        className="h-10 w-10 flex-shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: category.colorHex + "33" }}
      >
        <Text style={{ fontSize: 20 }}>{category.icon}</Text>
      </View>
      <View className="flex-1">
        <Text
          className="text-sm font-manrope-semibold text-parchment"
          numberOfLines={1}
        >
          {category.name}
        </Text>
        <Text className="font-mono text-[11px] uppercase text-parchment-dim">
          {category.kind}
        </Text>
      </View>
      {selected && <Text className="text-sm text-brass">✓</Text>}
    </Pressable>
  );
}

// ─── entry methods ────────────────────────────────────────────────────────────

const ENTRY_METHODS = ["Manual", "Scan receipt", "Import"] as const;
type EntryMethod = (typeof ENTRY_METHODS)[number];

// ─── screen ───────────────────────────────────────────────────────────────────

export default function AddScreen() {
  const dataState = useAddTransactionData();

  // ── form state ──────────────────────────────────────────────────────────────
  const [amountText, setAmountText] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    null,
  );
  const [merchant, setMerchant] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  const [entryMethod, setEntryMethod] = useState<EntryMethod>("Manual");
  const [pickerOpen, setPickerOpen] = useState<"account" | "category" | null>(
    null,
  );
  const [saving, setSaving] = useState(false);

  const merchantRef = useRef<TextInput>(null);

  // ── stable date display (captured at mount, not on every re-render) ─────────
  const dateDisplay = useMemo(() => formatTimeDisplay(new Date()), []);

  const data = dataState.status === "ready" ? dataState.data : null;

  /**
   * The effective account ID is either the one explicitly chosen by the user
   * or, if they haven't picked one yet, the first account from the loaded data.
   * This avoids a "cascading render" lint warning by deriving the default
   * instead of setting it in a useEffect.
   */
  const effectiveAccountId = selectedAccountId ?? data?.accounts[0]?.id ?? null;

  const selectedAccount =
    data?.accounts.find((a) => a.id === effectiveAccountId) ?? null;

  const selectedCategory =
    data?.categories.find((c) => c.id === selectedCategoryId) ?? null;

  /**
   * Transaction kind is driven by the selected category. Falls back to
   * "expense" when no category is chosen, which is the common case for
   * day-to-day entry.
   */
  const transactionKind = selectedCategory?.kind ?? "expense";

  const amountCents = useMemo(() => {
    const val = parseFloat(amountText);
    if (!amountText || isNaN(val) || val <= 0) return 0;
    // Math.round guards against floating-point drift (e.g. 18.40 * 100 = 1839.9999…)
    return Math.round(val * 100);
  }, [amountText]);

  const signedAmountCents =
    transactionKind === "expense" ? -amountCents : amountCents;

  const canSave =
    amountCents > 0 &&
    !!effectiveAccountId &&
    merchant.trim().length > 0 &&
    !saving;

  // ── handlers ─────────────────────────────────────────────────────────────────

  const handleAmountChange = useCallback((text: string) => {
    // Strip everything except digits and a single decimal point.
    const stripped = text.replace(/[^0-9.]/g, "");
    const dotIdx = stripped.indexOf(".");
    if (dotIdx === -1) {
      setAmountText(stripped);
      return;
    }
    // Collapse any extra decimal points after the first.
    const before = stripped.slice(0, dotIdx + 1);
    const after = stripped.slice(dotIdx + 1).replace(/\./g, "");
    // Cap at two decimal places.
    if (after.length > 2) return;
    setAmountText(before + after);
  }, []);

  const handleEntryMethodPress = useCallback((m: EntryMethod) => {
    if (m === "Manual") {
      setEntryMethod("Manual");
      return;
    }
    Alert.alert("Coming soon", `${m} will be available in a future update.`, [
      { text: "OK" },
    ]);
  }, []);

  const handleSave = useCallback(async () => {
    if (!canSave || !effectiveAccountId) return;

    setSaving(true);
    try {
      await insertTransaction({
        accountId: effectiveAccountId,
        categoryId: selectedCategoryId,
        merchant: merchant.trim(),
        amountCents: signedAmountCents,
        occurredAt: Date.now(),
      });
      // Navigate to dashboard; useFocusEffect there will auto-refresh balances.
      router.navigate("/(app)/dashboard");
    } catch (err) {
      setSaving(false);
      Alert.alert(
        "Could not save",
        err instanceof Error ? err.message : "An unexpected error occurred.",
        [{ text: "OK" }],
      );
    }
  }, [
    canSave,
    effectiveAccountId,
    selectedCategoryId,
    merchant,
    signedAmountCents,
  ]);

  const handleCancel = useCallback(() => {
    router.navigate("/(app)/dashboard");
  }, []);

  // ── render ───────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView edges={["top", "left", "right"]} className="flex-1 bg-ink">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        {/* ── header ── */}
        <View className="flex-row items-center justify-between px-5 pb-[30px] pt-2">
          <Pressable onPress={handleCancel} className="py-1 active:opacity-60">
            <Text className="text-[13px] text-parchment-dim">Cancel</Text>
          </Pressable>

          <Text className="text-sm font-manrope-bold capitalize text-parchment">
            New {transactionKind}
          </Text>

          <Pressable
            onPress={handleSave}
            disabled={!canSave}
            className="py-1 active:opacity-60"
          >
            <Text
              className={`text-[13px] font-manrope-bold ${
                canSave ? "text-brass" : "text-parchment-dim"
              }`}
            >
              {saving ? "Saving…" : "Save"}
            </Text>
          </Pressable>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── amount entry ── */}
          <View className="mb-[30px] flex-row items-baseline justify-center pt-2">
            <Text
              style={{
                fontFamily: "Fraunces_450",
                fontSize: 28,
                lineHeight: 52,
                color: colors.parchmentDim,
              }}
            >
              $
            </Text>
            <TextInput
              value={amountText}
              onChangeText={handleAmountChange}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={colors.parchmentDim}
              maxLength={12}
              returnKeyType="done"
              style={{
                fontFamily: "Fraunces_450",
                fontSize: 46,
                lineHeight: 52,
                color: amountCents > 0 ? colors.parchment : colors.parchmentDim,
                minWidth: 80,
                textAlign: "left",
              }}
            />
          </View>

          {/* ── kind badge (shown once a category is selected) ── */}
          {selectedCategory !== null && (
            <View className="mb-4 flex-row justify-center">
              <View
                className="rounded-full px-3 py-1"
                style={{
                  backgroundColor:
                    selectedCategory.kind === "income"
                      ? colors.sage + "22"
                      : colors.rust + "22",
                  borderWidth: 1,
                  borderColor:
                    selectedCategory.kind === "income"
                      ? colors.sage + "55"
                      : colors.rust + "55",
                }}
              >
                <Text
                  className="font-mono text-[11px] uppercase"
                  style={{
                    color:
                      selectedCategory.kind === "income"
                        ? colors.sage
                        : colors.rust,
                  }}
                >
                  {selectedCategory.kind}
                </Text>
              </View>
            </View>
          )}

          {/* ── entry method pills ── */}
          <View className="mb-[22px] flex-row gap-2">
            {ENTRY_METHODS.map((m) => (
              <Pressable
                key={m}
                onPress={() => handleEntryMethodPress(m)}
                className={`flex-1 items-center rounded-full border py-2 active:opacity-70 ${
                  m === entryMethod
                    ? "border-brass/50 bg-brass/[0.14]"
                    : "border-white/[0.09]"
                }`}
              >
                <Text
                  className={`text-[11.5px] font-manrope-bold ${
                    m === entryMethod ? "text-brass" : "text-parchment-dim"
                  }`}
                >
                  {m}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* ── account field ── */}
          <Pressable
            onPress={() => setPickerOpen("account")}
            className="mb-3 rounded-2xl border border-white/[0.09] bg-ink-2 px-4 py-3.5 active:opacity-80"
          >
            <Text className="mb-1.5 font-mono text-[10.5px] uppercase tracking-[1px] text-parchment-dim">
              Account
            </Text>
            {selectedAccount !== null ? (
              <View className="flex-row items-center gap-2">
                <View
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: selectedAccount.colorHex }}
                />
                <Text className="text-sm text-parchment">
                  {selectedAccount.name}
                </Text>
              </View>
            ) : (
              <Text className="text-sm text-parchment-dim">
                {dataState.status === "loading" ? "Loading…" : "Select account"}
              </Text>
            )}
          </Pressable>

          {/* ── merchant field ── */}
          <View className="mb-3 rounded-2xl border border-white/[0.09] bg-ink-2 px-4 py-3.5">
            <Text className="mb-1.5 font-mono text-[10.5px] uppercase tracking-[1px] text-parchment-dim">
              Merchant
            </Text>
            <TextInput
              ref={merchantRef}
              value={merchant}
              onChangeText={setMerchant}
              placeholder="e.g. Corner Market"
              placeholderTextColor={colors.parchmentDim}
              autoCapitalize="words"
              returnKeyType="done"
              style={{
                fontSize: 14,
                color: colors.parchment,
                padding: 0,
                margin: 0,
              }}
            />
          </View>

          {/* ── category field ── */}
          <Pressable
            onPress={() => setPickerOpen("category")}
            className="mb-3 rounded-2xl border border-white/[0.09] bg-ink-2 px-4 py-3.5 active:opacity-80"
          >
            <Text className="mb-1.5 font-mono text-[10.5px] uppercase tracking-[1px] text-parchment-dim">
              Category
            </Text>
            {selectedCategory !== null ? (
              <View className="flex-row items-center gap-2">
                <Text style={{ fontSize: 16 }}>{selectedCategory.icon}</Text>
                <Text className="text-sm text-parchment">
                  {selectedCategory.name}
                </Text>
              </View>
            ) : (
              <Text className="text-sm text-parchment-dim">
                None (optional)
              </Text>
            )}
          </Pressable>

          {/* ── date field (read-only in this version) ── */}
          <View className="mb-6 rounded-2xl border border-white/[0.09] bg-ink-2 px-4 py-3.5">
            <Text className="mb-1.5 font-mono text-[10.5px] uppercase tracking-[1px] text-parchment-dim">
              Date
            </Text>
            <Text className="text-sm text-parchment">{dateDisplay}</Text>
          </View>

          {/* ── privacy hint ── */}
          <View className="flex-row items-center gap-2">
            <Text className="text-[11.5px] text-sage">
              ◎ Processed on this device — nothing uploaded
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── account picker modal ── */}
      <Modal
        visible={pickerOpen === "account"}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setPickerOpen(null)}
      >
        <SafeAreaView
          edges={["top", "left", "right"]}
          className="flex-1 bg-ink"
        >
          <View className="flex-row items-center justify-between border-b border-white/[0.09] px-5 py-4">
            <Text className="font-fraunces-medium text-xl text-parchment">
              Select account
            </Text>
            <Pressable
              onPress={() => setPickerOpen(null)}
              className="active:opacity-60"
            >
              <Text className="font-manrope-bold text-brass">Done</Text>
            </Pressable>
          </View>
          <ScrollView
            className="flex-1 px-5 pt-4"
            contentContainerStyle={{ paddingBottom: 32 }}
          >
            {(data?.accounts ?? []).length === 0 ? (
              <Text className="py-10 text-center text-sm text-parchment-dim">
                No accounts yet.{"\n"}Add one from the Accounts tab.
              </Text>
            ) : (
              (data?.accounts ?? []).map((account) => (
                <AccountPickerItem
                  key={account.id}
                  account={account}
                  selected={effectiveAccountId === account.id}
                  onSelect={() => {
                    setSelectedAccountId(account.id);
                    setPickerOpen(null);
                  }}
                />
              ))
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ── category picker modal ── */}
      <Modal
        visible={pickerOpen === "category"}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setPickerOpen(null)}
      >
        <SafeAreaView
          edges={["top", "left", "right"]}
          className="flex-1 bg-ink"
        >
          <View className="flex-row items-center justify-between border-b border-white/[0.09] px-5 py-4">
            <Text className="font-fraunces-medium text-xl text-parchment">
              Select category
            </Text>
            <Pressable
              onPress={() => setPickerOpen(null)}
              className="active:opacity-60"
            >
              <Text className="font-manrope-bold text-brass">Done</Text>
            </Pressable>
          </View>
          <ScrollView
            className="flex-1 px-5 pt-4"
            contentContainerStyle={{ paddingBottom: 32 }}
          >
            {/* ── "None" option — always first ── */}
            <Pressable
              onPress={() => {
                setSelectedCategoryId(null);
                setPickerOpen(null);
              }}
              className={`mb-2 flex-row items-center gap-3 rounded-2xl border p-4 active:opacity-80 ${
                selectedCategoryId === null
                  ? "border-brass/50 bg-brass/10"
                  : "border-white/[0.09] bg-ink-2"
              }`}
            >
              <View className="h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-ink-3">
                <Text className="text-lg text-parchment-dim">○</Text>
              </View>
              <View className="flex-1">
                <Text className="text-sm font-manrope-semibold text-parchment">
                  None
                </Text>
                <Text className="font-mono text-[11px] text-parchment-dim">
                  Skip categorisation
                </Text>
              </View>
              {selectedCategoryId === null && (
                <Text className="text-sm text-brass">✓</Text>
              )}
            </Pressable>

            {(data?.categories ?? []).length === 0 ? (
              <Text className="py-6 text-center text-sm text-parchment-dim">
                No categories yet.{"\n"}Add one in Settings → Categories.
              </Text>
            ) : (
              (data?.categories ?? []).map((category) => (
                <CategoryPickerItem
                  key={category.id}
                  category={category}
                  selected={selectedCategoryId === category.id}
                  onSelect={() => {
                    setSelectedCategoryId(category.id);
                    setPickerOpen(null);
                  }}
                />
              ))
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
