import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Primary
        spick: {
          DEFAULT: "#2D9F83",
          dark: "#1A6B57",
          light: "#E8F5F0",
          border: "#C4E5D9",
          50: "#F0FAF6",
          100: "#D4F5E9",
          200: "#A8E5D2",
          300: "#6DD4B8",
          400: "#4CC9A8",
          500: "#2D9F83",
          600: "#247A65",
          700: "#1A6B57",
          800: "#155849",
          900: "#0F3D33",
        },
        // Job types
        job: {
          hem: "#2D9F83",
          flytt: "#E07B4C",
          stor: "#7B68D9",
          kontor: "#4C8FE0",
        },
        // Semantic
        accent: {
          orange: "#E07B4C",
          purple: "#7B68D9",
          blue: "#4C8FE0",
          gold: "#F5B731",
          red: "#D9534F",
          warn: "#C4952D",
        },
        // Neutrals (warm sand palette)
        sand: {
          50: "#FDFCFA",
          100: "#F7F5F0",
          200: "#F0EDE8",
          300: "#E0DBD2",
          400: "#D4CFC4",
          500: "#B0A898",
          600: "#8A8478",
          700: "#5A5248",
          800: "#2A2520",
          900: "#1A1714",
        },
      },
      fontFamily: {
        display: ["Fraunces", "Georgia", "serif"],
        sans: ["DM Sans", "system-ui", "sans-serif"],
        mono: ["DM Mono", "monospace"],
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }],   // 10px
        xs: ["0.6875rem", { lineHeight: "1rem" }],          // 11px
        sm: ["0.8125rem", { lineHeight: "1.25rem" }],       // 13px
        base: ["0.875rem", { lineHeight: "1.375rem" }],     // 14px
        md: ["0.9375rem", { lineHeight: "1.5rem" }],        // 15px
        lg: ["1.125rem", { lineHeight: "1.625rem" }],       // 18px
        xl: ["1.25rem", { lineHeight: "1.75rem" }],         // 20px
        "2xl": ["1.5rem", { lineHeight: "2rem" }],          // 24px
        "3xl": ["1.75rem", { lineHeight: "2.25rem" }],      // 28px
        "4xl": ["2rem", { lineHeight: "2.5rem" }],          // 32px
      },
      borderRadius: {
        "badge": "1.25rem",  // 20px - badges, chips
        "card": "1rem",      // 16px - cards
        "btn": "0.75rem",    // 12px - buttons
        "input": "0.75rem",  // 12px - inputs
        "tag": "0.875rem",   // 14px - tags
      },
      boxShadow: {
        "card": "0 1px 3px rgba(0, 0, 0, 0.03)",
        "card-hover": "0 4px 14px rgba(45, 159, 131, 0.15)",
        "btn-primary": "0 4px 12px rgba(45, 159, 131, 0.3)",
        "btn-primary-hover": "0 6px 18px rgba(45, 159, 131, 0.4)",
        "toast": "0 8px 24px rgba(0, 0, 0, 0.2)",
        "modal": "0 20px 60px rgba(0, 0, 0, 0.15)",
        "job-next": "0 8px 24px rgba(45, 159, 131, 0.25)",
      },
      animation: {
        "fade-up": "fadeUp 0.3s ease",
        "slide-down": "slideDown 0.2s ease",
        "toast-in": "toastIn 0.3s ease",
        "modal-in": "modalIn 0.25s ease",
        shimmer: "shimmer 1.5s infinite",
        spin: "spin 0.8s linear infinite",
      },
      keyframes: {
        fadeUp: {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        slideDown: {
          from: { opacity: "0", maxHeight: "0" },
          to: { opacity: "1", maxHeight: "800px" },
        },
        toastIn: {
          from: { opacity: "0", transform: "translate(-50%, 20px)" },
          to: { opacity: "1", transform: "translate(-50%, 0)" },
        },
        modalIn: {
          from: { opacity: "0", transform: "scale(0.95) translateY(10px)" },
          to: { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
      },
      spacing: {
        "safe-bottom": "env(safe-area-inset-bottom)",
      },
    },
  },
  plugins: [],
};

export default config;
