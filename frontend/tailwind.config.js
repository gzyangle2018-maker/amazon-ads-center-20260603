/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        amazon: {
          50: '#FFF8F0',
          100: '#FFE8CC',
          200: '#FFD099',
          300: '#FFB866',
          400: '#FFA033',
          500: '#FF9900',
          600: '#CC7A00',
          700: '#995C00',
          800: '#663D00',
          900: '#331F00',
        },
      },
    },
  },
  plugins: [],
}
