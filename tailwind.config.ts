import type { Config } from "tailwindcss";
import { nextui } from "@nextui-org/react";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "let(--background)",
        foreground: "let(--foreground)",
        "user-light": "#0072F5",
        "user-dark": "#1E88E5",
        "ai-light": "#F1F5F9",
        "ai-dark": "#333333",
      },
    },
  },
  darkMode: "class",
  plugins: [nextui()],
} satisfies Config;
