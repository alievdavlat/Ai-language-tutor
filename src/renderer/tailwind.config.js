/** @type {import('tailwindcss').Config} */
// Renderer-local Tailwind config for standalone Vite preview.
// Content paths are relative to THIS file's location (src/renderer/).
export default {
  content: [
    './index.html',
    './src/**/*.{html,ts,tsx}'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Primary accent — clean blue (Speaker-style), replaces the old indigo.
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554'
        },
        speak: { 400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb' },
        vocab: { 400: '#34d399', 500: '#10b981', 600: '#059669' },
        grammar: { 400: '#fb7185', 500: '#f43f5e', 600: '#e11d48' },
        listen: { 400: '#fbbf24', 500: '#f59e0b', 600: '#d97706' },
        read: { 400: '#38bdf8', 500: '#0ea5e9', 600: '#0284c7' },
        write: { 400: '#c084fc', 500: '#a855f7', 600: '#9333ea' },
        // Surfaces — dark navy canvas with progressively lighter raised layers.
        canvas: {
          DEFAULT: '#080b1a',
          soft: '#0d1124',
          raised: 'rgba(255,255,255,0.05)',
          card: 'rgba(255,255,255,0.04)',
          line: 'rgba(255,255,255,0.08)'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        glow: '0 24px 60px -20px rgba(37, 99, 235, 0.5)',
        'glow-sm': '0 10px 30px -12px rgba(37, 99, 235, 0.45)',
        'glow-speak': '0 24px 60px -20px rgba(59, 130, 246, 0.5)',
        'glow-vocab': '0 24px 60px -20px rgba(16, 185, 129, 0.45)',
        'glow-grammar': '0 24px 60px -20px rgba(244, 63, 94, 0.45)',
        'glow-listen': '0 24px 60px -20px rgba(245, 158, 11, 0.45)',
        card: '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 18px 40px -24px rgba(0,0,0,0.7)'
      },
      borderRadius: {
        card: '1.25rem',
        pill: '999px'
      },
      backgroundImage: {
        'grad-speak': 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
        'grad-vocab': 'linear-gradient(135deg, #059669 0%, #0ea5e9 100%)',
        'grad-grammar': 'linear-gradient(135deg, #e11d48 0%, #a855f7 100%)',
        'grad-listen': 'linear-gradient(135deg, #f59e0b 0%, #f43f5e 100%)',
        'grad-brand': 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
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
