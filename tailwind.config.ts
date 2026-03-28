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
        background: "#0a0a0f",
        surface: "#13131a",
        "surface-2": "#1c1c26",
        "surface-3": "#252532",
        border: "#2a2a3a",
        "text-primary": "#f0f0f5",
        "text-secondary": "#8888aa",
        "text-muted": "#555570",
        accent: "#7c3aed",
        "accent-light": "#8b5cf6",
        "accent-hover": "#6d28d9",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Text",
          "Segoe UI",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
