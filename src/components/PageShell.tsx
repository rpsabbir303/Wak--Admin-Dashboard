import type { PropsWithChildren, ReactNode } from 'react'

import { cn } from '@/lib/utils'

type Props = PropsWithChildren<{
  title: string
  description?: string
  right?: ReactNode
  className?: string
}>

export function PageShell({ title, description, right, className, children }: Props) {
  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-xl font-semibold text-foreground">{title}</div>
          {description && (
            <div className="text-sm text-muted-foreground">{description}</div>
          )}
        </div>
        {right && <div className="flex items-center gap-2">{right}</div>}
      </div>
      {children}
    </div>
  )
}

