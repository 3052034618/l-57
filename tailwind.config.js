/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "24px",
    },
    extend: {
      colors: {
        forest: {
          50: "#F0F7F4",
          100: "#D8E8DE",
          200: "#B0D1BC",
          300: "#7FB394",
          400: "#40916C",
          500: "#2D6A4F",
          600: "#1B4332",
          700: "#14362A",
          800: "#0F2A20",
          900: "#0A1E17",
        },
        sand: {
          50: "#FEFAE0",
          100: "#FDF5C8",
          200: "#FAEC91",
          300: "#F4DE5A",
          400: "#EDCC33",
          500: "#D4B120",
        },
        clay: {
          50: "#FDF2EC",
          100: "#FAE0D0",
          200: "#F4BA96",
          300: "#F4A261",
          400: "#E76F51",
          500: "#C9563A",
        },
        slate: {
          50: "#F8FAFC",
          100: "#F1F5F9",
          200: "#E2E8F0",
          300: "#CBD5E1",
          400: "#94A3B8",
          500: "#64748B",
          600: "#475569",
          700: "#334155",
          800: "#264653",
          900: "#1E293B",
        },
      },
      fontFamily: {
        sans: ['"Noto Sans SC"', '"PingFang SC"', '"Microsoft YaHei"', "system-ui", "sans-serif"],
        serif: ['"Noto Serif SC"', '"Source Han Serif SC"', "Georgia", "serif"],
        mono: ['"JetBrains Mono"', '"Fira Code"', "Consolas", "monospace"],
      },
      boxShadow: {
        card: "0 2px 8px rgba(27, 67, 50, 0.08)",
        "card-hover": "0 8px 24px rgba(27, 67, 50, 0.12)",
      },
      borderRadius: {
        lg: "10px",
      },
      keyframes: {
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "count-up": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-dot": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up 0.4s ease-out both",
        "count-up": "count-up 0.6s ease-out both",
        "pulse-dot": "pulse-dot 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
