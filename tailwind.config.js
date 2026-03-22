/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#0a0d12',
        'bg-secondary': '#0f1318',
        'bg-surface': '#141921',
        'bg-card': '#1a2030',
        'bg-hover': '#1f2738',
        'border-subtle': '#1d2433',
        'border-main': '#252d3d',
        'primary': '#1e6b8a',
        'primary-hover': '#1d7da3',
        'accent': '#00c2e0',
        'accent-dim': '#007a8c',
        'alert': '#dc2626',
        'warning': '#d97706',
        'success': '#16a34a',
        'text-primary': '#e2e8f0',
        'text-secondary': '#94a3b8',
        'text-muted': '#64748b',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'slide-in-right': 'slideInRight 0.25s ease-out',
        'fade-in': 'fadeIn 0.15s ease-out',
        'pulse-subtle': 'pulseSubtle 2s ease-in-out infinite',
      },
      keyframes: {
        slideInRight: {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0,0,0,0.4)',
        'panel': '-8px 0 24px rgba(0,0,0,0.5)',
        'glow-accent': '0 0 0 1px rgba(0,194,224,0.4), 0 0 12px rgba(0,194,224,0.1)',
        'glow-alert': '0 0 0 1px rgba(220,38,38,0.4), 0 0 12px rgba(220,38,38,0.1)',
      },
    },
  },
  plugins: [],
}
