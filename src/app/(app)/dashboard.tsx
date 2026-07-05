import { View, Text, SafeAreaView } from 'react-native';

export default function DashboardScreen() {
    return (
        <SafeAreaView className="flex-1 bg-ink px-5 pt-6">
            <Text className="font-serif text-2xl text-parchment">Dashboard</Text>
            <Text className="mt-1 text-sm text-parchment-dim">
                Screen 04 goes here — wire next.
            </Text>
            <View className="flex-1" />
        </SafeAreaView>
    );
}
