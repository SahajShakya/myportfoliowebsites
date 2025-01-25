// tailwind.config.js

module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // Adjust if you use other file extensions
  ],
  theme: {
    extend: {
      colors: {
        "custom-blue": "#002b9d",
        "custom-teal": "#34ffea",
      },
      fontSize: {
        "2xl": "1.5rem",
      },
    },
  },
  plugins: [],
};
