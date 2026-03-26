/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#1a1a1a',
        'bg-secondary': '#2a2a2a',
        'accent': '#d97706',
        'text-primary': '#e5e5e5',
        'text-secondary': '#737373',
        'border-color': '#404040',
      }
    },
  },
  plugins: [],
}