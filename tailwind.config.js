
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Override slate with blue denim tones
        slate: {
          50: '#f8fafc',   // Keep light backgrounds
          100: '#f1f5f9',  // Keep light backgrounds
          200: '#e2e8f0',  // Keep light borders
          300: '#cbd5e1',  // Transition to blue
          400: '#4a5f7f',  // Azul denim claro (tertiary text)
          500: '#2c5282',  // Azul denim medio (secondary text)
          600: '#1e3a5f',  // Azul denim oscuro (primary text - medium)
          700: '#1a3352',  // Azul denim más oscuro (primary text)
          800: '#152945',  // Azul denim muy oscuro
          900: '#0f1f38',  // Azul denim máximo oscuro
          950: '#0a1528',  // Casi negro azulado
        },
        // También sobrescribir gray para más cobertura
        gray: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#4a5f7f',  // Azul denim
          500: '#2c5282',  // Azul denim
          600: '#1e3a5f',  // Azul denim
          700: '#1a3352',  // Azul denim
          800: '#152945',  // Azul denim
          900: '#0f1f38',  // Azul denim
          950: '#0a1528',
        },
      },
      textColor: {
        DEFAULT: '#1e3a5f', // Azul denim oscuro por defecto
      },
    },
  },
  plugins: [],
}
