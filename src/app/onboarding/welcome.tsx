import { useCallback, useState } from "react";
import {
  View,
  Text,
  Dimensions,
  Pressable,
  StyleSheet,
  Alert,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
  type SharedValue,
} from "react-native-reanimated";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { DialFrame } from "@/components/DialFrame";
import { SlothMark } from "@/components/SlothMark";
import { FingerprintIcon } from "@/components/ui/FingerprintIcon";
import {
  checkBiometricAvailability,
  authenticateWithBiometrics,
} from "@/lib/biometrics";
import { storage } from "@/lib/storage";
import { colors } from "@/theme/colors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const TOTAL_SLIDES = 3;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;
const HAIRLINE = "rgba(243,238,225,0.09)";

// ─── Feature data ─────────────────────────────────────────────────────────────
const FEATURES = [
  {
    index: 1,
    title: "No bank credentials, ever",
    description:
      "Add transactions by hand, receipt scan, or CSV import — never by logging in through us.",
  },
  {
    index: 2,
    title: "Processed on your phone",
    description:
      "Categorization and receipt scanning run locally. Nothing is sent out to learn from your spending.",
  },
  {
    index: 3,
    title: "Fully offline, always",
    description:
      "There's no server and no cloud. Back up manually to your own storage whenever you choose.",
  },
] as const;

// ─── Step dots ────────────────────────────────────────────────────────────────
function StepDots({
  activeIndex,
  onDotPress,
}: {
  activeIndex: number;
  onDotPress: (i: number) => void;
}) {
  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: TOTAL_SLIDES }).map((_, i) => (
        <Pressable key={i} onPress={() => onDotPress(i)} hitSlop={10}>
          <View
            style={[
              styles.dot,
              i === activeIndex ? styles.dotActive : styles.dotInactive,
            ]}
          />
        </Pressable>
      ))}
    </View>
  );
}

// ─── Brass button ─────────────────────────────────────────────────────────────
function BrassBtn({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }: { pressed: boolean }) => [
        styles.brassBtn,
        pressed && { opacity: 0.82 },
      ]}
      onPress={onPress}
    >
      <Text style={styles.brassBtnLabel}>{label}</Text>
    </Pressable>
  );
}

// ─── Feature row ──────────────────────────────────────────────────────────────
function FeatureRow({
  index,
  title,
  description,
  isLast,
}: {
  index: number;
  title: string;
  description: string;
  isLast: boolean;
}) {
  return (
    <View
      style={[
        styles.featRow,
        { borderTopWidth: 1, borderTopColor: HAIRLINE },
        isLast && { borderBottomWidth: 1, borderBottomColor: HAIRLINE },
      ]}
    >
      <View style={styles.featIcon}>
        <Text style={styles.featIconText}>{index}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.featTitle}>{title}</Text>
        <Text style={styles.featDesc}>{description}</Text>
      </View>
    </View>
  );
}

// ─── Slide 1: Welcome ─────────────────────────────────────────────────────────
function SlideWelcome() {
  return (
    <View style={styles.slideInner}>
      <Text style={styles.brandMark}>Sloth</Text>
      <View style={{ flex: 1 }} />
      <View style={{ alignItems: "center" }}>
        <DialFrame size={132} innerSize={56}>
          <SlothMark size={34} />
        </DialFrame>
        <Text style={styles.welcomeHeadline}>
          {"Your money.\nYour device.\nNobody else\u2019s."}
        </Text>
        <Text style={styles.welcomeBody}>
          No bank logins. No third-party servers reading your transactions.
          Everything lives here, encrypted, and never leaves this device.
        </Text>
      </View>
      <View style={{ flex: 1 }} />
    </View>
  );
}

// ─── Slide 2: Privacy explainer ───────────────────────────────────────────────
function SlidePrivacy() {
  return (
    <View style={styles.slideInner}>
      <Text style={styles.eyebrow}>How it works</Text>
      <Text style={styles.privacyHeadline}>
        Three ways Sloth keeps this yours.
      </Text>
      <View style={{ marginTop: 24 }}>
        {FEATURES.map((f, i) => (
          <FeatureRow
            key={f.title}
            index={f.index}
            title={f.title}
            description={f.description}
            isLast={i === FEATURES.length - 1}
          />
        ))}
      </View>
      <View style={{ flex: 1 }} />
    </View>
  );
}

// ─── Slide 3: Biometric setup ─────────────────────────────────────────────────
function SlideBiometric({ onComplete }: { onComplete: () => void }) {
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleEnableBiometrics = useCallback(async () => {
    setIsAuthenticating(true);
    try {
      const availability = await checkBiometricAvailability();
      if (!availability.available) {
        Alert.alert(
          "Biometrics unavailable",
          availability.reason === "no_hardware"
            ? "This device doesn\u2019t support Face ID or Touch ID. Use a PIN instead."
            : "No biometrics are enrolled. Set one up in system settings, or use a PIN instead.",
        );
        return;
      }
      const success = await authenticateWithBiometrics(
        "Confirm to enable Sloth lock",
      );
      if (!success) return;
      await storage.setBiometricEnabled(true);
      await storage.setOnboardingComplete(true);
      onComplete();
    } finally {
      setIsAuthenticating(false);
    }
  }, [onComplete]);

  return (
    <View style={styles.slideInner}>
      <Text style={styles.eyebrow}>Step 3 of 3</Text>
      <Text style={styles.biometricHeadline}>
        {"Lock Sloth to your\nface or fingerprint."}
      </Text>
      <Text style={styles.biometricBody}>
        This unlocks the app only \u2014 it&apos;s separate from your device
        passcode and never leaves your phone.
      </Text>
      <DialFrame size={150} innerSize={78} variant="brass">
        <FingerprintIcon size={30} />
      </DialFrame>
      <Text style={styles.biometricCaption}>Touch the sensor to continue</Text>
      <View style={{ flex: 1 }} />
      <View style={styles.biometricStack}>
        <BrassBtn
          label={isAuthenticating ? "Waiting\u2026" : "Enable Face / Touch ID"}
          onPress={handleEnableBiometrics}
        />
        <Pressable
          onPress={() => router.push("/onboarding/pin-setup")}
          style={{ alignItems: "center", paddingVertical: 4 }}
        >
          <Text style={styles.pinFallbackText}>Use a 6-digit PIN instead</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Per-slide animated wrapper ───────────────────────────────────────────────
// Separate component so useAnimatedStyle is called at component top level.
function AnimatedSlide({
  slideIndex,
  translateX,
  children,
}: {
  slideIndex: number;
  translateX: SharedValue<number>;
  children: React.ReactNode;
}) {
  const animStyle = useAnimatedStyle(() => {
    const offset = -translateX.value;
    const inputRange = [
      (slideIndex - 1) * SCREEN_WIDTH,
      slideIndex * SCREEN_WIDTH,
      (slideIndex + 1) * SCREEN_WIDTH,
    ];
    const opacity = interpolate(
      offset,
      inputRange,
      [0.45, 1, 0.45],
      Extrapolation.CLAMP,
    );
    const scale = interpolate(
      offset,
      inputRange,
      [0.95, 1, 0.95],
      Extrapolation.CLAMP,
    );
    return { opacity, transform: [{ scale }] };
  });

  return (
    <Animated.View style={[styles.slide, animStyle]}>{children}</Animated.View>
  );
}

// ─── Bottom bar with animated fade ────────────────────────────────────────────
function BottomBarCTA({
  visible,
  activeIndex,
  onDotPress,
  onContinue,
}: {
  visible: boolean;
  activeIndex: number;
  onDotPress: (i: number) => void;
  onContinue: () => void;
}) {
  const fadeStyle = useAnimatedStyle(() => ({
    opacity: withTiming(visible ? 1 : 0, { duration: 200 }),
    pointerEvents: visible ? "auto" : "none",
  }));

  return (
    <Animated.View style={[styles.bottomBar, fadeStyle]}>
      <StepDots activeIndex={activeIndex} onDotPress={onDotPress} />
      <BrassBtn label="Continue" onPress={onContinue} />
    </Animated.View>
  );
}

// ─── Root: Carousel host ──────────────────────────────────────────────────────
export default function OnboardingCarousel() {
  const translateX = useSharedValue(0);
  const dragX = useSharedValue(0);
  const activeIndexSV = useSharedValue(0);

  const [activeIndex, setActiveIndex] = useState(0);

  // Syncs UI-thread activeIndexSV back to JS-thread state after each swipe.
  // Called via runOnJS from the worklet — must be a stable reference.
  const syncActiveIndex = (idx: number) => {
    setActiveIndex(idx);
  };

  // Pan gesture reads shared values (translateX, dragX, activeIndexSV)
  // directly in worklets — no stale closure risk.
  const componentPan = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-15, 15])
    .onUpdate((e) => {
      "worklet";
      const idx = activeIndexSV.value;
      const baseX = -idx * SCREEN_WIDTH;
      const atStart = idx === 0 && e.translationX > 0;
      const atEnd = idx === TOTAL_SLIDES - 1 && e.translationX < 0;
      const resistance = atStart || atEnd ? 0.2 : 1;
      dragX.value = e.translationX * resistance;
      translateX.value = baseX + dragX.value;
    })
    .onEnd((e) => {
      "worklet";
      const velocity = e.velocityX;
      const translation = dragX.value;
      dragX.value = 0;
      const idx = activeIndexSV.value;
      let next = idx;
      if (translation < -SWIPE_THRESHOLD || velocity < -500)
        next = Math.min(idx + 1, TOTAL_SLIDES - 1);
      else if (translation > SWIPE_THRESHOLD || velocity > 500)
        next = Math.max(idx - 1, 0);

      const target = next !== idx ? next : idx;
      translateX.value = withSpring(-target * SCREEN_WIDTH, {
        damping: 28,
        stiffness: 280,
        mass: 0.8,
      });
      activeIndexSV.value = target;
      runOnJS(syncActiveIndex)(target);
    });

  const goTo = (index: number) => {
    const clamped = Math.max(0, Math.min(TOTAL_SLIDES - 1, index));
    translateX.value = withSpring(-clamped * SCREEN_WIDTH, {
      damping: 28,
      stiffness: 280,
      mass: 0.8,
    });
    activeIndexSV.value = clamped;
    setActiveIndex(clamped);
  };

  const trackStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const handleComplete = () => {
    router.replace("/(app)/dashboard");
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView
        edges={["top", "bottom"]}
        style={{ flex: 1, backgroundColor: colors.ink }}
      >
        <View style={{ flex: 1, overflow: "hidden" }}>
          <GestureDetector gesture={componentPan}>
            <Animated.View style={[styles.track, trackStyle]}>
              <AnimatedSlide slideIndex={0} translateX={translateX}>
                <SlideWelcome />
              </AnimatedSlide>

              <AnimatedSlide slideIndex={1} translateX={translateX}>
                <SlidePrivacy />
              </AnimatedSlide>

              <AnimatedSlide slideIndex={2} translateX={translateX}>
                <SlideBiometric onComplete={handleComplete} />
              </AnimatedSlide>
            </Animated.View>
          </GestureDetector>
        </View>

        <BottomBarCTA
          visible={activeIndex < 2}
          activeIndex={activeIndex}
          onDotPress={goTo}
          onContinue={() => goTo(activeIndex + 1)}
        />

        {activeIndex === 2 && (
          <View style={styles.bottomBarDotsOnly}>
            <StepDots activeIndex={activeIndex} onDotPress={goTo} />
          </View>
        )}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  track: {
    flexDirection: "row",
    width: SCREEN_WIDTH * TOTAL_SLIDES,
    flex: 1,
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
  },
  slideInner: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 12,
  },

  brandMark: {
    fontFamily: "IBMPlexMono_400",
    fontSize: 12,
    letterSpacing: 0.12 * 12,
    textTransform: "uppercase",
    color: colors.brass,
  },
  eyebrow: {
    fontFamily: "IBMPlexMono_400",
    fontSize: 11,
    letterSpacing: 0.1 * 11,
    textTransform: "uppercase",
    color: colors.parchmentDim,
    marginBottom: 34,
  },

  welcomeHeadline: {
    fontFamily: "Fraunces_450",
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: -0.3,
    color: colors.parchment,
    textAlign: "center",
    marginTop: 32,
    marginBottom: 14,
  },
  welcomeBody: {
    fontFamily: "Manrope_400",
    fontSize: 14,
    lineHeight: 21,
    color: colors.parchmentDim,
    textAlign: "center",
    paddingHorizontal: 8,
  },

  privacyHeadline: {
    fontFamily: "Fraunces_450",
    fontSize: 25,
    lineHeight: 31,
    color: colors.parchment,
  },
  featRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    paddingVertical: 16,
  },
  featIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "rgba(200,123,84,0.4)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  featIconText: {
    fontFamily: "IBMPlexMono_400",
    fontSize: 14,
    color: colors.brass,
  },
  featTitle: {
    fontFamily: "Manrope_700Bold",
    fontSize: 14,
    color: colors.parchment,
    marginBottom: 3,
  },
  featDesc: {
    fontFamily: "Manrope_400",
    fontSize: 12.5,
    lineHeight: 19,
    color: colors.parchmentDim,
  },

  biometricHeadline: {
    fontFamily: "Fraunces_450",
    fontSize: 26,
    lineHeight: 32,
    color: colors.parchment,
    marginTop: 10,
    marginBottom: 8,
  },
  biometricBody: {
    fontFamily: "Manrope_400",
    fontSize: 13.5,
    lineHeight: 21,
    color: colors.parchmentDim,
    marginBottom: 30,
  },
  biometricCaption: {
    fontFamily: "IBMPlexMono_400",
    fontSize: 12,
    letterSpacing: 0.72,
    textTransform: "uppercase",
    color: colors.brass,
    textAlign: "center",
    marginTop: 16,
  },
  biometricStack: {
    gap: 10,
    paddingBottom: 8,
  },
  pinFallbackText: {
    fontFamily: "Manrope_400",
    fontSize: 12.5,
    color: colors.parchmentDim,
    textDecorationLine: "underline",
    textDecorationColor: "rgba(167,159,140,0.4)",
    textAlign: "center",
  },

  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginBottom: 22,
    marginTop: 8,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 18,
    backgroundColor: colors.brass,
  },
  dotInactive: {
    width: 6,
    backgroundColor: "rgba(243,238,225,0.2)",
  },

  bottomBar: {
    paddingHorizontal: 22,
    paddingBottom: 16,
    paddingTop: 4,
  },
  bottomBarDotsOnly: {
    paddingHorizontal: 22,
    paddingBottom: 16,
    paddingTop: 4,
  },

  brassBtn: {
    backgroundColor: colors.brass,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  brassBtnLabel: {
    fontFamily: "Manrope_700Bold",
    fontSize: 15,
    letterSpacing: 0.15,
    color: colors.ink,
  },
});
