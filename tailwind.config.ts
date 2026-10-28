import type { Config } from "tailwindcss";
import { invitation } from "./src/config/invitation";

const { palette } = invitation;

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        wine: { DEFAULT: palette.wine, soft: palette.wineSoft },
        blush: { DEFAULT: palette.blush, deep: palette.blushDeep },
        rose: { DEFAULT: palette.rose, deep: palette.roseDeep },
        gold: { DEFAULT: palette.gold, light: palette.goldLight, dark: palette.goldDark },
        ivory: palette.ivory,
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        script: ["var(--font-script)", "cursive"],
      },
    },
  },
  plugins: [],
};

export default config;
