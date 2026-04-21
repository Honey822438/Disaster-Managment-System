/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'emergency-dark': '#0a0a0f',
        'emergency-darker': '#111827',
        'emergency-card': '#1f2937',
      },
    },
  },
  plugins: [],
}
