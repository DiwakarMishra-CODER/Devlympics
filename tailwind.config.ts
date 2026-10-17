import type { Config } from "tailwindcss";

/**
 * Saathi design tokens.
 * Palette is intentionally restrained: warm ivory paper, deep forest green as
 * the trust/primary colour, saffron as the single accent, pale sage for
 * surfaces, and a muted alert red. No gradients, no neon.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ivory: {
          DEFAULT: "#F7F5EF",
          50: "#FBFAF6",
          100: "#F7F5EF",
          200: "#EFEBE0",
        },
        forest: {
          50: "#EAF1EE",
          100: "#D3E2DB",
          200: "#A7C5B8",
          300: "#7BA795",
          400: "#4F8A72",
          500: "#23604E",
          600: "#1E5142",
          DEFAULT: "#173F32",
          700: "#173F32",
          800: "#123029",
          900: "#0E2620",
        },
        saffron: {
          50: "#FBF3E2",
          100: "#F6E6C6",
          300: "#E7C77E",
          500: "#D9A441",
          DEFAULT: "#D9A441",
          600: "#C08D2E",
          700: "#A2741F",
        },
        sage: {
          50: "#F1F6F2",
          100: "#E7F0E9",
          200: "#DCE8DF",
          DEFAULT: "#DCE8DF",
          400: "#B4CFBC",
          700: "#7C9E88",
        },
        alert: {
          50: "#FBEAE8",
          100: "#F5D3CF",
          500: "#C53E36",
          DEFAULT: "#C53E36",
          600: "#AC322B",
          700: "#8F2823",
        },
        ink: {
          DEFAULT: "#202720",
          soft: "#3B443B",
        },
        muted: "#5C635B",
        line: "#E5E1D6",
      },
      fontFamily: {
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-body)", "serif"],
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(23, 63, 50, 0.05), 0 10px 28px -16px rgba(23, 63, 50, 0.22)",
        lift: "0 2px 4px rgba(23, 63, 50, 0.06), 0 20px 44px -22px rgba(23, 63, 50, 0.30)",
        phone: "0 30px 70px -24px rgba(14, 38, 32, 0.55)",
      },
      letterSpacing: {
        tightish: "-0.01em",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.9)", opacity: "0.7" },
          "70%": { transform: "scale(1.25)", opacity: "0" },
          "100%": { transform: "scale(1.25)", opacity: "0" },
        },
        "row-flash": {
          "0%": { backgroundColor: "rgba(217, 164, 65, 0.40)" },
          "60%": { backgroundColor: "rgba(217, 164, 65, 0.18)" },
          "100%": { backgroundColor: "rgba(217, 164, 65, 0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.35s ease-out both",
        "pulse-ring": "pulse-ring 1.8s cubic-bezier(0.2, 0.6, 0.4, 1) infinite",
        "row-flash": "row-flash 2s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
