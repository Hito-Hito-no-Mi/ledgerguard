import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#09090B",
        surface: "#111113",
        card: "#111113",
        "card-hover": "#17171C",
        sidebar: "#0C0C0E",
        border: "#27272A",
        "border-subtle": "#1E1E22",
        "border-glow": "#3F3F46",
        crimson: {
          500: "#EF4444",
          600: "#DC2626",
          700: "#B91C1C",
          900: "#450A0A",
          950: "#2B0606",
        },
        emerald: {
          400: "#34D399",
          500: "#10B981",
          600: "#059669",
          950: "#022C1A",
        },
        accent: {
          500: "#6366F1",
          600: "#4F46E5",
        }
      },
      fontFamily: {
        mono: [
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      boxShadow: {
        glow: "0 0 20px -5px rgba(99, 102, 241, 0.2)",
        "glow-crimson": "0 0 25px -5px rgba(220, 38, 38, 0.35)",
        "glow-emerald": "0 0 25px -5px rgba(16, 185, 129, 0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
