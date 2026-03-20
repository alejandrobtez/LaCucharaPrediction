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
        'dry-sage': '#ccd5ae',
        'beige': '#e9edc9',
        'cornsilk': '#fefae0',
        'papaya-whip': '#faedcd',
        'light-bronze': '#d4a373',
        'bronze-dark': '#bc8a5f',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['DM Serif Display', 'serif'],
      },
    },
  },
  plugins: [],
};
export default config;
