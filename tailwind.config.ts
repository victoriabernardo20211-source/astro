import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Brand palette (Astro Fretes)
        brand: {
          DEFAULT: "#4A0E8F", // roxo escuro — primary
          mid: "#7B2FBE", // roxo médio — secondary
          lavender: "#E8D5FF", // lavanda — soft backgrounds
          tint: "#F3EBFF", // very soft purple tint
          wash: "#F8F5FF", // off-white wash
        },
        ink: "#1A1A2E", // texto principal
        muted: "#6B6480", // secondary text
        faint: "#9A8FB0", // tertiary text
        line: "#EDE6F7", // hairline borders
        field: "#E0D2F2", // input borders
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', "system-ui", "sans-serif"],
        display: ['"Sora"', '"Plus Jakarta Sans"', "sans-serif"],
      },
      boxShadow: {
        card: "0 6px 22px rgba(74,14,143,0.05)",
        panel: "0 12px 40px rgba(74,14,143,0.12)",
        float: "0 16px 44px rgba(74,14,143,0.16)",
      },
      keyframes: {
        nbpulse: {
          "0%,100%": { boxShadow: "0 0 0 0 rgba(123,47,190,0.45)" },
          "50%": { boxShadow: "0 0 0 6px rgba(123,47,190,0)" },
        },
      },
      animation: {
        nbpulse: "nbpulse 2s infinite",
      },
    },
  },
  plugins: [],
};

export default config;
