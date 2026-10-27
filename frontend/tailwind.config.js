/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ivory: {
          DEFAULT: '#FAF8F3',
          subtle: '#F3EFE6',
          border: '#E6E1D6',
        },
        ink: {
          DEFAULT: '#20233A',
          muted: '#575B75',
          faint: '#888CA4',
        },
        teal: {
          editorial: '#0F9D91',
          soft: '#E6F7F5',
        },
        coral: {
          risk: '#E11D48',
          soft: '#FFF1F2',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"Manrope"', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Manrope"', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        serif: ['"DM Serif Display"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        editorial: '0 4px 20px -4px rgba(219, 39, 119, 0.06), 0 2px 6px -1px rgba(32, 35, 58, 0.04)',
        'editorial-md': '0 10px 28px -6px rgba(219, 39, 119, 0.11), 0 4px 10px -2px rgba(32, 35, 58, 0.05)',
        'editorial-lg': '0 20px 42px -10px rgba(219, 39, 119, 0.16), 0 8px 18px -4px rgba(32, 35, 58, 0.06)',
        magenta: '0 8px 24px -4px rgba(219, 39, 119, 0.32)',
      },
    },
  },
  plugins: [],
};
