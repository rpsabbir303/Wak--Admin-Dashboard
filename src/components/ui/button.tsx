import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#89512920] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-[#895129] text-white hover:bg-[#77411f]',
        secondary: 'border border-[#89512930] bg-white text-foreground hover:bg-[#faf7f3]',
        outline:
          'border border-[#DCCBBC] bg-white text-foreground shadow-none rounded-xl hover:border-[#895129] hover:bg-[#faf7f3] hover:text-foreground',
        ghost: 'hover:bg-[#faf7f3] text-foreground',
        destructive: 'border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-10 px-3.5',
        lg: 'h-11 px-6',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }

