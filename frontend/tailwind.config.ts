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
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
