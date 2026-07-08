import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { colors } from "@/theme/colors";

// ─── types ────────────────────────────────────────────────────────────────────

interface ParsedFile {
  name: string;
  rowCount: number;
  columns: string[];
  preview: Record<string, string>[];
}

// ─── column mapping helpers ───────────────────────────────────────────────────

type FieldOption = "Date" | "Merchant" | "Amount" | "Category" | "Note" | "—";

const DEFAULT_MAPPING: Record<string, FieldOption> = {
  "Trans. Date": "Date",
  Description: "Merchant",
  Amount: "Amount",
};

// ─── screen ───────────────────────────────────────────────────────────────────

/**
 * CSV / OFX import screen — Screen 14.
 *
 * SCAFFOLD: Real file picking requires `expo-document-picker` which is not
 * yet in package.json. Add it with:
 *   bun add expo-document-picker@~57.0.0
 * then replace the stub in handlePickFile with:
 *   import * as DocumentPicker from "expo-document-picker";
 *   const result = await DocumentPicker.getDocumentAsync({ type: ["text/csv", "text/plain"] });
 *
 * CSV parsing will need a library such as papaparse.
 */
export default function ImportScreen() {
  const [parsedFile, setParsedFile] = useState<ParsedFile | null>(null);
  const [columnMapping, setColumnMapping] =
    useState<Record<string, FieldOption>>(DEFAULT_MAPPING);
  const [isImporting, setIsImporting] = useState(false);

  const handlePickFile = async () => {
    // TODO: Replace with real expo-document-picker call
    Alert.alert(
      "File picker not yet available",
      "expo-document-picker needs to be added to package.json.\n\nbun add expo-document-picker@~57.0.0",
      [
        {
          text: "Load demo data",
          onPress: () => {
            setParsedFile({
              name: "chase_export_june.csv",
              rowCount: 214,
              columns: ["Trans. Date", "Description", "Amount"],
              preview: [
                {
                  "Trans. Date": "07/04/2026",
                  Description: "Corner Market",
                  Amount: "-18.40",
                },
                {
                  "Trans. Date": "07/03/2026",
                  Description: "Metro Card",
                  Amount: "-33.00",
                },
                {
                  "Trans. Date": "07/01/2026",
                  Description: "Paycheck",
                  Amount: "+2140.00",
                },
              ],
            });
            setColumnMapping(DEFAULT_MAPPING);
          },
        },
        { text: "Cancel", style: "cancel" },
      ],
    );
  };

  const handleImport = async () => {
    if (!parsedFile) return;
    // TODO: Validate mapping, parse all rows, call insertTransaction for each
    setIsImporting(true);
    setTimeout(() => {
      setIsImporting(false);
      Alert.alert(
        "Import not yet wired",
        "Column mapping and transaction insertion will be connected once the CSV parsing pipeline is implemented.",
        [{ text: "OK" }],
      );
    }, 800);
  };

  const canImport = parsedFile !== null && !isImporting;

  return (
    <View className="flex-1 bg-ink pt-safe">
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
            <Text className="text-[13px] text-parchment-dim">Cancel</Text>
          </Pressable>
          <Text className="font-fraunces-medium text-[20px] text-parchment">
            Import
          </Text>
          <Pressable
            onPress={handleImport}
            disabled={!canImport}
            className="active:opacity-60"
          >
            <Text
              className="font-manrope-bold text-[13px] text-brass"
              style={{ opacity: canImport ? 1 : 0.35 }}
            >
              Import
            </Text>
          </Pressable>
        </View>

        {/* ── File drop zone ── */}
        <Pressable
          onPress={handlePickFile}
          className="mb-5 rounded-2xl border border-dashed border-parchment/25 bg-ink-2 px-4 py-5 active:opacity-70"
        >
          {parsedFile ? (
            <>
              <View className="mb-1 flex-row items-center gap-2">
                <Text className="text-[13px] font-manrope-bold text-parchment">
                  ▤ {parsedFile.name}
                </Text>
              </View>
              <Text className="text-[11px] text-parchment-dim">
                {parsedFile.rowCount} rows detected · parsed on this device
              </Text>
            </>
          ) : (
            <Text className="text-center text-[13px] text-parchment-dim">
              Tap to choose a CSV or OFX file
            </Text>
          )}
        </Pressable>

        {parsedFile && (
          <>
            {/* ── Target account ── */}
            <Text className="mb-2 font-mono text-[10.5px] uppercase tracking-[0.08em] text-brass">
              Import into
            </Text>
            <Pressable className="mb-5 flex-row items-center justify-between rounded-2xl border border-white/[0.09] bg-ink-2 px-4 py-3.5 active:opacity-70">
              <Text className="text-[13px] text-parchment">
                Select account…
              </Text>
              <Text className="text-sm text-parchment-dim">›</Text>
            </Pressable>

            {/* ── Column mapping ── */}
            <Text className="mb-2 font-mono text-[10.5px] uppercase tracking-[0.08em] text-brass">
              Column mapping
            </Text>
            <View className="mb-5 overflow-hidden rounded-2xl border border-white/[0.09] bg-ink-2">
              {parsedFile.columns.map((col, i) => (
                <View
                  key={col}
                  className={`flex-row items-center gap-3 px-4 py-3 ${
                    i > 0 ? "border-t border-white/[0.09]" : ""
                  }`}
                >
                  <Text className="flex-1 font-mono text-[12px] text-parchment-dim">
                    &quot;{col}&quot;
                  </Text>
                  <Text className="text-[12px] text-brass">→</Text>
                  <Text className="flex-1 text-right text-[12.5px] font-manrope-semibold text-parchment">
                    {columnMapping[col] ?? "—"}
                  </Text>
                </View>
              ))}
            </View>

            {/* ── Preview ── */}
            <Text className="mb-2 font-mono text-[11px] uppercase tracking-[1px] text-parchment-dim">
              Preview — first rows
            </Text>
            {parsedFile.preview.map((row, idx) => {
              const merchant = row["Description"] ?? row["Merchant"] ?? "—";
              const amount = row["Amount"] ?? "";
              const isPositive = amount.startsWith("+");
              return (
                <View
                  key={idx}
                  className={`flex-row justify-between py-2 ${
                    idx > 0 ? "border-t border-white/[0.09]" : ""
                  }`}
                >
                  <Text className="text-[12px] text-parchment">{merchant}</Text>
                  <Text
                    className="font-mono text-[12px]"
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
