export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: { 950: '#060b1a', 900: '#0a1128', 800: '#0f1a3a', 700: '#17254f', 600: '#22346b' },
        accent: { DEFAULT: '#3b82f6', soft: '#60a5fa' },
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
}
