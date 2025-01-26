/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
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
          500: "#2b77e7", // Neo Blue color
        },
        white: {
          DEFAULT: "#fff", // White for neo-brutalism-white
        },
        "neo-blue": "#2b77e7", // Custom Blue color (neo-brutalism-blue)
        "neo-white": "#fff", // Custom White color (neo-brutalism-white)
        "shadow-blue": "#336cc1", // Shadow Blue for neo-brutalism-blue
        "shadow-light-blue": "#0092db", // Shadow Light Blue for neo-brutalism-blue
        "shadow-light-white": "#d2e4ff", // Shadow Light White for neo-brutalism-white
      },
      fontFamily: {
        worksans: ["Work Sans", "sans-serif"],
        poppins: ["Poppins", "sans-serif"],
      },
      boxShadow: {
        card: "0px 1px 2px 0px rgba(0, 0, 0, 0.05)", // For card shadow
        "neo-brutalism":
          "0.6vmin 0.6vmin #336cc1, 1vmin 1vmin #0092db, 1vmin 1vmin #0092db, 0.65vmin 1vmin #0092db, 1vmin 0.65vmin #0092db", // Custom shadow for .neo-brutalism-blue
        "neo-brutalism-white":
          "0.6vmin 0.6vmin #fff, 1vmin 1vmin #d2e4ff, 1vmin 1vmin #d2e4ff, 0.65vmin 1vmin #d2e4ff, 1vmin 0.65vmin #d2e4ff", // Custom shadow for .neo-brutalism-white
      },
    },
  },
  plugins: [],
};
