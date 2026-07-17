import { View, Text } from "react-native";
import { SlothAppIcon } from "@/components/SlothAppIcon";

export function SplashScreen() {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
      }}
      className="bg-surface-bg"
    >
      {/* Full-colour app icon — 112px, matches mockup Screen 00 exactly */}
      <View
        style={{
          marginBottom: 20,
          elevation: 16,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.35,
          shadowRadius: 24,
          borderRadius: 24,
        }}
      >
        <SlothAppIcon size={112} />
      </View>

      <Text
        style={{
          fontFamily: "Fraunces_450",
          fontSize: 26,
          letterSpacing: 0.26,
          marginBottom: 6,
        }}
        className="text-text-primary"
      >
        Sloth
      </Text>
      <Text
        style={{
          fontFamily: "IBMPlexMono_400",
          fontSize: 10.5,
          letterSpacing: 1.05,
          textTransform: "uppercase",
        }}
        className="text-text-secondary"
      >
        Private by default
      </Text>

      {/* Loading dots: dim · active(brass) · dim */}
      <View
        style={{
          position: "absolute",
          bottom: 64,
          flexDirection: "row",
          gap: 6,
        }}
      >
        <View
          style={{
            width: 5,
            height: 5,
            borderRadius: 3,
            backgroundColor: "rgba(200,123,84,0.35)",
          }}
        />
        <View
          style={{
            width: 5,
            height: 5,
            borderRadius: 3,
          }}
          className="bg-brass"
        />
        <View
          style={{
            width: 5,
            height: 5,
            borderRadius: 3,
            backgroundColor: "rgba(200,123,84,0.35)",
          }}
        />
      </View>
    </View>
  );
}
