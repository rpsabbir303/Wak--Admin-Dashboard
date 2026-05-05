import { motion } from 'framer-motion'

import type { DashboardStatsResponse } from '@/features/dashboard/dashboardApi'
import { DashboardCharts } from '@/features/dashboard/components/DashboardCharts'
import {
  DashboardStatsGrid,
  type DashboardStatItem,
} from '@/features/dashboard/components/DashboardStatsGrid'
import { useGetDashboardStatsQuery } from '@/features/dashboard/dashboardApi'
import { PageShell } from '@/components/PageShell'

function formatMoney(value: number) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(value)
}

function formatNumber(value: number) {
  return new Intl.NumberFormat(undefined).format(value)
}

type DashboardData = {
  totals: { users: number; vendors: number; orders: number; revenue: number }
  meta?: {
    activeDeliveries: number
    pendingApprovals: number
    supportTickets: number
  }
  ordersTrend: Array<{ date: string; orders: number }>
  revenueTrend: Array<{ date: string; revenue: number }>
}

const motionVariants = {
  page: {
    hidden: { opacity: 0, y: 24 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.38, ease: 'easeOut', when: 'beforeChildren', staggerChildren: 0.06 },
    },
  },
  container: {
    hidden: {},
    show: { transition: { staggerChildren: 0.06 } },
  },
  statsItem: {
    hidden: { opacity: 0, scale: 0.97 },
    show: { opacity: 1, scale: 1, transition: { duration: 0.35, ease: 'easeOut' } },
  },
  sectionItem: {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.36, ease: 'easeOut' } },
  },
} as const

type ApiDashboard = DashboardStatsResponse &
  Partial<Pick<DashboardData, 'meta'>> & { supportTickets?: number }

function buildDashboardView(d: ApiDashboard | undefined): DashboardData {
  const fallback: DashboardData = {
    totals: { users: 1245, vendors: 320, orders: 2890, revenue: 24500 },
    meta: { activeDeliveries: 48, pendingApprovals: 12, supportTickets: 6 },
    ordersTrend: [
      { date: 'Mon', orders: 12 },
      { date: 'Tue', orders: 18 },
      { date: 'Wed', orders: 9 },
      { date: 'Thu', orders: 22 },
      { date: 'Fri', orders: 16 },
      { date: 'Sat', orders: 28 },
      { date: 'Sun', orders: 19 },
    ],
    revenueTrend: [
      { date: 'Mon', revenue: 1200 },
      { date: 'Tue', revenue: 1800 },
      { date: 'Wed', revenue: 900 },
      { date: 'Thu', revenue: 2400 },
      { date: 'Fri', revenue: 1600 },
      { date: 'Sat', revenue: 3100 },
      { date: 'Sun', revenue: 2200 },
    ],
  }

  if (!d) return fallback

  const meta = d.meta ?? {
    activeDeliveries: d.activeDeliveries?.length ?? 0,
    pendingApprovals: d.pendingVendors?.length ?? 0,
    supportTickets: typeof d.supportTickets === 'number' ? d.supportTickets : 0,
  }

  return {
    totals: d.totals,
    meta,
    ordersTrend: d.ordersTrend?.length ? d.ordersTrend : fallback.ordersTrend,
    revenueTrend: d.revenueTrend?.length ? d.revenueTrend : fallback.revenueTrend,
  }
}

export default function DashboardPage() {
  const { data, isLoading } = useGetDashboardStatsQuery()

  const safe = buildDashboardView(data as ApiDashboard | undefined)

  const totals = safe.totals
  const meta = safe.meta ?? {
    activeDeliveries: 0,
    pendingApprovals: 0,
    supportTickets: 0,
  }

  const statItems: DashboardStatItem[] = [
    {
      label: 'Total Users',
      value: totals.users,
      format: (v) => formatNumber(v),
      href: '/users',
    },
    {
      label: 'Total Vendors',
      value: totals.vendors,
      format: (v) => formatNumber(v),
      href: '/admin/vendors',
    },
    {
      label: 'Total Orders',
      value: totals.orders,
      format: (v) => formatNumber(v),
      href: '/orders',
    },
    {
      label: 'Total Revenue',
      value: totals.revenue,
      format: (v) => formatMoney(v),
      href: '/analytics',
    },
    {
      label: 'Active Deliveries',
      value: meta.activeDeliveries,
      format: (v) => formatNumber(v),
      href: '/delivery',
    },
    {
      label: 'Pending Approvals',
      value: meta.pendingApprovals,
      format: (v) => formatNumber(v),
      href: '/admin/vendors',
    },
    {
      label: 'Support Tickets',
      value: meta.supportTickets,
      format: (v) => formatNumber(v),
      href: '/support',
    },
  ]

  return (
    <PageShell
      title="Dashboard"
      description="High-level metrics and analytics for the platform."
    >
      <motion.div
        initial="hidden"
        animate="show"
        variants={motionVariants.page}
        className="space-y-5"
      >
        <DashboardStatsGrid
          items={statItems}
          isLoading={isLoading}
          variants={{ container: motionVariants.container, statsItem: motionVariants.statsItem }}
        />

        <DashboardCharts
          ordersTrend={safe.ordersTrend}
          revenueTrend={safe.revenueTrend}
          sectionItemVariant={motionVariants.sectionItem}
          formatMoney={formatMoney}
        />
      </motion.div>
    </PageShell>
  )
}
