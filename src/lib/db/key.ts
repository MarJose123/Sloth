import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

const DB_KEY_STORAGE_KEY = 'sloth.db_encryption_key';

/**
 * The SQLCipher encryption key is independent of PIN/biometric auth.
 * It's generated once on first launch, stored in the platform keystore,
 * and never derived from anything the user can reset or forget.
 *
 * PIN and biometrics gate whether the *app UI* is reachable — they do not
 * gate whether this key can be read. This means resetting a PIN, or a user
 * disabling biometrics, never requires re-encrypting the database.
 */
export async function getOrCreateDbEncryptionKey(): Promise<string> {
    const existing = await SecureStore.getItemAsync(DB_KEY_STORAGE_KEY);
    if (existing) return existing;

    const key = await generateRandomHexKey(32); // 256-bit
    await SecureStore.setItemAsync(DB_KEY_STORAGE_KEY, key, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
    return key;
}

async function generateRandomHexKey(byteLength: number): Promise<string> {
    const randomBytes = await Crypto.getRandomBytesAsync(byteLength);
    return Array.from(randomBytes)
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('');
}

/**
 * Destructive. Only ever called from an explicit "erase all data" flow —
 * deleting this key without also deleting the DB file leaves an
 * unopenable, permanently encrypted file on disk.
 */
export async function destroyDbEncryptionKey(): Promise<void> {
    await SecureStore.deleteItemAsync(DB_KEY_STORAGE_KEY);
}
