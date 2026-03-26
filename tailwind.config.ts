import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  safelist: [
    'bg-emerald-500',
    'bg-fuchsia-500',
    'bg-rose-500',
    'bg-cyan-500',
    'bg-blue-500',
    'bg-indigo-500',
    'bg-violet-500',
    'bg-amber-500',
    'bg-orange-500',
    'bg-teal-500',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        'sans': ['var(--font-inter)', 'var(--font-noto-sans-sc)', 'system-ui', 'sans-serif'],
        'serif': ['"Playfair Display"', '"Noto Serif SC"', 'Georgia', 'serif'],
        'display': ['"Playfair Display"', '"Noto Serif SC"', 'Georgia', 'serif'],
        'mono': ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        primary: {
          50:  '#fff5f5',
          100: '#ffe8e8',
          200: '#fdd0cf',
          300: '#f9aba8',
          400: '#f08080',
          500: '#e06b6b',
          600: '#c85a5a',
          700: '#a64b4b',
          800: '#8a4040',
          900: '#733939',
        },
        gold: {
          50:  '#fdfaf3',
          100: '#f9f0db',
          200: '#f2deb5',
          300: '#e8c88a',
          400: '#d4a853',
          500: '#c49a3d',
          600: '#a67d2e',
          700: '#845f24',
          800: '#6b4d20',
          900: '#573f1c',
        },
        purple: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7c3aed',
          800: '#6b21a8',
          900: '#581c87',
          950: '#3b0764',
        },
        neutral: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0a0a0a',
        },
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        }
      },
      boxShadow: {
        'soft': '0 2px 10px -2px rgba(0, 0, 0, 0.04)',
        'card': '0 8px 25px -5px rgba(0, 0, 0, 0.06), 0 4px 10px -3px rgba(0, 0, 0, 0.02)',
        'input': '0 1px 3px 0 rgba(0, 0, 0, 0.08), 0 1px 2px 0 rgba(0, 0, 0, 0.04)',
      }
    },
  },
  plugins: [
    function({ addVariant }: { addVariant: (name: string, definition: string) => void }) {
      addVariant('sidebar-expanded', '.sidebar-expanded &')
    }
  ],
} satisfies Config;
