import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Cores de Destaque
        'rosa-vibrante': 'var(--rosa-vibrante)',
        'lilas-claro': 'var(--lilas-claro)',
        'roxo-profundo': 'var(--roxo-profundo)',
        'lilas-medio': 'var(--lilas-medio)',
        'azul-link': 'var(--azul-link)',
        // Neutros de Interface
        'cinza-escuro-suave': 'var(--cinza-escuro-suave)',
        'creme-fundo': 'var(--creme-fundo)',
        'bege-cartao': 'var(--bege-cartao)',
        'cinza-medio': 'var(--cinza-medio)',
        'bege-suave': 'var(--bege-suave)',
        'cinza-texto': 'var(--cinza-texto)',
        'cinza-forte': 'var(--cinza-forte)',
        // Preto e Branco
        'preto-puro': 'var(--preto-puro)',
        'preto-suave': 'var(--preto-suave)',
        'branco-puro': 'var(--branco-puro)',
        // Clínica Performance e Saúde
        'ouro-clinica': 'var(--ouro-clinica)',
        'ouro-claro': 'var(--ouro-claro)',
        'ouro-escuro': 'var(--ouro-escuro)',
        'cinza-silhueta': 'var(--cinza-silhueta)',
        'preto-silhueta': 'var(--preto-silhueta)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'slide-in-left': {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(22px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in-spring': {
          '0%': { opacity: '0', transform: 'scale(0.75)' },
          '70%': { transform: 'scale(1.06)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'success-expand': {
          '0%': { opacity: '0', transform: 'scale(0.85)' },
          '60%': { transform: 'scale(1.04)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'slide-in-left':   'slide-in-left 0.65s ease-out both',
        'fade-in-up':      'fade-in-up 0.55s ease-out both',
        'fade-in-up-d1':   'fade-in-up 0.55s ease-out 0.15s both',
        'fade-in-up-d2':   'fade-in-up 0.55s ease-out 0.25s both',
        'fade-in-up-d3':   'fade-in-up 0.55s ease-out 0.35s both',
        'fade-in-up-d4':   'fade-in-up 0.55s ease-out 0.45s both',
        'scale-in-spring': 'scale-in-spring 0.55s ease-out 0.4s both',
        'fade-in':         'fade-in 0.4s ease-out both',
        'fade-in-slow':    'fade-in 0.7s ease-out both',
        'success-expand':  'success-expand 0.5s ease-out both',
      },
    },
  },
  plugins: [],
}

export default config
