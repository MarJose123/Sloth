import { Pressable, ScrollView, Text, View } from "react-native";
import type { AccountWithBalance } from "@/lib/db/repositories/accounts";
import { useColors } from "@/theme/ThemeContext";
import { colors } from "@/theme/colors";
import Color from "color";

interface AccountSwitcherProps {
  accounts: AccountWithBalance[];
  selectedAccountId: string | null;
  onSelect: (accountId: string | null) => void;
}

export function AccountSwitcher({
  accounts,
  selectedAccountId,
  onSelect,
}: AccountSwitcherProps) {
  const colors = useColors();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="-mx-5 mb-4.5"
    >
      <View className="flex-row gap-2 px-5">
        <AccountChip
          label="All accounts"
          dotColor={colors.brass}
          active={selectedAccountId === null}
          onPress={() => onSelect(null)}
        />
        {accounts.map((account) => (
          <AccountChip
            key={account.id}
            label={account.name}
            dotColor={account.colorHex}
            active={selectedAccountId === account.id}
            onPress={() => onSelect(account.id)}
          />
        ))}
      </View>
    </ScrollView>
  );
}

interface AccountChipProps {
  label: string;
  dotColor: string;
  active: boolean;
  onPress: () => void;
}

function AccountChip({ label, dotColor, active, onPress }: AccountChipProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-1.5 rounded-full border px-3.5 py-2"
      style={{
        borderColor: active
          ? Color(colors.brass).alpha(0.5).toString()
          : colors.hairline,
        backgroundColor: active
          ? Color(colors.brass).alpha(0.1).toString()
          : undefined,
      }}
    >
      <View
        className="h-[7px] w-[7px] rounded-full"
        style={{ backgroundColor: dotColor }}
      />
      <Text
        className="text-[12.5px] font-manrope-semibold"
        style={{
          color: active ? colors.textPrimary : colors.textSecondary,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
