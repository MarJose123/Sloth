/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,jsx,ts,tsx}",
    "./src/components/**/*.{js,jsx,ts,tsx}",
    "./src/screens/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        ink: "#1B1F1A",
        "ink-2": "#242920",
        "ink-3": "#2E3428",
        parchment: "#F3EEE1",
        "parchment-dim": "#A79F8C",
        brass: "#C87B54",
        "brass-soft": "#8F5636",
        sage: "#7FA06B",
        rust: "#9C4A3D",
        "dusty-blue": "#6E8FB0",
        ochre: "#C9A227",
      },
      fontFamily: {
        serif: ["Fraunces_500Medium"],
        "serif-light": ["Fraunces_400Regular"],
        "serif-semibold": ["Fraunces_600SemiBold"],
        sans: ["Manrope_400Regular"],
        "sans-medium": ["Manrope_500Medium"],
        "sans-semibold": ["Manrope_600SemiBold"],
        "sans-bold": ["Manrope_700Bold"],
        mono: ["IBMPlexMono_400Regular"],
        "mono-medium": ["IBMPlexMono_500Medium"],
      },
    },
  },
  plugins: [],
};
