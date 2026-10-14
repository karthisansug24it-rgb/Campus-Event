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
        background: '#07080D',
        card: '#0D101D',
        'card-hover': '#121628',
        'card-border': '#1F2744',
        surface: '#13182B',
        'surface-hover': '#1A213D',
        cyan: {
          400: '#22d3ee',
          500: '#06b6d4',
          accent: '#00F2FE',
        },
        college: {
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#172554',
          accent: '#0066FF',
        },
        purple: {
          accent: '#9B51E0',
          glow: '#7928CA',
        },
        emerald: {
          accent: '#00E676',
        },
        amber: {
          accent: '#FFB800',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'glow-cyan': '0 0 25px -5px rgba(0, 242, 254, 0.25)',
        'glow-blue': '0 0 25px -5px rgba(37, 99, 235, 0.35)',
        'glow-purple': '0 0 25px -5px rgba(155, 81, 224, 0.25)',
        'glow-emerald': '0 0 25px -5px rgba(0, 230, 118, 0.25)',
        'glow-amber': '0 0 25px -5px rgba(255, 184, 0, 0.25)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.45)',
        'modal': '0 25px 60px -15px rgba(0, 0, 0, 0.8)',
      },
      letterSpacing: {
        luxury: '0.15em',
        widest2: '0.25em',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        }
      }
    },
  },
  plugins: [],
}
