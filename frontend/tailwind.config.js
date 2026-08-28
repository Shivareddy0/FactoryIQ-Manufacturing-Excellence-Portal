/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          950: '#020617',
          900: '#0B0F19',
          800: '#0F172A',
          700: '#1E293B',
          600: '#334155',
        },
        precision: {
          cyan: '#06B6D4',
          cyanLight: '#22D3EE',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
