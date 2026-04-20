/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
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
        accent: '#3B82F6',
        'accent-dim': '#2563EB',
        danger: '#EF4444',
        success: '#10B981',
        warning: '#F59E0B',
        'warning-soft': '#F97316',
        muted: '#6B7280',
      },
    },
  },
  plugins: [],
};
