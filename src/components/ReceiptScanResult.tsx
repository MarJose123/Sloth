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
 * ReceiptScanResult — full-screen receipt result view (Screen 13).
 *
 * Shown after a receipt is captured and parsed by OCR, replacing the camera
 * viewport so the user can review the detected fields before confirming.
 */

import { Pressable, ScrollView, Text, View } from "react-native";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useColors } from "@/theme/ThemeContext";
import { colors } from "@/theme/colors";
import { formatPhilippineCurrency, formatReceiptDate } from "@/lib/ocr";
import type { OcrResult } from "@/types";

interface ReceiptScanResultProps {
  result: OcrResult;
  onClose: () => void;
  onConfirm: () => void;
  onRetake: () => void;
}

export function ReceiptScanResult({
  result,
  onClose,
  onConfirm,
  onRetake,
}: ReceiptScanResultProps) {
  const c = useColors();

  return (
    <View className="flex-1 bg-surface-bg pt-safe">
      {/* ── Header ── */}
      <View className="flex-row items-center justify-between px-5 pb-3 pt-4">
        <Pressable onPress={onClose} hitSlop={20} className="active:opacity-60">
          <Lucide name="x" size={24} color={c.textSecondary} />
        </Pressable>
        <Text
          className="font-fraunces-medium text-[18px]"
          style={{ color: c.textPrimary }}
        >
          Scan result
        </Text>
        {/* Spacer balances the centered title */}
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Detected tag ── */}
        <View className="mb-3 flex-row items-center gap-1.5">
          <Lucide name="circle-dot" size={12} color={colors.sage} />
          <Text
            className="font-mono text-[11px]"
            style={{ color: colors.sage }}
          >
            Detected on-device
          </Text>
        </View>

        {/* ── Detected fields card ── */}
        <View
          className="rounded-2xl border px-4 py-4"
          style={{
            backgroundColor: c.surfaceCard,
            borderColor: c.hairline,
          }}
        >
          {/* Merchant */}
          <View className="mb-2.5 flex-row justify-between">
            <Text
              className="text-xs font-manrope"
              style={{ color: c.textSecondary }}
            >
              Merchant
            </Text>
            <Text
              className="text-sm font-manrope-semibold"
              style={{ color: c.textPrimary }}
            >
              {result.merchant ?? "\u2014"}
            </Text>
          </View>

          {/* Amount */}
          <View className="mb-2.5 flex-row justify-between">
            <Text
              className="text-xs font-manrope"
              style={{ color: c.textSecondary }}
            >
              Amount
            </Text>
            <Text
              className="text-sm font-manrope-semibold"
              style={{ color: c.textPrimary }}
            >
              {result.amountCents != null
                ? formatPhilippineCurrency(result.amountCents)
                : "\u2014"}
            </Text>
          </View>

          {/* Date */}
          <View className="mb-2.5 flex-row justify-between">
            <Text
              className="text-xs font-manrope"
              style={{ color: c.textSecondary }}
            >
              Date
            </Text>
            <Text
              className="text-sm font-manrope-semibold"
              style={{ color: c.textPrimary }}
            >
              {formatReceiptDate(result.date)}
            </Text>
          </View>

          {/* Raw text preview */}
          <View className="border-t pt-2.5" style={{ borderColor: c.hairline }}>
            <Text
              className="mb-1 font-mono text-[10px]"
              style={{ color: c.textSecondary }}
            >
              Raw OCR text
            </Text>
            <Text
              className="font-mono text-[10px] leading-[1.4]"
              style={{ color: c.textSecondary }}
              numberOfLines={4}
            >
              {result.rawText.slice(0, 200)}
              {result.rawText.length > 200 ? "\u2026" : ""}
            </Text>
          </View>
        </View>

        {/* ── Use these details ── */}
        <Pressable
          onPress={onConfirm}
          className="mt-5 rounded-2xl bg-brass py-3.5 active:opacity-80"
        >
          <View className="flex-row items-center justify-center gap-1.5">
            <Text
              className="text-sm font-manrope-bold"
              style={{ color: colors.ink }}
            >
              Use these details
            </Text>
            <Lucide name="arrow-right" size={16} color={colors.ink} />
          </View>
        </Pressable>

        {/* ── Retake ── */}
        <Pressable
          onPress={onRetake}
          className="mt-3 active:opacity-60"
          style={{ alignItems: "center" }}
        >
          <Text
            className="text-xs font-manrope-semibold"
            style={{ color: c.textSecondary }}
          >
            Retake photo
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
