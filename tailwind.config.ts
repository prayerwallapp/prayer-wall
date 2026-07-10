import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./emails/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // All values resolve to CSS custom properties defined in app/tokens.css.
      // Church-configurable tokens (brand, page, prayer/praise) are overridden
      // at runtime in app/layout.tsx from the churches row.
      colors: {
        page: "var(--color-bg-page)",
        card: "var(--color-bg-card)",
        primary: "var(--color-text-primary)",
        secondary: "var(--color-text-secondary)",
        muted: "var(--color-text-muted)",
        border: "var(--color-border-default)",
        brand: {
          DEFAULT: "var(--color-brand-primary)",
          on: "var(--color-brand-on-primary)",
        },
        prayer: {
          DEFAULT: "var(--color-semantic-prayer)",
          bg: "var(--color-semantic-prayer-bg)",
          text: "var(--color-semantic-prayer-text)",
        },
        praise: {
          DEFAULT: "var(--color-semantic-praise)",
          bg: "var(--color-semantic-praise-bg)",
          text: "var(--color-semantic-praise-text)",
        },
        danger: {
          DEFAULT: "var(--color-status-danger)",
          on: "var(--color-status-on-danger)",
          bg: "var(--color-status-danger-bg)",
          text: "var(--color-status-danger-text)",
        },
        success: {
          DEFAULT: "var(--color-status-success)",
          on: "var(--color-status-on-success)",
          bg: "var(--color-status-success-bg)",
          text: "var(--color-status-success-text)",
        },
        warning: {
          DEFAULT: "var(--color-status-warning)",
          on: "var(--color-status-on-warning)",
          bg: "var(--color-status-warning-bg)",
          text: "var(--color-status-warning-text)",
        },
      },
      spacing: {
        xs: "var(--spacing-xs)",
        sm: "var(--spacing-sm)",
        md: "var(--spacing-md)",
        lg: "var(--spacing-lg)",
        xl: "var(--spacing-xl)",
        "2xl": "var(--spacing-2xl)",
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        full: "var(--radius-full)",
      },
      boxShadow: {
        card: "var(--shadow-card)",
        modal: "var(--shadow-modal)",
      },
      fontSize: {
        display: ["var(--font-display-size)", { lineHeight: "var(--font-display-line)" }],
        h1: ["var(--font-h1-size)", { lineHeight: "var(--font-h1-line)" }],
        h2: ["var(--font-h2-size)", { lineHeight: "var(--font-h2-line)" }],
        body: ["var(--font-body-size)", { lineHeight: "normal" }],
        "body-sm": ["var(--font-body-small-size)", { lineHeight: "normal" }],
        caption: ["var(--font-caption-size)", { lineHeight: "normal" }],
        label: ["var(--font-label-size)", { lineHeight: "normal" }],
      },
      fontFamily: {
        display: ["var(--font-lexend)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
