import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import {
  ArrowRightIcon,
  ChevronRightIcon,
} from "@/components/navigation/icons";
import { useColors } from "@/theme/ThemeContext";
import { parseCsv, parseOfx, ofxAmountToCents, ofxDateToEpochMs } from "@/lib/csvParser";
import { useAccountsData } from "@/hooks/useAccountsData";
import { insertTransaction } from "@/lib/db/repositories/transactions";

// ─── types ────────────────────────────────────────────────────────────────────

interface ParsedFile {
  name: string;
  rowCount: number;
  columns: string[];
  preview: Record<string, string>[];
  rawRows: Record<string, string>[];
  type: "csv" | "ofx";
}

// ─── column mapping helpers ───────────────────────────────────────────────────

type FieldOption = "Date" | "Merchant" | "Amount" | "Category" | "Note" | "—";

const DEFAULT_MAPPING: Record<string, FieldOption> = {
  "Trans. Date": "Date",
  "Date": "Date",
  "Description": "Merchant",
  "Merchant": "Merchant",
  "Amount": "Amount",
};

// ─── screen ───────────────────────────────────────────────────────────────────

/**
 * CSV / OFX import screen — Screen 14.
 *
 * Uses `expo-document-picker` for file selection and `csvParser.ts`
 * for parsing content locally on-device.
 */
export default function ImportScreen() {
  const colors = useColors();
  const { state: accountsState } = useAccountsData();
  const [parsedFile, setParsedFile] = useState<ParsedFile | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [columnMapping, setColumnMapping] =
    useState<Record<string, FieldOption>>(DEFAULT_MAPPING);
  const [isImporting, setIsImporting] = useState(false);

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["text/csv", "text/comma-separated-values", "application/vnd.ms-excel", "application/x-ofx", "application/ofx"],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      const content = await FileSystem.readAsStringAsync(file.uri);
      const fileName = file.name.toLowerCase();

      if (fileName.endsWith(".csv")) {
        const { headers, rows } = parseCsv(content);
        setParsedFile({
          name: file.name,
          rowCount: rows.length,
          columns: headers,
          preview: rows.slice(0, 3),
          rawRows: rows,
          type: "csv",
        });

        // Try to auto-map common headers
        const newMapping = { ...DEFAULT_MAPPING };
        headers.forEach(h => {
          if (h.toLowerCase().includes("date")) newMapping[h] = "Date";
          if (h.toLowerCase().includes("desc") || h.toLowerCase().includes("merch")) newMapping[h] = "Merchant";
          if (h.toLowerCase().includes("amount")) newMapping[h] = "Amount";
        });
        setColumnMapping(newMapping);
      } else if (fileName.endsWith(".ofx") || fileName.endsWith(".qfx")) {
        const transactions = parseOfx(content);
        const rows = transactions.map(t => ({
          Date: t.datePosted,
          Merchant: t.name,
          Amount: t.amount,
          Memo: t.memo,
        }));

        setParsedFile({
          name: file.name,
          rowCount: rows.length,
          columns: ["Date", "Merchant", "Amount", "Memo"],
          preview: rows.slice(0, 3),
          rawRows: rows,
          type: "ofx",
        });
        setColumnMapping({
          Date: "Date",
          Merchant: "Merchant",
          Amount: "Amount",
          Memo: "Note",
        });
      } else {
        Alert.alert("Unsupported format", "Please choose a .csv or .ofx file.");
      }
    } catch (err) {
      Alert.alert("Error picking file", "Could not read the selected file.");
      console.error(err);
    }
  };

  const handleImport = async () => {
    if (!parsedFile || !selectedAccountId) return;

    setIsImporting(true);
    try {
      let importedCount = 0;
      for (const row of parsedFile.rawRows) {
        let dateValue = Date.now();
        let merchant = "Imported Transaction";
        let amountCents = 0;
        let note = "";

        if (parsedFile.type === "csv") {
          for (const [col, field] of Object.entries(columnMapping)) {
            const val = row[col];
            if (!val) continue;

            if (field === "Date") {
              const d = Date.parse(val);
              if (!isNaN(d)) dateValue = d;
            } else if (field === "Merchant") {
              merchant = val;
            } else if (field === "Amount") {
              const num = parseFloat(val.replace(/[$,]/g, ""));
              if (!isNaN(num)) amountCents = Math.round(num * 100);
            } else if (field === "Note") {
              note = val;
            }
          }
        } else {
          // OFX is pre-mapped
          const d = ofxDateToEpochMs(row["Date"]);
          if (d) dateValue = d;
          merchant = row["Merchant"];
          amountCents = ofxAmountToCents(row["Amount"]);
          note = row["Memo"];
        }

        await insertTransaction({
          accountId: selectedAccountId,
          categoryId: null,
          merchant,
          amountCents,
          occurredAt: dateValue,
          note: note || undefined,
          source: "import",
        });
        importedCount++;
      }

      Alert.alert("Import complete", `Successfully imported ${importedCount} transactions.`);
      router.back();
    } catch (err) {
      Alert.alert("Import failed", err instanceof Error ? err.message : "An error occurred during import.");
    } finally {
      setIsImporting(false);
    }
  };

  const selectedAccountName = accountsState.status === "ready"
    ? (accountsState.accounts.find(a => a.id === selectedAccountId)?.name ?? "Select account…")
    : "Loading accounts…";

  const canImport = parsedFile !== null && selectedAccountId !== null && !isImporting;

  return (
    <View
      className="flex-1 pt-safe"
      style={{ backgroundColor: colors.ink }}
    >
      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View className="mb-6 flex-row items-center justify-between">
          <Pressable
            onPress={() => router.back()}
            className="active:opacity-60"
          >
            <Text className="text-[14.5px] text-parchment-dim">{"Cancel"}</Text>
          </Pressable>
          <Text className="font-fraunces-medium text-[22px] text-parchment">
            {"Import"}
          </Text>
          <Pressable
            onPress={handleImport}
            disabled={!canImport}
            className="active:opacity-60"
          >
            <Text
              className="font-manrope-bold text-[14.5px] text-brass"
              style={{ opacity: canImport ? 1 : 0.35 }}
            >
              {isImporting ? "Working…" : "Import"}
            </Text>
          </Pressable>
        </View>

        {/* ── File drop zone ── */}
        <Pressable
          onPress={handlePickFile}
          className="mb-5 rounded-2xl border border-dashed border-hairline bg-ink-2 px-4 py-5 active:opacity-70"
        >
          {parsedFile ? (
            <>
              <View className="mb-1 flex-row items-center gap-2">
                <Text className="text-[14.5px] font-manrope-bold text-parchment">
                  ▤ {parsedFile.name}
                </Text>
              </View>
              <Text className="text-[12px] text-parchment-dim">
                {parsedFile.rowCount} {"rows detected · parsed on this device"}
              </Text>
            </>
          ) : (
            <Text className="text-center text-[14.5px] text-parchment-dim">
              {"Tap to choose a CSV or OFX file"}
            </Text>
          )}
        </Pressable>

        {parsedFile && (
          <>
            {/* ── Target account ── */}
            <Text className="mb-2 font-mono text-[11.5px] uppercase tracking-[0.08em] text-brass">
              {"Import into"}
            </Text>
            <Pressable
              onPress={() => {
                if (accountsState.status === "ready") {
                  Alert.alert("Select Account", "Choose an account to import into:",
                    accountsState.accounts.map(a => ({
                      text: a.name,
                      onPress: () => setSelectedAccountId(a.id)
                    })).concat([{ text: "Cancel", style: "cancel" }])
                  );
                }
              }}
              className="mb-5 flex-row items-center justify-between rounded-2xl border border-hairline bg-ink-2 px-4 py-3.5 active:opacity-70"
            >
              <Text className="text-[14.5px] text-parchment">
                {selectedAccountName}
              </Text>
              <ChevronRightIcon size={18} color={colors.parchmentDim} />
            </Pressable>

            {/* ── Column mapping ── */}
            {parsedFile.type === "csv" && (
              <>
                <Text className="mb-2 font-mono text-[11.5px] uppercase tracking-[0.08em] text-brass">
                  {"Column mapping"}
                </Text>
                <View className="mb-5 overflow-hidden rounded-2xl border border-hairline bg-ink-2">
                  {parsedFile.columns.map((col, i) => (
                    <View
                      key={col}
                      className={`flex-row items-center gap-3 px-4 py-3 ${
                        i > 0 ? "border-t border-hairline" : ""
                      }`}
                    >
                      <Text className="flex-1 font-mono text-[13px] text-parchment-dim" numberOfLines={1}>
                        {'"'}{col}{'"'}
                      </Text>
                      <ArrowRightIcon size={14} color={colors.brass} />
                      <Pressable
                        onPress={() => {
                          const options: FieldOption[] = ["Date", "Merchant", "Amount", "Category", "Note", "—"];
                          Alert.alert("Map to Field", `What does "${col}" represent?`,
                            options.map(opt => ({
                              text: opt,
                              onPress: () => setColumnMapping(prev => ({ ...prev, [col]: opt }))
                            })).concat([{ text: "Cancel", style: "cancel" }])
                          );
                        }}
                        className="flex-1"
                      >
                        <Text className="text-right text-[13.5px] font-manrope-semibold text-parchment">
                          {columnMapping[col] ?? "—"}
                        </Text>
                      </Pressable>
                    </View>
                  ))}
                </View>
              </>
            )}

            {/* ── Preview ── */}
            <Text className="mb-2 font-mono text-[12px] uppercase tracking-[1px] text-parchment-dim">
              {"Preview — first rows"}
            </Text>
            {parsedFile.preview.map((row, idx) => {
              const merchant = row["Merchant"] || row["Description"] || Object.values(row)[1] || "—";
              const amount = row["Amount"] || Object.values(row)[2] || "";
              const isPositive = amount.toString().startsWith("+") || (!amount.toString().startsWith("-") && parseFloat(amount.toString()) > 0);
              return (
                <View
                  key={idx}
                  className={`flex-row justify-between py-2 ${
                    idx > 0 ? "border-t border-hairline" : ""
                  }`}
                >
                  <Text className="flex-1 text-[13px] text-parchment" numberOfLines={1}>{merchant}</Text>
                  <Text
                    className="font-mono text-[13px]"
                    style={{
                      color: isPositive ? colors.sage : colors.parchmentDim,
                    }}
                  >
                    {amount}
                  </Text>
                </View>
              );
            })}
          </>
        )}
      </ScrollView>
    </View>
  );
}
