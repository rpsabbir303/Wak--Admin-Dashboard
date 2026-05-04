import type { PropsWithChildren, ReactNode } from 'react'

import { cn } from '@/lib/utils'

export function PageContainer({ className, children }: PropsWithChildren<{ className?: string }>) {
  return (
    <div className={cn('mx-auto w-full max-w-[1440px] space-y-6', className)}>
      {children}
    </div>
  )
}

export function SectionHeader({
  title,
  subtitle,
  actions,
  className,
}: {
  title: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-3 md:flex-row md:items-start md:justify-between', className)}>
      <div className="min-w-0 space-y-1">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">{title}</h1>
        {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
      {actions ? <ActionGroup className="w-full md:w-auto">{actions}</ActionGroup> : null}
    </div>
  )
}

export function DashboardCard({ className, children }: PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={cn(
        'h-full rounded-2xl border border-[rgba(137,81,41,0.12)] bg-white p-6 shadow-[0_2px_10px_rgba(137,81,41,0.06)] transition-all duration-200 ease-out hover:-translate-y-[1px] hover:shadow-[0_6px_18px_rgba(137,81,41,0.12)]',
        className,
      )}
    >
      <div className="flex h-full flex-col justify-between gap-4">{children}</div>
    </div>
  )
}

export function StatsGrid({ className, children }: PropsWithChildren<{ className?: string }>) {
  return (
    <div className={cn('grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4', className)}>
      {children}
    </div>
  )
}

export function TableWrapper({ className, children }: PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-[rgba(137,81,41,0.12)] bg-white shadow-[0_2px_10px_rgba(137,81,41,0.06)]',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function ActionGroup({ className, children }: PropsWithChildren<{ className?: string }>) {
  return (
    <div className={cn('flex w-full flex-wrap items-center gap-2 md:w-auto md:justify-end', className)}>
      {children}
    </div>
  )
}

export function EmptyState({
  title,
  subtitle,
  className,
}: {
  title: ReactNode
  subtitle?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('rounded-2xl border border-[rgba(137,81,41,0.12)] bg-[#faf7f3] px-6 py-10 text-center', className)}>
      <div className="text-sm font-medium text-foreground">{title}</div>
      {subtitle ? <div className="mt-1 text-sm text-muted-foreground">{subtitle}</div> : null}
    </div>
  )
}
