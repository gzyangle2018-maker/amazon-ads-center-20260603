/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          dark: '#070b13',
          base: '#09111f',
          card: 'rgba(255,255,255,0.055)',
          hover: 'rgba(255,255,255,0.08)',
        },
        accent: {
          cyan: '#5be7ff',
          purple: '#7c5cff',
          blue: '#3b82f6',
          green: '#44ffaa',
          yellow: '#ffc947',
          red: '#ff6363',
          orange: '#ff8c42',
        },
        text: {
          primary: '#e8eefc',
          secondary: '#93a3bb',
          muted: '#6b7d95',
        },
      },
      fontFamily: {
        sans: ['Inter', '"PingFang SC"', '"Microsoft YaHei"', 'Arial', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
    },
  },
  plugins: [],
};
