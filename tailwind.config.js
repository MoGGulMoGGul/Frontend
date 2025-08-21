/** @type {import('tailwindcss').Config} */
module.exports = {
  experimental: {
    cssVariables: true,
  },
  content: ["./src/**/*.{js,ts,jsx,tsx}", "./app/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        pretendard: ['"Pretendard-Regular"', "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};
