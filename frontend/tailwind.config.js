/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'water-blue-start': '#a0d2eb',
        'water-blue-mid': '#89c2d9',
        'water-blue-end': '#4682b4', // A darker blue for contrast
        'water-bg-light': '#f0f8ff', // AliceBlue
        'water-bg-dark': '#e0f2fe',
      },
      keyframes: {
        wobble: {
          '0%, 100%': { transform: 'scale(1) rotate(0deg)' },
          '25%': { transform: 'scale(1.05) rotate(-2deg)' },
          '50%': { transform: 'scale(1.05) rotate(2deg)' },
          '75%': { transform: 'scale(1) rotate(0deg)' },
        },
        blobWobble: {
          '0%, 100%': { transform: 'translateY(0) rotate(0)', 'border-radius': '60% 40% 30% 70% / 60% 30% 70% 40%' },
          '50%': { transform: 'translateY(-5px) rotate(5deg)', 'border-radius': '30% 70% 60% 40% / 30% 60% 40% 70%' },
        }
      },
      animation: {
        'wobble': 'wobble 0.8s ease-in-out',
        'blob-wobble': 'blobWobble 3s ease-in-out infinite',
      },
      boxShadow: {
        'water': '0 10px 15px -3px rgba(70, 130, 180, 0.3), 0 4px 6px -4px rgba(70, 130, 180, 0.2)',
      }
    },
  },
  plugins: [],
}