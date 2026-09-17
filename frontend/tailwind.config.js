/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        metro: {
          light: '#38bdf8',
          DEFAULT: '#0284c7',
          dark: '#0369a1'
        },
        water: {
          light: '#38bdf8',
          DEFAULT: '#0284c7',
          dark: '#075985'
        },
        bus: {
          light: '#fb923c',
          DEFAULT: '#ea580c',
          dark: '#c2410c'
        }
      }
    },
  },
  plugins: [],
}
