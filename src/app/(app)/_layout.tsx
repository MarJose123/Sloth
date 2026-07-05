import { Stack } from 'expo-router';

export default function AppLayout() {
    return (
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#1B1F1A' } }}>
            <Stack.Screen name="dashboard" />
        </Stack>
    );
}
