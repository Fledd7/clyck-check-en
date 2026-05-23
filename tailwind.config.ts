import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#161616",
        accent: "#CC001B",
        line: "#E5E5E5",
        bg: "#F5F5F5",
        gray1: "#6B6B6B",
        clyck: {
          primary: "#161616",
          accent: "#CC001B",
          light: "#ffffff",
          gray1: "#6B6B6B",
          gray2: "#E5E5E5",
          gray3: "#F5F5F5",
        },
      },
      fontFamily: {
        sans: ["Sora", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.08)",
      },
    },
  },
  plugins: [],
} satisfies Config;
