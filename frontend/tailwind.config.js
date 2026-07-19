/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Einheitliches helles Showroom-Theme, kein Dark Mode mehr.
        // Ein warmes Cremeweiss traegt die GESAMTE Seite (Hero bis Footer) -
        // bewusst kein Hell/Dunkel-Bruch mehr.
        cream: '#F5F3EE',
        'cream-raised': '#FFFFFF',
        showroom: '#F5F3EE',
        'showroom-raised': '#FFFFFF',
        gold: '#D4AF6A',
        'gold-dim': '#A9854F',
        racing: '#1E7A52',
        'racing-bg': '#E1F0E8',
        amber: '#835310',
        'amber-bg': '#F5E9D3',
        steel: '#5B6675',
        'steel-bg': '#E7E9EC',
        crimson: '#A62B3C',
        'crimson-bg': '#F5DEE1',
        // Graphit-Skala fuer Text/Rahmen auf dem hellen Grund (kein dunkler
        // Flaechen-Einsatz mehr - nur noch als Textfarbe/feine Konturen).
        graphite: {
          50: '#F5F3EE',
          100: '#EDEAE2',
          500: '#64707F',
          600: '#5B6675',
          700: '#4A5361',
          800: '#333A44',
          900: '#1A1A1A',
          950: '#141414',
        },
        // "paper" bleibt als Alias fuer den hellen Grund erhalten (Kompatibilitaet),
        // zeigt jetzt aber auf Creme statt auf helles Grau.
        paper: '#F5F3EE',
        brass: {
          DEFAULT: '#D4AF6A',
          light: '#E4C68C',
          // Dunklerer Goldton fuer Text auf hellen Flaechen (z.B. Fahrzeugpreis
          // auf weisser Karte) - das helle brass/#D4AF6A unterschreitet dort
          // WCAG AA (nur ~1.8:1 auf Weiss/Creme).
          dim: '#7A5A28',
        },
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        body: ['Inter', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      aspectRatio: {
        '16/10': '16 / 10',
        '21/9': '21 / 9',
      },
      boxShadow: {
        card: '0 1px 2px rgba(11,15,20,0.08), 0 8px 20px rgba(11,15,20,0.10)',
        raised: '0 14px 34px rgba(11,15,20,0.22)',
        'gold-glow': '0 0 0 1px rgba(212,175,106,0.4), 0 8px 24px rgba(212,175,106,0.18)',
        // Sanft angehobener Schatten fuer Karten/CTAs im Hover-Zustand.
        lift: '0 20px 40px -12px rgba(11,15,20,0.35), 0 0 0 1px rgba(212,175,106,0.15)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-700px 0' },
          '100%': { backgroundPosition: '700px 0' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.8s linear infinite',
      },
    },
  },
  plugins: [],
};
