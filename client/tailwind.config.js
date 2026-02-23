/** @type {import('tailwindcss').Config} */
export default {
  // Enable dark mode via a class on <html>
  darkMode: "class",

  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],

  theme: {
    extend: {
      fontFamily: {
        // Outfit is loaded via Google Fonts in index.css
        sans: ["Outfit", "system-ui", "sans-serif"],
      },

      colors: {
        // CareLine360 brand tokens – matches CSS variables
        cl: {
          teal:  "#0d9488",
          cyan:  "#06b6d4",
          light: "#5eead4",
        },
      },

      backdropBlur: {
        xs: "2px",
      },

      boxShadow: {
        glass: "0 4px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.5)",
        "glass-dark": "0 4px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.05)",
        teal: "0 8px 32px rgba(13,148,136,0.35)",
      },

      animation: {
        "fade-in": "fadeIn 0.4s ease both",
        "blob-drift": "blobDrift 18s ease-in-out infinite alternate",
      },

      keyframes: {
        fadeIn: {
          "0%":   { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        blobDrift: {
          "0%":   { transform: "translate(0, 0) scale(1)" },
          "100%": { transform: "translate(30px, -40px) scale(1.05)" },
        },
      },
    },
  },

  plugins: [],
};