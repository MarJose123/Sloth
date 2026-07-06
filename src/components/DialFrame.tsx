import { View } from "react-native";

interface DialFrameProps {
  size?: number;
  innerSize?: number;
  children: React.ReactNode;
  variant?: "default" | "brass";
}

/** The soft ring used as the biometric frame and progress indicator throughout the app. */
export function DialFrame({
  size = 120,
  innerSize = 50,
  children,
  variant = "default",
}: DialFrameProps) {
  const outerClasses =
    variant === "brass"
      ? "border-brass/30 bg-brass/10"
      : "border-white/10 bg-transparent";

  const innerClasses =
    variant === "brass" ? "border-brass/50 bg-transparent" : "bg-ink-2";

  return (
    <View
      style={{ width: size, height: size, borderRadius: size / 2 }}
      className={`items-center justify-center self-center border ${outerClasses}`}
    >
      <View
        style={{
          width: innerSize,
          height: innerSize,
          borderRadius: innerSize / 2,
        }}
        className={`items-center justify-center ${innerClasses}`}
      >
        {children}
      </View>
    </View>
  );
}
