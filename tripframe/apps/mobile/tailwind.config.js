/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: '#0F0F13',
        card: '#13131A',
        primary: '#A78BFA',
        'primary-dim': '#7C3AED',
        danger: '#EF4444',
        success: '#10B981',
        warning: '#F59E0B',
        muted: '#6B7280',
      },
    },
  },
  plugins: [],
};
