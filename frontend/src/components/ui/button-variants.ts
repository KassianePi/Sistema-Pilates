import { cva } from 'class-variance-authority'

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lilas-medio disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-rosa-vibrante text-branco-puro hover:opacity-90 active:scale-[0.98]',
        secondary: 'bg-roxo-profundo text-branco-puro hover:opacity-90 active:scale-[0.98]',
        outline: 'border border-cinza-medio bg-branco-puro text-cinza-escuro-suave hover:bg-bege-suave',
        ghost: 'text-cinza-texto hover:bg-bege-suave hover:text-cinza-forte',
        destructive: 'bg-red-600 text-branco-puro hover:bg-red-700',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        default: 'h-10 px-4 py-2',
        lg: 'h-12 px-6 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)
