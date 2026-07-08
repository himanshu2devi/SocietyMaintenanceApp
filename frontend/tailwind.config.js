/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff',
          100: '#d9e5ff',
          500: '#3b6ef5',
          600: '#2f57d6',
          700: '#2544ad',
        },
      },
    },
  },
  plugins: [],
}
