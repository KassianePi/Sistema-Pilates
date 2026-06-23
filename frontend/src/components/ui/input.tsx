import { forwardRef } from 'react'
import type { InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type InputProps = InputHTMLAttributes<HTMLInputElement>

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(
        'flex h-10 w-full rounded-md border border-cinza-medio bg-branco-puro px-3 py-2 text-sm text-cinza-escuro-suave placeholder:text-cinza-medio',
        'focus:outline-none focus:ring-2 focus:ring-lilas-medio focus:border-transparent',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'transition-colors',
        className,
      )}
      {...props}
    />
  )
})

Input.displayName = 'Input'
