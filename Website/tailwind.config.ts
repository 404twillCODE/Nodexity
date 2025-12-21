import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#0B0E14",
        foreground: "#FFFFFF",
        muted: "#9CA3AF",
        accent: "#8B5CF6",
      },
    },
  },
  plugins: [],
};
export default config;

