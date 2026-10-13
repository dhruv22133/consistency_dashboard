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
        stone: {
          bg: "#dedede",        // Light warm minimal stone grey canvas
          surface: "#cdcdcd",   // Noticeably darker grey for cards/boxes to differentiate
          card: "#cecece",      // Darker grey box background
          inner: "#bfbfbf",     // Nested sub-box background
          border: "#b0b0b0",    // Defined border grey
          hover: "#c4c4c4",     // Hover state for boxes
          darkText: "#121212",  // High contrast crisp dark text
          mutedText: "#555555", // Muted subtext
        },
        missed: {
          red: "#dc2626",
          "red-glow": "rgba(220, 38, 38, 0.3)",
        }
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      boxShadow: {
        "stone-card": "0 2px 10px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04)",
        "pill-white": "0 2px 4px rgba(0, 0, 0, 0.1)",
        "red-glow": "0 0 10px rgba(220, 38, 38, 0.4)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      }
    },
  },
  plugins: [],
};

export default config;
