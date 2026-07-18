import { View } from "react-native";
import { useColors } from "@/theme/ThemeContext";

interface DialFrameProps {
  size?: number;
  children?: React.ReactNode;
}

export function DialFrame({ size = 150, children }: DialFrameProps) {
  const colors = useColors();

  return (
    <View
      className="items-center justify-center rounded-full border"
      style={{
        width: size,
        height: size,
        borderColor: `${colors.brass}55`,
        backgroundColor: `${colors.brass}1a`,
      }}
    >
      {children}
    </View>
  );
}
