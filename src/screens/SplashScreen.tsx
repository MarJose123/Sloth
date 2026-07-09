import { View, Text, StyleSheet } from "react-native";
import { SlothAppIcon } from "@/components/SlothAppIcon";
import { colors } from "@/theme/colors";

export function SplashScreen() {
  return (
    <View style={styles.root}>
      {/* Icon with drop-shadow approximated via shadowColor on a wrapper */}
      <View style={styles.iconWrapper}>
        <SlothAppIcon size={112} />
      </View>

      <Text style={styles.wordmark}>Sloth</Text>
      <Text style={styles.tagline}>Private by default</Text>

      {/* Loading dots: dim · active · dim */}
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
    // Soft drop-shadow (Android elevation + iOS shadow)
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 16,
    borderRadius: 112 * 0.215, // match icon corner radius so shadow clips correctly
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
    letterSpacing: 10.5 * 0.1,
    textTransform: "uppercase",
    color: colors.parchmentDim,
  },
  loadingRow: {
    position: "absolute",
    bottom: 64,
    flexDirection: "row",
    gap: 6,
    alignSelf: "center",
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
