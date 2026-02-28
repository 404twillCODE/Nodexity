import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: "#0a0a0a",
          secondary: "#111111",
        },
        accent: {
          DEFAULT: "#FF2B2B",
          hover: "#E62525",
        },
        text: {
          primary: "#ffffff",
          secondary: "#a0a0a0",
          muted: "#666666",
        },
        border: {
          DEFAULT: "#1a1a1a",
          hover: "#2a2a2a",
        },
        ark: {
          stone: "#8B8B8B",
          grass: "#7CB342",
          dirt: "#8B6F47",
          wood: "#8B4513",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
