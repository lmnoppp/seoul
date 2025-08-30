import type { Config } from 'tailwindcss'

export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        rose100: '#FFF5FB',
        rose200: '#FFEAF6',
        rose300: '#FFC6E9',
        rose500: '#FF61C7',
        rose700: '#D63A9F',
        bluePastel: '#BDE3FF',
        choco: '#3B2B2F',
      },
    },
  },
  plugins: [],
} satisfies Config


