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
        'sky-bg': '#EAF6FF',
        'cloud-white': '#FFFFFF',
        'light-azure': '#B3E5FC',
        'soft-blue': '#90CAF9',
        'charcoal': '#1A1A1A',
        'muted-blue': '#4A6572',
        'sky-cta': '#42A5F5',
        'sky-cta-hover': '#1E88E5',
        'link-blue': '#0288D1',
        'border-blue': '#D0E7FF'
      },
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
        'poppins': ['Poppins', 'sans-serif'],
        'readex': ['Readex Pro', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;

