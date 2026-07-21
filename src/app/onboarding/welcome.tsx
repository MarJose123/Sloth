/*
 * Copyright (C) 2026
 *
 * Owner: MarJose123 (https://github.com/MarJose123/sloth)
 * Project: Sloth
 * License: GPLv3 <https://choosealicense.com/licenses/gpl-3.0/>
 *
 * Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { useCallback, useMemo, useState } from "react";
import { View, Text, Dimensions, Pressable } from "react-native";
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
import { DialFrame } from "@/components/DialFrame";
import { SlothAppIcon } from "@/components/SlothAppIcon";
import { toast } from "@/hooks/useToast";
import { FingerprintIcon } from "@/components/ui/FingerprintIcon";
import {
  checkBiometricAvailability,
  authenticateWithBiometrics,
} from "@/lib/biometrics";
import { storage } from "@/lib/storage";
import { ColorPalette } from "@/theme/colors";
import { useColors } from "@/theme/ThemeContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const TOTAL_SLIDES = 3;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

// ─── Feature data ─────────────────────────────────────────────────────────────
const FEATURES = [
  {
    index: 1,
    title: "No bank credentials, ever",
    description:
      "Add transactions by hand, receipt scan, or CSV import \u2014 never by logging in through us.",
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
      "There\u2019s no server and no cloud. Back up manually to your own storage whenever you choose.",
  },
] as const;

// ─── Dynamic style factory ────────────────────────────────────────────────────

function createStyles(c: ColorPalette) {
  return {
    // ── Carousel track ──
    track: {
      flexDirection: "row" as const,
      width: SCREEN_WIDTH * TOTAL_SLIDES,
      flex: 1,
    },
    slide: {
      width: SCREEN_WIDTH,
      flex: 1,
    },
    // Matches mockup .screen: padding 56px 22px 28px
    // paddingTop handled by SafeAreaView edges=top; we add 12 for brand mark breathing room
    slideInner: {
      flex: 1,
      paddingHorizontal: 22,
      paddingTop: 12,
    },

    // ── Slide 1: Welcome ──
    brandMark: {
      fontFamily: "IBMPlexMono_400",
      fontSize: 15,
      letterSpacing: 1.44,
      textTransform: "uppercase" as const,
      color: c.brass,
    },
    welcomeIconWrapper: {
      alignSelf: "center" as const,
      marginTop: 8,
      marginBottom: 30,
      elevation: 14,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.35,
      shadowRadius: 24,
      borderRadius: 26,
    },
    welcomeHeadline: {
      fontFamily: "Fraunces_450",
      fontSize: 42,
      lineHeight: 42,
      letterSpacing: -0.3,
      color: c.textPrimary,
      textAlign: "center" as const,
      marginBottom: 14,
    },
    welcomeBody: {
      fontFamily: "Manrope_400",
      fontSize: 19,
      lineHeight: 26,
      color: c.textSecondary,
      textAlign: "center" as const,
      paddingHorizontal: 8,
    },

    // ── Slide 2: Privacy ──
    eyebrow: {
      fontFamily: "IBMPlexMono_400",
      fontSize: 14,
      letterSpacing: 1.1,
      textTransform: "uppercase" as const,
      color: c.textSecondary,
      marginBottom: 34,
    },
    privacyHeadline: {
      fontFamily: "Fraunces_450",
      fontSize: 33,
      lineHeight: 36,
      color: c.textPrimary,
      marginBottom: 26,
    },
    featRow: {
      flexDirection: "row" as const,
      alignItems: "flex-start" as const,
      gap: 14,
      paddingVertical: 16,
    },
    featIcon: {
      width: 34,
      height: 34,
      borderRadius: 17,
      borderWidth: 1,
      borderColor: "rgba(200,123,84,0.4)",
      alignItems: "center" as const,
      justifyContent: "center" as const,
      flexShrink: 0,
    },
    featIconText: {
      fontFamily: "IBMPlexMono_400",
      fontSize: 16,
      color: c.brass,
    },
    featTitle: {
      fontFamily: "Manrope_700Bold",
      fontSize: 17,
      color: c.textPrimary,
      marginBottom: 3,
    },
    featDesc: {
      fontFamily: "Manrope_400",
      fontSize: 15.5,
      lineHeight: 23,
      color: c.textSecondary,
    },

    // ── Slide 3: Biometric ──
    biometricHeadline: {
      fontFamily: "Fraunces_450",
      fontSize: 31,
      lineHeight: 37,
      color: c.textPrimary,
      marginTop: 10,
      marginBottom: 8,
    },
    biometricBody: {
      fontFamily: "Manrope_400",
      fontSize: 17,
      lineHeight: 25,
      color: c.textSecondary,
      marginBottom: 30,
    },
    biometricCaption: {
      fontFamily: "IBMPlexMono_400",
      fontSize: 15,
      letterSpacing: 0.72,
      textTransform: "uppercase" as const,
      color: c.brass,
      textAlign: "center" as const,
      marginTop: 14,
    },
    biometricStack: {
      gap: 2,
      paddingBottom: 3,
    },
    pinFallbackText: {
      fontFamily: "Manrope_400",
      fontSize: 15,
      color: c.textSecondary,
      textDecorationLine: "underline" as const,
      textDecorationColor: "rgba(167,159,140,0.4)",
      textAlign: "center" as const,
      marginTop: 4,
    },

    // ── Shared: dots ──
    dotsRow: {
      flexDirection: "row" as const,
      justifyContent: "center" as const,
      alignItems: "center" as const,
      gap: 6,
      marginTop: 22,
      marginBottom: 8,
    },
    dot: {
      height: 6,
      borderRadius: 3,
    },
    dotActive: {
      width: 18,
      backgroundColor: c.brass,
    },
    dotInactive: {
      width: 6,
      backgroundColor: c.hairline,
    },

    // ── Bottom bar ──
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

    // ── Brass button ──
    brassBtn: {
      backgroundColor: c.brass,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: "center" as const,
    },
    brassBtnLabel: {
      fontFamily: "Manrope_700Bold",
      fontSize: 18,
      letterSpacing: 0.15,
      color: c.ink,
    },
  };
}

type OnboardingStyles = ReturnType<typeof createStyles>;

// ─── Step dots ────────────────────────────────────────────────────────────────
function StepDots({
  activeIndex,
  onDotPress,
}: {
  activeIndex: number;
  onDotPress: (i: number) => void;
}) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

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
  const color = useColors();
  const styles = useMemo(() => createStyles(color), [color]);

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
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View
      style={[
        styles.featRow,
        { borderTopWidth: 1, borderTopColor: colors.hairline },
        isLast && { borderBottomWidth: 1, borderBottomColor: colors.hairline },
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
function SlideWelcome({ styles }: { styles: OnboardingStyles }) {
  return (
    <View style={styles.slideInner}>
      {/* "SLOTH" mono brand mark — top anchor */}
      <Text style={styles.brandMark}>Sloth</Text>

      <View className="items-center pt-safe-offset-10">
        {/* Full-colour app icon at 120px */}
        <View style={styles.welcomeIconWrapper}>
          <SlothAppIcon size={120} />
        </View>

        {/* Headline: font-size 30, line-height 1.18×30=35 */}
        <Text style={styles.welcomeHeadline}>
          {"Your money.\nYour device.\nNobody else\u2019s."}
        </Text>

        {/* Body: font-size 14, line-height 1.55×14=21.7 */}
        <Text style={styles.welcomeBody}>
          {
            "No bank logins. No third-party servers reading your transactions. Everything lives here, encrypted, and never leaves this device."
          }
        </Text>
      </View>

      {/* Single flex:1 — lets the bottom bar (dots + Continue) sit at the bottom */}
      <View style={{ flex: 1 }} />
    </View>
  );
}

// ─── Slide 2: Privacy explainer ───────────────────────────────────────────────
function SlidePrivacy({ styles }: { styles: OnboardingStyles }) {
  return (
    <View style={styles.slideInner}>
      {/* Eyebrow: "HOW IT WORKS" */}
      <Text style={styles.eyebrow}>How it works</Text>

      {/* Headline */}
      <Text style={styles.privacyHeadline}>
        Three ways Sloth keeps this yours.
      </Text>

      {/* Feature rows */}
      <View>
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
function SlideBiometric({
  styles,
  onComplete,
}: {
  styles: OnboardingStyles;
  onComplete: () => void;
}) {
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleEnableBiometrics = useCallback(async () => {
    setIsAuthenticating(true);
    try {
      const availability = await checkBiometricAvailability();
      if (!availability.available) {
        toast.error("Biometrics unavailable", {
          description:
            availability.reason === "no_hardware"
              ? "This device doesn\u2019t support Face ID or Touch ID. Use a PIN instead."
              : "No biometrics are enrolled. Set one up in system settings, or use a PIN instead.",
        });
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
      {/* ── top content: eyebrow + headline + body ── */}
      <Text style={styles.eyebrow}>Step 3 of 3</Text>

      <Text style={styles.biometricHeadline}>
        {"Lock Sloth to your\nface or fingerprint."}
      </Text>

      <Text style={styles.biometricBody}>
        {
          "This unlocks the app only \u2014 it\u2019s separate from your device passcode and never leaves your phone."
        }
      </Text>

      {/* ── flex spacer pushes the icon ring to vertical center ── */}
      <View style={{ flex: 1 }} />

      {/* ── centered icon ring ── */}
      <View className="items-center">
        <DialFrame size={150}>
          <FingerprintIcon size={90} />
        </DialFrame>
        <Text style={styles.biometricCaption}>
          Touch the sensor to continue
        </Text>
      </View>

      {/* ── flex spacer pushes the bottom buttons down ── */}
      <View style={{ flex: 1 }} />

      {/* ── bottom buttons ── */}
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
function AnimatedSlide({
  slideIndex,
  translateX,
  children,
}: {
  slideIndex: number;
  translateX: SharedValue<number>;
  children: React.ReactNode;
}) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

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

// ─── Bottom bar (dots + CTA) ──────────────────────────────────────────────────
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
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

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
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const translateX = useSharedValue(0);
  const dragX = useSharedValue(0);
  const activeIndexSV = useSharedValue(0);

  const [activeIndex, setActiveIndex] = useState(0);

  const syncActiveIndex = (idx: number) => {
    setActiveIndex(idx);
  };

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
      <View className="flex-1 pt-safe bg-surface-bg">
        <View style={{ flex: 1, overflow: "hidden" }}>
          <GestureDetector gesture={componentPan}>
            <Animated.View style={[styles.track, trackStyle]}>
              <AnimatedSlide slideIndex={0} translateX={translateX}>
                <SlideWelcome styles={styles} />
              </AnimatedSlide>

              <AnimatedSlide slideIndex={1} translateX={translateX}>
                <SlidePrivacy styles={styles} />
              </AnimatedSlide>

              <AnimatedSlide slideIndex={2} translateX={translateX}>
                <SlideBiometric styles={styles} onComplete={handleComplete} />
              </AnimatedSlide>
            </Animated.View>
          </GestureDetector>
        </View>

        {/* Dots + Continue — slides 0 and 1 only */}
        <BottomBarCTA
          visible={activeIndex < 2}
          activeIndex={activeIndex}
          onDotPress={goTo}
          onContinue={() => goTo(activeIndex + 1)}
        />

        {/* Biometric slide (index 2) has its own inline CTA — just show dots */}
        {activeIndex === 2 && (
          <View style={styles.bottomBarDotsOnly}>
            <StepDots activeIndex={activeIndex} onDotPress={goTo} />
          </View>
        )}
      </View>
    </GestureHandlerRootView>
  );
}
