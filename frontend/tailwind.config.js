module.exports = {
  darkMode: 'class', 
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        blob: "blob 7s infinite",
        'fade-in': 'fadeIn 0.5s ease-in-out',
      },
      keyframes: {
        blob: {
          "0%": {
            transform: "translate(0px, 0px) scale(1)",
          },
          "33%": {
            transform: "translate(30px, -50px) scale(1.1)",
          },
          "66%": {
            transform: "translate(-20px, 20px) scale(0.9)",
          },
          "100%": {
            transform: "translate(0px, 0px) scale(1)",
          },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animationDelay: {
        2000: '2000ms',
        4000: '4000ms',
      },
    },
  },
  plugins: [],
}