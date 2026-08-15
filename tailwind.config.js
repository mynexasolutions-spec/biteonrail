/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#f43f5e', // safe rail red accent
          600: '#e11d48',
          700: '#be123c',
        },
        railway: {
          blue: '#1e3a8a',
          yellow: '#facc15',
          light: '#f8fafc',
        }
      },
    },
  },
  plugins: [],
};
