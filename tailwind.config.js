/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'verde-escuro': '#1a472a',
        'verde-claro': '#2d5016',
        'marrom': '#8B4513',
      },
    },
  },
  plugins: [],
}
