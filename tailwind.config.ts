import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#2F6B4F",
          deep: "#214B39",
          soft: "#EAF3ED",
          surface: "#FFFFFF",
          bg: "#F6F8F6",
          text: "#202923",
          muted: "#66716A",
          border: "#E0E6E1",
          error: "#B91C1C",
          "error-soft": "#FEE2E2",
          warning: "#B45309",
          "warning-soft": "#FEF3C7",
          success: "#166534",
          "success-soft": "#DCFCE7",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "-apple-system", "sans-serif"],
      },
      boxShadow: {
        subtle: "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)",
        card: "0 4px 6px -1px rgba(0, 0, 0, 0.04), 0 2px 4px -2px rgba(0, 0, 0, 0.03)",
        elevated: "0 10px 15px -3px rgba(0, 0, 0, 0.06), 0 4px 6px -4px rgba(0, 0, 0, 0.04)",
      },
    },
  },
  plugins: [],
};

export default config;
