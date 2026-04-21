/** @type {import('tailwindcss').Config} */
export default {
  content: ['./client/index.html', './client/src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace']
      },
      colors: {
        navy: {
          DEFAULT: '#0a0e1a',
          800: '#0f1424',
          700: '#141a2e',
          600: '#1c2340',
          500: '#26304f'
        },
        electric: '#3b82f6',
        'electric-dim': '#1d4ed8'
      }
    }
  },
  plugins: []
};
