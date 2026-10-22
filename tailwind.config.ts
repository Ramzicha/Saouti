import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // Design System Semantic Surface & Text Tokens
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        'surface-raised': 'var(--surface-raised)',
        border: 'var(--border)',
        text: 'var(--text)',
        muted: 'var(--muted)',

        // Accent & Buttons
        accent: 'var(--accent)',
        'accent-soft': 'var(--accent-soft)',
        'on-accent': 'var(--on-accent)',
        button: 'var(--button)',
        'on-button': 'var(--on-button)',

        // Feedback
        success: 'var(--success)',
        danger: 'var(--danger)',

        // Agent Semantic Colors
        'agent-writer': 'var(--agent-writer)',
        'agent-critic': 'var(--agent-critic)',
        'agent-art': 'var(--agent-art)',
        'agent-profiler': 'var(--agent-profiler)',
        'agent-strategist': 'var(--agent-strategist)',
      },
      borderRadius: {
        control: '8px',
        row: '12px',
        card: '16px',
        composer: '18px',
      },
      fontFamily: {
        sans: [
          'var(--font-inter)',
          'var(--font-arabic)',
          'system-ui',
          'sans-serif',
        ],
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        arabic: ['var(--font-arabic)', 'system-ui', 'sans-serif'],
      },
      spacing: {
        // Design system scale: 4, 8, 12, 16, 24, 32 px
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '6': '24px',
        '8': '32px',
      },
      maxWidth: {
        workspace: '876px',
        composer: '820px',
      },
      width: {
        sidebar: '240px',
      },
      height: {
        header: '56px',
      },
      keyframes: {
        'agent-pulse': {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.35)', opacity: '0.45' },
        },
      },
      animation: {
        'agent-pulse': 'agent-pulse 1.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
