import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: '#0E2A47', deep: '#081A2E' },
        gold: { DEFAULT: '#C89B3C', light: '#E4C77E' },
        sand: '#F7F3EA',
        ink: '#1B2733',
        muted: '#7C879A',
        line: '#E7E1D3',
        okgreen: '#2F8F5B',
        okgreenbg: '#EAF6EF',
        warn: '#B7791F',
        warnbg: '#FBF3DF',
        bad: '#C0392B',
        badbg: '#FBEAE8',
      },
      fontFamily: {
        display: ['var(--font-fraunces)', 'serif'],
        body: ['var(--font-inter)', 'sans-serif'],
      },
      boxShadow: {
        card: '0 20px 50px rgba(8,26,46,0.12)',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        fadeup: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        marquee: 'marquee 28s linear infinite',
        fadeup: 'fadeup .4s ease both',
      },
    },
  },
  plugins: [],
};
export default config;
