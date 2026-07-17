import { useColorScheme, View } from "react-native";

interface DialFrameProps {
  size?: number;
  innerSize?: number;
  children: React.ReactNode;
  variant?: "default" | "brass";
}

/**
 * Soft ring used as the biometric frame and category progress indicator.
 * Only appears on screens that need the ring motif (biometric/lock).
 * Splash and Onboarding-welcome use SlothAppIcon directly — no ring.
 */
export function DialFrame({
  size = 120,
  innerSize = 50,
  children,
  variant = "default",
}: DialFrameProps) {

  const isLight = useColorScheme() === "light";
  const outerStyle =
    variant === "brass"
      ? {
          borderColor: isLight
            ? "rgba(200,123,84,0.7)"
            : "rgba(200,123,84,0.55)",
          backgroundColor: isLight
            ? "rgba(200,123,84,0.15)"
            : "rgba(200,123,84,0.1)",
        }
      : {
          backgroundColor: "transparent",
        };

  // Mockup .s3 .dial-inner:
  //   background: radial-gradient(circle at 35% 30%, rgba(200,123,84,0.25), transparent 60%)
  //   border: 1px solid rgba(200,123,84,0.6)
  // React Native doesn't support CSS gradients on View — use a solid approximation:
  // rgba(200,123,84,0.12) is the visual midpoint of the 25%-opacity gradient.
  const innerStyle =
    variant === "brass"
      ? {
          borderWidth: 1,
          borderColor: isLight
            ? "rgba(200,123,84,0.75)"
            : "rgba(200,123,84,0.6)",
          backgroundColor: isLight
            ? "rgba(200,123,84,0.18)"
            : "rgba(200,123,84,0.12)",
        }
      : {
          borderWidth: 0,
        };

  return (
    <View
      className={variant !== "brass" ? "border-hairline" : ""}
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 1,
          alignItems: "center",
          justifyContent: "center",
          alignSelf: "center",
        },
        outerStyle,
      ]}
    >
      <View
        className={variant !== "brass" ? "bg-surface-card" : ""}
        style={[
          {
            width: innerSize,
            height: innerSize,
            borderRadius: innerSize / 2,
            alignItems: "center",
            justifyContent: "center",
          },
          innerStyle,
        ]}
      >
        {children}
      </View>
    </View>
  );
}
