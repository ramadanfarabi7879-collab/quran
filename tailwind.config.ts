import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        islamic: {
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          800: "#064e3b",
          900: "#043828",
          950: "#022117",
        },
        gold: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
          accent: "#d4af37",
        },
      },
      fontFamily: {
        amiri: ["var(--font-amiri)", "Amiri", "serif"],
        cairo: ["var(--font-cairo)", "Cairo", "sans-serif"],
        uthmanic: ["var(--font-uthmanic)", "'Traditional Arabic'", "'KFGQPC Uthman Taha Naskh'", "Amiri", "serif"],
      },
    },
  },
  plugins: [],
};
export default config;
