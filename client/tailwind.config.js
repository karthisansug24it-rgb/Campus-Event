/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#FFFFFF',
        surface: '#F8FAFC',
        'surface-hover': '#F1F5F9',
        card: '#FFFFFF',
        'card-hover': '#FAFCFF',
        'card-border': '#E2E8F0',
        canvas: '#F8FAFC',
        midnight: '#0B1220',
        brand: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
          950: '#0B1220',
        },
        college: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Space Grotesk"', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'glow-blue': '0 0 25px -4px rgba(37, 99, 235, 0.35)',
        'soft-blue': '0 8px 24px -4px rgba(37, 99, 235, 0.12)',
        'card-light': '0 2px 12px -2px rgba(37, 99, 235, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04)',
        'card-hover-light': '0 12px 32px -4px rgba(37, 99, 235, 0.16), 0 4px 8px -2px rgba(0, 0, 0, 0.04)',
        'modal-light': '0 25px 50px -12px rgba(30, 58, 138, 0.25)',
      },
      letterSpacing: {
        luxury: '0.12em',
        widest2: '0.22em',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        }
      }
    },
  },
  plugins: [],
}
