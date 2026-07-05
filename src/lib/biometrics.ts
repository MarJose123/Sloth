import * as LocalAuthentication from 'expo-local-authentication';

export type BiometricAvailability =
    | { available: true; type: 'facial' | 'fingerprint' | 'iris' }
    | { available: false; reason: 'no_hardware' | 'not_enrolled' };

export async function checkBiometricAvailability(): Promise<BiometricAvailability> {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) return { available: false, reason: 'no_hardware' };

    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    if (!isEnrolled) return { available: false, reason: 'not_enrolled' };

    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    const type = types.includes(
        LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION
    )
        ? 'facial'
        : types.includes(LocalAuthentication.AuthenticationType.IRIS)
            ? 'iris'
            : 'fingerprint';

    return { available: true, type };
}

export async function authenticateWithBiometrics(
    promptMessage = 'Unlock Sloth'
): Promise<boolean> {
    const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        cancelLabel: 'Use PIN instead',
        disableDeviceFallback: true, // we handle PIN fallback with our own screen
    });
    return result.success;
}
