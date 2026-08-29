import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}', './lib/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        border: 'var(--border)',
        ink: 'var(--ink)',
        muted: 'var(--muted)',
        primary: 'rgb(var(--primary) / <alpha-value>)',
        sidebar: 'var(--sidebar)',
        status: {
          not_started: '#64748B',
          planning: '#7C3AED',
          in_progress: '#2563EB',
          on_hold: '#B45309',
          completed: '#15803D',
          delayed: '#B42318'
        },
        priority: {
          high: '#B42318',
          medium: '#B45309',
          low: '#64748B'
        }
      },
      boxShadow: {
        card: '0 1px 2px rgba(16, 42, 67, 0.04)'
      },
      borderRadius: {
        card: '16px',
        input: '8px',
        button: '10px'
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
};

export default config;
