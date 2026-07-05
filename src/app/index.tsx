import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { SplashScreen as CustomSplash } from '@/screens/SplashScreen';
import { storage } from '@/lib/storage';
import { getDb } from '@/lib/db/client';

type BootState =
    | { status: 'checking' }
    | { status: 'error'; message: string }
    | { status: 'needs_onboarding' }
    | { status: 'ready' };

export default function Index() {
    const [boot, setBoot] = useState<BootState>({ status: 'checking' });

    useEffect(() => {
        let cancelled = false;

        async function resolveBootState() {
            try {
                await getDb(); // opens (or creates) the encrypted DB and runs migrations
                const onboardingComplete = await storage.getOnboardingComplete();
                if (cancelled) return;
                setBoot(
                    onboardingComplete ? { status: 'ready' } : { status: 'needs_onboarding' }
                );
            } catch (err) {
                if (cancelled) return;
                setBoot({
                    status: 'error',
                    message: err instanceof Error ? err.message : 'Failed to open database',
                });
            }
        }

        resolveBootState();
        return () => {
            cancelled = true;
        };
    }, []);

    if (boot.status === 'checking') return <CustomSplash />;
    if (boot.status === 'error') {
        // Replace with a proper error screen before shipping — a DB open
        // failure here is unrecoverable without user action (e.g. corrupt file).
        return <CustomSplash />;
    }
    if (boot.status === 'needs_onboarding') return <Redirect href="/onboarding/welcome" />;
    return <Redirect href="/(app)/dashboard" />;
}
