/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['"Fraunces"', 'Georgia', 'serif'],
      },
      colors: {
        // Warm Scandinavian neutrals
        sand: {
          50: '#faf9f7',
          100: '#f4f2ee',
          200: '#e9e5dd',
          300: '#d9d3c7',
          400: '#bcb3a3',
        },
        ink: {
          50: '#f6f7f8',
          100: '#eceef0',
          200: '#d6dadf',
          300: '#b2bac3',
          400: '#8794a1',
          500: '#677281',
          600: '#515b68',
          700: '#434a55',
          800: '#2c323a',
          900: '#1c2128',
          950: '#12161b',
        },
        // Muted Nordic teal accent
        accent: {
          50: '#eef6f4',
          100: '#d6ebe6',
          200: '#aed7ce',
          300: '#7fbcb0',
          400: '#549b8e',
          500: '#3a8073',
          600: '#2d675c',
          700: '#27534b',
          800: '#21433d',
          900: '#1c3833',
        },
      },
      boxShadow: {
        card: '0 1px 2px rgba(28, 33, 40, 0.04), 0 1px 3px rgba(28, 33, 40, 0.06)',
        soft: '0 2px 8px rgba(28, 33, 40, 0.05), 0 8px 24px rgba(28, 33, 40, 0.06)',
        lift: '0 4px 12px rgba(28, 33, 40, 0.08), 0 16px 40px rgba(28, 33, 40, 0.10)',
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.125rem',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.98)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
      },
    },
  },
  plugins: [],
}
