import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          indigo: "#0B0F19",
          blue: "#2563EB",
          cyan: "#06B6D4",
          surface: "#FFFFFF",
          bg: "#F8FAFC",
          charcoal: "#0F172A",
        },
      },
    },
  },
  plugins: [],
};
export default config;
