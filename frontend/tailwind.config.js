/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        yellow: {
          400: "#FFCE00",
          500: "#F9B233",
        },
        orange: {
          500: "#F15A29",
        },
      },
      screens: {
        xs: "480px",
      },
    },
  },
  plugins: [],
};
