import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['var(--font-mono)'],
        sans: ['var(--font-sans)'],
      },
      colors: {
        background: 'rgb(var(--background) / <alpha-value>)',
        foreground: 'rgb(var(--foreground) / <alpha-value>)',
        border: 'rgb(var(--border) / <alpha-value>)',
        muted: {
          DEFAULT: 'rgb(var(--muted) / <alpha-value>)',
          foreground: 'rgb(var(--muted-foreground) / <alpha-value>)',
        },
        accent: {
          green: 'rgb(var(--accent-green) / <alpha-value>)',
          red: 'rgb(var(--accent-red) / <alpha-value>)',
          yellow: 'rgb(var(--accent-yellow) / <alpha-value>)',
          blue: 'rgb(var(--accent-blue) / <alpha-value>)',
        },
        tremor: {
          extreme: 'rgb(var(--tremor-extreme) / <alpha-value>)',
          high: 'rgb(var(--tremor-high) / <alpha-value>)',
          moderate: 'rgb(var(--tremor-moderate) / <alpha-value>)',
          low: 'rgb(var(--tremor-low) / <alpha-value>)',
          pulse: 'rgb(var(--tremor-pulse) / <alpha-value>)',
        },
        trend: {
          up: 'rgb(var(--trend-up) / <alpha-value>)',
          down: 'rgb(var(--trend-down) / <alpha-value>)',
        },
        card: 'rgb(var(--card) / <alpha-value>)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};

export default config;