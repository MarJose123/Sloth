import * as Crypto from 'expo-crypto';

/**
 * SHA-256 hash of the PIN, salted with a fixed app-level string.
 * This gates app UI access only. It must not be treated as, or reused as,
 * the SQLCipher encryption key — derive that separately via a KDF and store
 * it in SecureStore under its own key, unlocked after this check passes.
 */
export async function hashPin(pin: string): Promise<string> {
    return Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        `sloth-pin-salt:${pin}`
    );
}

export function isValidPinFormat(pin: string): boolean {
    return /^\d{6}$/.test(pin);
}
