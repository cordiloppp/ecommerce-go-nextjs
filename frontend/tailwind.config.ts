import type { Config } from "tailwindcss";

// Direction: a well-lit desk. Cool ink neutrals, matte devices, one electric
// yellow accent taken from the name. "brand" is the ink used for primary
// actions; "volt" is the accent, used rarely.
const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        gray: {
          50: "#f5f7fa",
          100: "#eceff4",
          200: "#e3e7ee",
          300: "#d0d6df",
          400: "#9aa2b1",
          500: "#6b7487",
          600: "#4b5565",
          700: "#374151",
          800: "#1f2937",
          900: "#111827",
        },
        brand: {
          DEFAULT: "#111827",
          dark: "#2a3242",
        },
        volt: "#f2c230",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      borderColor: {
        DEFAULT: "rgba(17, 24, 39, 0.08)",
      },
      transitionTimingFunction: {
        out: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
