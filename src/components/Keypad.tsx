import { View, Pressable, Text } from 'react-native';

interface KeypadProps {
    onDigit: (digit: string) => void;
    onBackspace: () => void;
}

const DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

export function Keypad({ onDigit, onBackspace }: KeypadProps) {
    return (
        <View className="mt-auto flex-row flex-wrap justify-between gap-y-3.5">
            {DIGITS.map((digit) => (
                <KeypadKey key={digit} label={digit} onPress={() => onDigit(digit)} />
            ))}
            <View className="aspect-square w-[30%]" />
            <KeypadKey label="0" onPress={() => onDigit('0')} />
            <KeypadKey label="⌫" onPress={onBackspace} muted />
        </View>
    );
}

function KeypadKey({
                       label,
                       onPress,
                       muted = false,
                   }: {
    label: string;
    onPress: () => void;
    muted?: boolean;
}) {
    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={label === '⌫' ? 'Backspace' : `Digit ${label}`}
            className={`aspect-square w-[30%] items-center justify-center rounded-full active:opacity-70 ${
                muted ? 'bg-transparent' : 'border border-hairline bg-ink-2'
            }`}
        >
            <Text className="font-serif text-xl text-parchment">{label}</Text>
        </Pressable>
    );
}
