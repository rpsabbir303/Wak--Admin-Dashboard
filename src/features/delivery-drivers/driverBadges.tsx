import type { ComponentProps } from 'react'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { DriverAccountStatus, DriverLiveStatus, VehicleType } from '@/features/delivery-drivers/types'

export function AccountStatusBadge({ status }: { status: DriverAccountStatus }) {
  const map: Record<DriverAccountStatus, { label: string; variant: ComponentProps<typeof Badge>['variant'] }> = {
    active: { label: 'Active', variant: 'success' },
    pending: { label: 'Pending', variant: 'warning' },
    suspended: { label: 'Suspended', variant: 'secondary' },
    blocked: { label: 'Blocked', variant: 'danger' },
    rejected: { label: 'Rejected', variant: 'danger' },
  }
  const m = map[status]
  return <Badge variant={m.variant}>{m.label}</Badge>
}

export function LiveStatusBadge({ status }: { status: DriverLiveStatus }) {
  const label =
    status === 'online'
      ? 'Online'
      : status === 'offline'
        ? 'Offline'
        : status === 'delivering'
          ? 'Delivering'
          : 'Idle'
  const cls =
    status === 'online'
      ? 'bg-emerald-500/15 text-emerald-800 border-emerald-500/25'
      : status === 'offline'
        ? 'bg-black/[0.06] text-muted-foreground border-black/10'
        : status === 'delivering'
          ? 'bg-primary/15 text-primary border-primary/25'
          : 'bg-amber-500/15 text-amber-900 border-amber-500/25'
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        cls,
      )}
    >
      {label}
    </span>
  )
}

export function VehicleTypeBadge({ type }: { type: VehicleType }) {
  return <Badge variant="secondary">{type}</Badge>
}

export function StarRow({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const full = Math.floor(rating)
  const half = rating - full >= 0.5
  const dim = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating.toFixed(1)} stars`}>
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i < full || (i === full && half)
        return (
          <svg
            key={i}
            viewBox="0 0 24 24"
            className={cn(dim, filled ? 'text-primary' : 'text-black/15')}
            fill="currentColor"
            aria-hidden
          >
            <path d="M12 3.5l2.6 5.3 5.8.8-4.2 4.1 1 5.7L12 16.9 6.9 19.4l1-5.7-4.2-4.1 5.8-.8L12 3.5z" />
          </svg>
        )
      })}
      <span className="ml-1 text-xs font-medium text-muted-foreground">{rating.toFixed(1)}</span>
    </div>
  )
}
