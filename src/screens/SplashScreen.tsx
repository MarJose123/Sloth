import { View, Text, StyleSheet } from "react-native";
import { SlothAppIcon } from "@/components/SlothAppIcon";
import { colors } from "@/theme/colors";

export function SplashScreen() {
  return (
    <View style={styles.root}>
      {/* Full-colour app icon — 112px, matches mockup Screen 00 exactly */}
      <View style={styles.iconWrapper}>
        <SlothAppIcon size={112} />
      </View>

      <Text style={styles.wordmark}>Sloth</Text>
      <Text style={styles.tagline}>Private by default</Text>

      {/* Loading dots: dim · active(brass) · dim — mockup: span:nth-child(2) is active */}
      <View style={styles.loadingRow}>
        <View style={[styles.dot, styles.dotDim]} />
        <View style={[styles.dot, styles.dotActive]} />
        <View style={[styles.dot, styles.dotDim]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.ink,
  },
  iconWrapper: {
    marginBottom: 20,
    // Android elevation gives a diffuse shadow under the icon
    elevation: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    // borderRadius must match the icon's rx (220/1024 * 112 ≈ 24) so elevation clips correctly
    borderRadius: 24,
  },
  wordmark: {
    fontFamily: "Fraunces_450",
    fontSize: 26,
    letterSpacing: 0.26,
    color: colors.parchment,
    marginBottom: 6,
  },
  tagline: {
    fontFamily: "IBMPlexMono_400",
    fontSize: 10.5,
    // 0.1em × 10.5px = 1.05
    letterSpacing: 1.05,
    textTransform: "uppercase",
    color: colors.parchmentDim,
  },
  loadingRow: {
    position: "absolute",
    bottom: 64,
    flexDirection: "row",
    gap: 6,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  dotDim: {
    backgroundColor: "rgba(200,123,84,0.35)",
  },
  dotActive: {
    backgroundColor: colors.brass,
  },
});
