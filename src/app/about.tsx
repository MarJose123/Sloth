import { Linking, Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import * as Application from "expo-application";
import { SlothAppIcon } from "@/components/SlothAppIcon";
import { ArrowLeftIcon, ChevronRightIcon } from "@/components/navigation/icons";
import { useColors } from "@/theme/ThemeContext";

// ─── constants ────────────────────────────────────────────────────────────────

const APP_VERSION = Application.nativeApplicationVersion ?? "1.0.0";
const APP_BUILD_NUMBER = Application.nativeBuildVersion ?? "1";

const GITHUB_BASE = "https://github.com/MarJose123/sloth";

// ─── row components ───────────────────────────────────────────────────────────

function AboutRow({
  title,
  value,
  onPress,
}: {
  title: string;
  value?: string;
  onPress?: () => void;
}) {
  const colors = useColors();
  const content = (
    <View className="flex-row items-center justify-between border-t border-hairline py-[13px]">
      <View className="flex-1 pr-4">
        <Text className="text-[14.5px] font-manrope-semibold text-text-primary">
          {title}
        </Text>
      </View>
      {value !== undefined ? (
        <Text className="font-mono text-[13px] text-text-secondary">
          {value}
        </Text>
      ) : (
        <ChevronRightIcon size={18} color={colors.textSecondary} />
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} className="active:opacity-70">
        {content}
      </Pressable>
    );
  }

  return content;
}

// ─── screen ───────────────────────────────────────────────────────────────────

export default function AboutScreen() {
  const colors = useColors();
  const openUrl = (url: string) => {
    Linking.openURL(url).catch(() => {
      /* silent — link errors are non-critical */
    });
  };

  return (
    <View className="flex-1 pt-safe bg-surface-bg">
      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View className="mb-7 flex-row items-center gap-3">
          <Pressable
            onPress={() => router.back()}
            hitSlop={20}
            className="active:opacity-60"
          >
            <ArrowLeftIcon size={28} color={colors.textSecondary} />
          </Pressable>
          <Text className="font-fraunces-medium text-[20px] text-text-primary">
            About
          </Text>
        </View>

        {/* ── Brand section ── */}
        <View className="mb-7 items-center">
          <SlothAppIcon size={64} />
          <Text className="mt-3 font-fraunces-medium text-[22px] text-text-primary">
            Sloth
          </Text>
          <Text className="mt-1 font-mono text-[12px] text-text-secondary">
            Version {APP_VERSION} ({APP_BUILD_NUMBER})
          </Text>
        </View>

        {/* ── Description ── */}
        <Text className="mb-7 text-center text-sm leading-[19px] text-text-secondary">
          A private, fully offline finance tracker. No cloud, no sync, no
          accounts to create anywhere but here.
        </Text>

        {/* ── Rows ── */}
        <AboutRow
          title="Check for updates"
          onPress={() => openUrl(`${GITHUB_BASE}/releases`)}
        />
        <AboutRow title="License" value="GPLv3" />
        <AboutRow title="Source code" onPress={() => openUrl(GITHUB_BASE)} />
        <AboutRow
          title="Acknowledgments"
          onPress={() => openUrl(`${GITHUB_BASE}/blob/main/CONTRIBUTING.md`)}
        />

        {/* ── Footer ── */}
        <Text className="mt-8 text-center font-mono text-[12px] text-text-secondary">
          Made slowly, on purpose.
        </Text>
      </ScrollView>
    </View>
  );
}
