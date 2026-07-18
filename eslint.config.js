// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");
const eslintPluginPrettierRecommended = require("eslint-plugin-prettier/recommended");
const unusedImports = require("eslint-plugin-unused-imports");
const { globals } = require("eslint-config-expo");

module.exports = defineConfig([
  expoConfig,
  eslintPluginPrettierRecommended,

  {
    plugins: {
      "unused-imports": unusedImports,
    },
    rules: {
      // Remove unused imports
      "unused-imports/no-unused-imports": "error",

      // Disable the default unused-vars rules
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "off",

      // Warn about unused variables
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],
    },
  },

  {
    files: ["babel.config.js"],
    languageOptions: {
      globals: globals.node,
    },
  },

  {
    ignores: ["dist/*", ".expo/*", "node_modules/*"],
  },
]);
