/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"], // Make sure paths are correct
  theme: {
    extend: {
      colors: {
        gray: {
          200: "#D5DAE1",
        },
        black: {
          DEFAULT: "#000",
          500: "#1D2235",
        },
        blue: {
          500: "#2b77e7",
        },
        white: {
          DEFAULT: "#fff",
        },
        "neo-blue": "#2b77e7",
        "neo-white": "#fff",
        "shadow-blue": "#336cc1",
        "shadow-light-blue": "#0092db",
        "shadow-light-white": "#d2e4ff",
      },
      fontFamily: {
        worksans: ["Work Sans", "sans-serif"],
        poppins: ["Poppins", "sans-serif"],
      },
      boxShadow: {
        card: "0px 1px 2px 0px rgba(0, 0, 0, 0.05)",
        "neo-brutalism":
          "0.6vmin 0.6vmin #336cc1, 1vmin 1vmin #0092db, 1vmin 1vmin #0092db, 0.65vmin 1vmin #0092db, 1vmin 0.65vmin #0092db",
        "neo-brutalism-white":
          "0.6vmin 0.6vmin #fff, 1vmin 1vmin #d2e4ff, 1vmin 1vmin #d2e4ff, 0.65vmin 1vmin #d2e4ff, 1vmin 0.65vmin #d2e4ff",
      },
    },
  },
  plugins: [],
};
