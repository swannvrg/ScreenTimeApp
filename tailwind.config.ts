import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg:      '#080810',
        surface: '#0f0f1a',
        border:  '#1a1a2e',
        card:    '#0c0c18',
        accent:  '#00ff88',
        danger:  '#ff2d55',
        warn:    '#ffcc00',
        muted:   '#44445a',
      },
      fontFamily: {
        mono:    ['"IBM Plex Mono"', 'monospace'],
        display: ['"Bebas Neue"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config