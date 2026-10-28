/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: '#14130F',
        surface: {
          DEFAULT: '#1C1B16',
          2: '#24231C',
        },
        border: '#2E2D25',
        text: {
          DEFAULT: '#F2EEE3',
          muted: '#A39F90',
        },
        accent: {
          DEFAULT: '#E8A33D',
          ink: '#1A1405',
        },
        verified: {
          DEFAULT: '#8DB580',
          bg: '#1A2318',
        },
        unverified: {
          DEFAULT: '#E0894B',
          bg: '#261C14',
        },
        'not-found': {
          DEFAULT: '#8A867A',
          bg: '#1F1E1A',
        },
        differs: {
          DEFAULT: '#D9694E',
          bg: '#261814',
        },
      },
      fontFamily: {
        serif: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      borderRadius: {
        card: '12px',
        btn: '8px',
      },
      lineHeight: {
        relaxed: '1.6',
      },
    },
  },
  plugins: [],
}
