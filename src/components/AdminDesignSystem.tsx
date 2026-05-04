import type { ComponentProps, ReactNode } from 'react'

import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TableRow } from '@/components/ui/table'

export function AdminCard({ className, ...props }: ComponentProps<typeof Card>) {
  return (
    <Card
      className={cn(
        'rounded-2xl border border-[rgba(137,81,41,0.12)] bg-white shadow-[0_2px_10px_rgba(137,81,41,0.06)]',
        className,
      )}
      {...props}
    />
  )
}

export function AdminBadge({ className, ...props }: ComponentProps<typeof Badge>) {
  return <Badge className={cn('font-medium', className)} {...props} />
}

export function AdminActionButton({
  className,
  variant = 'outline',
  ...props
}: ComponentProps<typeof Button>) {
  return (
    <Button
      variant={variant}
      className={cn('rounded-xl transition-all duration-200', className)}
      {...props}
    />
  )
}

export function AdminTableRow({ className, ...props }: ComponentProps<typeof TableRow>) {
  return (
    <TableRow
      className={cn('border-b border-[#F3ECE5] hover:border-primary/20 hover:bg-[#faf7f3]', className)}
      {...props}
    />
  )
}

export function AdminTable({ children }: { children: ReactNode }) {
  return <div className="admin-table-scroll w-full overflow-x-auto">{children}</div>
}
