/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#306D29',        // Forest green
          container: '#E7E1B1',      // Warm yellow-beige
          fixed: '#FBF5DD',          // Cream
          'fixed-dim': '#E7E1B1',    // Yellow-beige
        },
        secondary: {
          DEFAULT: '#0D530E',        // Deep forest green
          container: '#E7E1B1',      // Warm yellow-beige
          fixed: '#FBF5DD',          // Cream
          'fixed-dim': '#D4CE9A',    // Darker yellow-beige
        },
        tertiary: {
          DEFAULT: '#306D29',        // Forest green
          container: '#EEE9C4',      // Mid cream
          fixed: '#FBF5DD',          // Cream
          'fixed-dim': '#E7E1B1',    // Yellow-beige
        },
        surface: {
          DEFAULT: '#FBF5DD',        // Cream (#FBF5DD)
          dim: '#E7E1B1',            // Yellow-beige (#E7E1B1)
          bright: '#FFFDF0',         // Bright cream
          container: '#F5EFCA',      // Light cream container
          'container-low': '#F8F3D8', // Very light cream
          'container-high': '#EDE7B8', // Medium yellow-beige
          'container-highest': '#E7E1B1', // Yellow-beige (#E7E1B1)
          'container-lowest': '#FFFEF5', // Near white cream
          variant: '#E7E1B1',        // Yellow-beige variant
        },
        background: '#FBF5DD',       // Cream background (#FBF5DD)
        error: {
          DEFAULT: '#BA1A1A',
          container: '#FFDAD6',
        },
        outline: {
          DEFAULT: '#306D29',        // Forest green outline
          variant: '#C8C9A8',        // Muted yellow-green outline
        },
        'on-primary': '#FFFFFF',
        'on-primary-container': '#0D530E',
        'on-primary-fixed': '#0D530E',
        'on-primary-fixed-variant': '#1A4A18',
        'on-secondary': '#FFFFFF',
        'on-secondary-container': '#0D530E',
        'on-secondary-fixed': '#0A3A0B',
        'on-secondary-fixed-variant': '#1A4A18',
        'on-tertiary': '#FFFFFF',
        'on-tertiary-container': '#0D530E',
        'on-tertiary-fixed': '#0D530E',
        'on-tertiary-fixed-variant': '#1A4A18',
        'on-surface': '#1A1A0A',
        'on-surface-variant': '#4A4A2A',
        'on-background': '#1A1A0A',
        'on-error': '#FFFFFF',
        'on-error-container': '#93000A',
        'inverse-surface': '#0D530E',
        'inverse-on-surface': '#FBF5DD',
        'inverse-primary': '#E7E1B1',
        'surface-tint': '#306D29',
      },
      fontFamily: {
        sans: ['Work Sans', 'system-ui', 'sans-serif'],
        body: ['Work Sans', 'system-ui', 'sans-serif'],
        label: ['Work Sans', 'system-ui', 'sans-serif'],
        headline: ['Newsreader', 'serif'],
        display: ['Newsreader', 'serif'],
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        lg: '0.5rem',
        xl: '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
