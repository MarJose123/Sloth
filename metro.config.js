const { getDefaultConfig } = require("expo/metro-config");
const { withNativewind } = require("nativewind/metro");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

module.exports = withNativewind(config, {
  // Preserve CSS var() references at runtime so VariableContextProvider
  // can dynamically override theme colors (light/dark switching).
  // Default is true, which inlines variables at compile time.
  inlineVariables: false,
});
