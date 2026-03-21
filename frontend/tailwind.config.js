/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          rose: "#a66d7b",
          blush: "#f4dde2",
          wine: "#885664",
          ink: "#2f3b45",
          mist: "#f8f1ee",
          cream: "#fffdfb",
          sage: "#dfe9e2"
        }
      },
      fontFamily: {
        sans: ["Manrope", "sans-serif"],
        display: ["Cormorant Garamond", "serif"]
      },
      boxShadow: {
        soft: "0 18px 40px rgba(71, 51, 57, 0.08)",
        float: "0 28px 60px rgba(71, 51, 57, 0.14)"
      },
      backgroundImage: {
        "hero-glow": "radial-gradient(circle at top left, rgba(244, 221, 226, 0.85), transparent 28%), linear-gradient(180deg, #fffdfb 0%, #fff7f4 100%)"
      }
    }
  },
  plugins: []
};
