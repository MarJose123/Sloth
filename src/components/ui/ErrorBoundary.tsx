import { Component } from "react";
import { Pressable, Text, View } from "react-native";

interface Props {
  children: React.ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  errorMessage: string | null;
}

/**
 * Minimal error boundary for tab screens — catches rendering crashes so
 * one broken widget doesn't blank the entire screen. Shows a styled
 * fallback with a "Try again" button that resets the boundary.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message };
  }

  handleReset = () => {
    this.setState({ hasError: false, errorMessage: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View className="flex-1 items-center justify-center bg-ink px-8 pt-safe">
          <Text className="mb-2 text-center font-fraunces-medium text-xl text-parchment">
            Something went wrong
          </Text>
          <Text className="mb-8 text-center text-[13px] leading-[19px] text-parchment-dim">
            {this.state.errorMessage ??
              this.props.fallbackMessage ??
              "An unexpected error occurred while loading this screen."}
          </Text>
          <Pressable
            onPress={this.handleReset}
            className="rounded-2xl bg-brass px-5 py-3.5 active:opacity-80"
          >
            <Text className="font-manrope-bold text-[14px] text-ink">
              Try again
            </Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}
