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
import { DialFrame } from "@/components/DialFrame";
import { SlothAppIcon } from "@/components/SlothAppIcon";
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
// FIX: No double flex:1 spacers. Content flows top-down, pinned to top.
// Brand mark at top → icon immediately below (marginTop:8, marginBottom:30) →
// headline → body → flex:1 pushes remainder to bottom bar.
function SlideWelcome() {
  return (
    <View style={styles.slideInner}>
      {/* "SLOTH" mono brand mark — top anchor */}
      <Text style={styles.brandMark}>Sloth</Text>

      {/* Full-colour app icon at 120px — no DialFrame ring on this slide */}
      <View style={styles.welcomeIconWrapper}>
        <SlothAppIcon size={120} />
      </View>

      {/* Headline: font-size 30, line-height 1.18×30=35, marginBottom 14 */}
      <Text style={styles.welcomeHeadline}>
        {"Your money.\nYour device.\nNobody else\u2019s."}
      </Text>

      {/* Body: font-size 14, line-height 1.55×14=21.7 */}
      <Text style={styles.welcomeBody}>
        No bank logins. No third-party servers reading your transactions.
        Everything lives here, encrypted, and never leaves this device.
      </Text>

      {/* Single flex:1 — lets the bottom bar (dots + Continue) sit at the bottom */}
      <View style={{ flex: 1 }} />
    </View>
  );
}

// ─── Slide 2: Privacy explainer ───────────────────────────────────────────────
// FIX: marginBottom:26 moves onto privacyHeadline itself; remove extra wrapper marginTop:24
function SlidePrivacy() {
  return (
    <View style={styles.slideInner}>
      {/* Eyebrow: "HOW IT WORKS" — parchment-dim, marginBottom:34 */}
      <Text style={styles.eyebrow}>How it works</Text>

      {/* Headline: marginBottom:26 per mockup (.s2 h2 margin:0 0 26px) */}
      <Text style={styles.privacyHeadline}>
        Three ways Sloth keeps this yours.
      </Text>

      {/* Feature rows — no extra top margin, hairlines provide visual gap */}
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
// FIX: unicode dashes/apostrophes as actual chars, not escape sequences in JSX text
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

      {/* FIX: actual em-dash and right-single-quote chars, not \u escape in JSX text */}
      <Text style={styles.biometricBody}>
        {
          "This unlocks the app only \u2014 it\u2019s separate from your device passcode and never leaves your phone."
        }
      </Text>

      {/* DialFrame with variant="brass" — ring only appears on biometric slide */}
      <DialFrame size={150} innerSize={78} variant="brass">
        <FingerprintIcon size={30} />
      </DialFrame>

      {/* Caption: margin:14px 0 auto in mockup → marginTop:14, flex:1 below pushes stack down */}
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
      <View className="flex-1 bg-ink pt-safe">
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

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // ── Carousel track ──
  track: {
    flexDirection: "row",
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
    fontSize: 13,
    // 0.12em × 12px = 1.44
    letterSpacing: 1.44,
    textTransform: "uppercase",
    color: colors.brass,
    // No marginBottom — icon sits 8px below via welcomeIconWrapper marginTop
  },
  welcomeIconWrapper: {
    alignSelf: "center",
    // Mockup .s1 .dial: margin:8px auto 30px
    marginTop: 8,
    marginBottom: 30,
    // Shadow — elevation is Android-only; shadow* props are iOS-only
    elevation: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    // borderRadius must match icon rx so elevation shadow clips correctly
    // icon rx = 220/1024 × 120 ≈ 26
    borderRadius: 26,
  },
  welcomeHeadline: {
    fontFamily: "Fraunces_450",
    fontSize: 32,
    // line-height: 1.18 × 30 = 35.4
    lineHeight: 38,
    letterSpacing: -0.3,
    color: colors.parchment,
    textAlign: "center",
    // Mockup .s1 h2: margin:0 0 14px — NO top margin (was 32 before, causing excess space)
    marginBottom: 14,
  },
  welcomeBody: {
    fontFamily: "Manrope_400",
    fontSize: 15.5,
    // line-height: 1.55 × 14 = 21.7
    lineHeight: 24,
    color: colors.parchmentDim,
    textAlign: "center",
    // Mockup .s1 p.sub: padding:0 8px
    paddingHorizontal: 8,
  },

  // ── Slide 2: Privacy ──
  eyebrow: {
    fontFamily: "IBMPlexMono_400",
    fontSize: 12.5,
    // 0.1em × 11 = 1.1
    letterSpacing: 1.1,
    textTransform: "uppercase",
    color: colors.parchmentDim,
    // Mockup .s2 .top-mark: margin-bottom:34px
    marginBottom: 34,
  },
  privacyHeadline: {
    fontFamily: "Fraunces_450",
    fontSize: 27,
    // line-height: 1.25 × 25 = 31.25
    lineHeight: 33,
    color: colors.parchment,
    // Mockup .s2 h2: margin:0 0 26px — bottom gap before feature rows
    marginBottom: 26,
  },
  featRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    // Mockup .feat-row: padding:16px 0
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
    fontSize: 15,
    color: colors.brass,
  },
  featTitle: {
    fontFamily: "Manrope_700Bold",
    fontSize: 15.5,
    color: colors.parchment,
    marginBottom: 3,
  },
  featDesc: {
    fontFamily: "Manrope_400",
    fontSize: 14,
    // line-height: 1.5 × 12.5 = 18.75
    lineHeight: 21,
    color: colors.parchmentDim,
  },

  // ── Slide 3: Biometric ──
  biometricHeadline: {
    fontFamily: "Fraunces_450",
    fontSize: 28,
    lineHeight: 34,
    color: colors.parchment,
    // Mockup .s3 h2: margin:10px 0 8px
    marginTop: 10,
    marginBottom: 8,
  },
  biometricBody: {
    fontFamily: "Manrope_400",
    fontSize: 15,
    // line-height: 1.55 × 13.5 = 20.9
    lineHeight: 23,
    color: colors.parchmentDim,
    // Mockup .s3 p.sub: margin:0 0 30px
    marginBottom: 30,
  },
  biometricCaption: {
    fontFamily: "IBMPlexMono_400",
    fontSize: 13.5,
    // 0.06em × 12 = 0.72
    letterSpacing: 0.72,
    textTransform: "uppercase",
    color: colors.brass,
    textAlign: "center",
    // Mockup .s3 .caption: margin:14px 0 auto → marginTop:14, flex:1 below handles "auto"
    marginTop: 14,
  },
  biometricStack: {
    gap: 10,
    paddingBottom: 8,
  },
  pinFallbackText: {
    fontFamily: "Manrope_400",
    fontSize: 14,
    color: colors.parchmentDim,
    textDecorationLine: "underline",
    textDecorationColor: "rgba(167,159,140,0.4)",
    textAlign: "center",
    // Mockup .pin-fallback: margin-top:4px
    marginTop: 4,
  },

  // ── Shared: dots ──
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    // Mockup .dots: margin:22px 0 8px
    marginTop: 22,
    marginBottom: 8,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    // Mockup .dots span.on: width:18px, background:brass, border-radius:3px
    width: 18,
    backgroundColor: colors.brass,
  },
  dotInactive: {
    // Mockup .dots span: width:6px, background:rgba(237,233,224,0.2)
    width: 6,
    backgroundColor: "rgba(243,238,225,0.2)",
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
    backgroundColor: colors.brass,
    // Mockup .brass-btn: border-radius:14px, padding:16px
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  brassBtnLabel: {
    fontFamily: "Manrope_700Bold",
    fontSize: 16.5,
    letterSpacing: 0.15,
    color: colors.ink,
  },
});
