/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{html,ts}",
    "./*.html",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          teal: '#3ebc9e',
          amber: '#faa63b',
          coral: '#ef6658',
        },
      },
    },
  },
  plugins: [],
};
