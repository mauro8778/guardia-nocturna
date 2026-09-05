/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Deep Navy / Dark Steel Base from the lunchbox body container
        slate: {
          950: '#0c141d', // Very dark navy base background
          900: '#14202e', // Deep container slate
          850: '#1a293b', // Card panel background
          800: '#23374d', // Surface borders
          700: '#324a64', // Muted borders / input borders
          600: '#466482', // Muted text / secondary icons
          500: '#6283a5', // Soft slate
          400: '#8ba6c3', // Light muted text
          300: '#b7cae0', // High contrast secondary text
        },
        // Nordic Steel Blue (Lunchbox lid & main accent)
        brand: {
          50: '#f0f6fc',
          100: '#dbf0ff',
          200: '#b8e1ff',
          300: '#8bcaf8',
          400: '#5caee8',
          500: '#4b91cc', // Primary Nordic Steel Blue
          600: '#3975ab', // Darker active state
          700: '#2b5a88',
          800: '#21466b',
        },
        // Warm Oat Beige / Cream (Utensils & Warm Accents)
        oat: {
          50: '#fcfaf6',
          100: '#f6f0e6',
          200: '#ebdcc5', // Soft cream background
          300: '#dfc8a5', // Utensil Beige Highlight
          400: '#d1b184',
          500: '#be9965',
          600: '#a37c4e',
        },
        status: {
          yellow: '#e5a93c',
          yellowLight: '#fdedcf',
          green: '#2db889',
          greenLight: '#d2f6e9',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

