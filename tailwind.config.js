/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/renderer/**/*.{html,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef1ff',
          100: '#dbe1ff',
          200: '#bfc9ff',
          300: '#9aa8ff',
          400: '#7684ff',
          500: '#5d66f5',
          600: '#4b4ee3',
          700: '#3f3ec4',
          800: '#33349d',
          900: '#2a2c7b',
          950: '#1b1c4c'
        },
        speak: { 400: '#a78bfa', 500: '#8b5cf6', 600: '#7c3aed' },
        vocab: { 400: '#34d399', 500: '#10b981', 600: '#059669' },
        grammar: { 400: '#f472b6', 500: '#ec4899', 600: '#db2777' },
        listen: { 400: '#fbbf24', 500: '#f59e0b', 600: '#d97706' },
        read: { 400: '#38bdf8', 500: '#0ea5e9', 600: '#0284c7' },
        write: { 400: '#c084fc', 500: '#a855f7', 600: '#9333ea' },
        canvas: {
          DEFAULT: '#080b1a',
          soft: '#0d1124',
          card: 'rgba(255,255,255,0.04)',
          line: 'rgba(255,255,255,0.08)'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        glow: '0 24px 60px -20px rgba(93, 102, 245, 0.45)',
        'glow-speak': '0 24px 60px -20px rgba(139, 92, 246, 0.5)',
        'glow-vocab': '0 24px 60px -20px rgba(16, 185, 129, 0.45)',
        'glow-grammar': '0 24px 60px -20px rgba(236, 72, 153, 0.45)',
        'glow-listen': '0 24px 60px -20px rgba(245, 158, 11, 0.45)'
      },
      borderRadius: {
        card: '1.25rem',
        pill: '999px'
      },
      backgroundImage: {
        'grad-speak': 'linear-gradient(135deg, #7c3aed 0%, #4b4ee3 100%)',
        'grad-vocab': 'linear-gradient(135deg, #059669 0%, #0ea5e9 100%)',
        'grad-grammar': 'linear-gradient(135deg, #db2777 0%, #a855f7 100%)',
        'grad-listen': 'linear-gradient(135deg, #f59e0b 0%, #ec4899 100%)',
        'grad-brand': 'linear-gradient(135deg, #5d66f5 0%, #8b5cf6 100%)'
      },
      keyframes: {
        'fade-in': {
          from: { opacity: 0, transform: 'translateY(8px)' },
          to: { opacity: 1, transform: 'translateY(0)' }
        },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' }
        }
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out both',
        shimmer: 'shimmer 2.2s infinite',
        float: 'float 6s ease-in-out infinite'
      }
    }
  },
  plugins: []
}
