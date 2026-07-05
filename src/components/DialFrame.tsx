import { View } from "react-native";

interface DialFrameProps {
  size?: number;
  innerSize?: number;
  children: React.ReactNode;
}

/** The soft ring used as the biometric frame and progress indicator throughout the app. */
export function DialFrame({
  size = 132,
  innerSize = 56,
  children,
}: DialFrameProps) {
  return (
    <View
      style={{ width: size, height: size, borderRadius: size / 2 }}
      className="items-center justify-center self-center border border-brass/30 bg-brass/10"
    >
      <View
        style={{
          width: innerSize,
          height: innerSize,
          borderRadius: innerSize / 2,
        }}
        className="items-center justify-center border border-brass/50"
      >
        {children}
      </View>
    </View>
  );
}
