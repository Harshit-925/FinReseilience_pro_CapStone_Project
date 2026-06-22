export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
          slate: {
              50: '#F8FAFC',
              100: '#F1F5F9',
              200: '#E2E8F0',
              300: '#CBD5E1',
              400: '#94A3B8',
              500: '#64748B',
              600: '#475569',
              700: '#334155',
              800: '#1E293B',
              900: '#0F172A',
              950: '#020617',
          }
      },
      borderRadius: {
              "DEFAULT": "0.125rem",
              "lg": "0.25rem",
              "xl": "0.5rem",
              "full": "0.75rem"
      },
      fontFamily: {
              "headline": ["Inter", "sans-serif"],
              "display": ["Inter", "sans-serif"],
              "body": ["Public Sans", "sans-serif"],
              "label": ["Public Sans", "sans-serif"]
      }
    },
  },
  plugins: [],
}
