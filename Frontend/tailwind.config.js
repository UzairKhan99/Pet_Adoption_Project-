/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          background: "#fffaf3",
          foreground: "#1f2937",
          card: "#ffffff",
          muted: "#f5f3ef",
          "muted-foreground": "#6b7280",
          border: "#e7e0d4",
          primary: "#b45309",
          "primary-foreground": "#fff7ed",
          secondary: "#fbbf24",
          accent: "#0f766e",
        },
        boxShadow: {
          soft: "0 18px 45px rgba(31, 41, 55, 0.10)",
        },
      },
    },
    plugins: [],
  }
