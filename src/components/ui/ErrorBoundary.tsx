import { Component, useState, type ReactNode } from "react";
import { View, Text, Pressable } from "react-native";
import { SlothAppIcon } from "@/components/SlothAppIcon";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: { componentStack?: string }) {
    console.error("[ErrorBoundary]", error, errorInfo.componentStack);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return <ErrorFallback error={this.state.error} onReset={this.handleReset} />;
  }
}

// ─── Fallback UI ─────────────────────────────────────────────────────

function ErrorFallback({
  error,
  onReset,
}: {
  error: Error | null;
  onReset: () => void;
}) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <View className="flex-1 items-center justify-center bg-surface-bg px-6">
      <SlothAppIcon size={96} />

      <Text className="mt-6 text-center font-fraunces-medium text-[26px] text-text-primary leading-snug">
        Something went{"\n"}wrong
      </Text>

      <Text className="mt-3 max-w-[300px] text-center text-[14px] font-manrope text-text-secondary leading-relaxed">
        Sloth ran into an unexpected issue. Don't worry — your data is safe
        and encrypted on your device.
      </Text>

      <Pressable
        onPress={onReset}
        className="mt-8 rounded-[14px] bg-brass px-8 py-3 active:opacity-80"
      >
        <Text className="font-manrope-bold text-[15px] text-ink">
          Try Again
        </Text>
      </Pressable>

      <Pressable
        onPress={() => setShowDetails((v) => !v)}
        className="mt-6"
        hitSlop={12}
      >
        <Text className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-text-secondary">
          {showDetails ? "Hide details" : "Error details"}
        </Text>
      </Pressable>

      {showDetails && error !== null && (
        <View className="mt-3 w-full max-w-[320px] rounded-[14px] bg-surface-elevated p-4">
          <Text className="font-mono text-[11px] text-rust leading-relaxed">
            {error.name}: {error.message}
          </Text>
        </View>
      )}
    </View>
  );
}
