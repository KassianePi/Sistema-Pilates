import { forwardRef } from 'react'
import type { TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      'flex min-h-[80px] w-full rounded-md border border-cinza-medio bg-branco-puro px-3 py-2 text-sm text-cinza-escuro-suave placeholder:text-cinza-medio focus:outline-none focus:ring-2 focus:ring-lilas-medio disabled:cursor-not-allowed disabled:opacity-50 resize-none',
      className,
    )}
    {...props}
  />
))

Textarea.displayName = 'Textarea'
