import { useEffect, useState } from 'react'
import { animate, motion, useMotionValue } from 'framer-motion'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Link } from 'react-router-dom'

import { useGetDashboardStatsQuery } from '@/features/dashboard/dashboardApi'
import { PageShell } from '@/components/PageShell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { BadgeProps } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

function formatMoney(value: number) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(value)
}

function formatNumber(value: number) {
  return new Intl.NumberFormat(undefined).format(value)
}

function CountUp({
  value,
  format = (v) => formatNumber(v),
  duration = 0.55,
}: {
  value: number
  format?: (value: number) => string
  duration?: number
}) {
  const mv = useMotionValue(0)
  const [display, setDisplay] = useState(format(0))

  useEffect(() => {
    const controls = animate(mv, value, { duration, ease: 'easeOut' })
    const unsub = mv.on('change', (latest) => setDisplay(format(Math.round(latest))))
    return () => {
      controls.stop()
      unsub()
    }
  }, [duration, format, mv, value])

  return <span>{display}</span>
}

type OrderStatus = 'pending' | 'paid' | 'fulfilled' | 'cancelled'
type DeliveryStatus = 'Ongoing' | 'Pickup' | 'En route'

type DashboardVendor = {
  id: string
  businessName: string
  owner: string
  country: string
}

type DashboardOrder = {
  id: string
  status: OrderStatus
  amount: number
}

type DashboardDelivery = {
  id: string
  orderId: string
  driver: string
  eta: string
  status: DeliveryStatus
}

type ActivityItem = {
  id: string
  title: string
  meta: string
  href: string
}

type DashboardData = {
  totals: { users: number; vendors: number; orders: number; revenue: number }
  meta?: { activeDeliveries: number; pendingApprovals: number; supportTickets: number }
  ordersTrend: Array<{ date: string; orders: number }>
  revenueTrend: Array<{ date: string; revenue: number }>
  pendingVendors: DashboardVendor[]
  recentOrders: DashboardOrder[]
  activeDeliveries: DashboardDelivery[]
  activity?: ActivityItem[]
}

const MotionTableRow = motion(TableRow)
const MotionTableBody = motion(TableBody)
const MotionLink = motion(Link)

const motionVariants = {
  page: {
    hidden: { opacity: 0, y: 30 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: 'easeOut', when: 'beforeChildren', staggerChildren: 0.08 },
    },
  },
  container: {
    hidden: {},
    show: { transition: { staggerChildren: 0.08 } },
  },
  statsItem: {
    hidden: { opacity: 0, scale: 0.95 },
    show: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: 'easeOut' } },
  },
  sectionItem: {
    hidden: { opacity: 0, scale: 0.98 },
    show: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: 'easeOut', delay: 0.2 } },
  },
  tableContainer: {
    hidden: {},
    show: { transition: { staggerChildren: 0.06 } },
  },
  tableRow: {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  },
  feedContainer: {
    hidden: {},
    show: { transition: { staggerChildren: 0.07 } },
  },
  feedItem: {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  },
} as const

type DashboardStatItem = {
  kind: 'stat'
  label: string
  value: number
  format: (value: number) => string
  href: string
}

type DashboardQuickActionsItem = { kind: 'quick_actions' }

export default function DashboardPage() {
  const { data, isLoading, isError } = useGetDashboardStatsQuery()
  const [approvedVendorIds, setApprovedVendorIds] = useState<Set<string>>(() => new Set())

  const safe: DashboardData = (data as DashboardData | undefined) ?? {
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
    pendingVendors: Array.from({ length: 12 }).map((_, i) => ({
      id: String(1000 + i),
      businessName: ['Brown Barrel Foods', 'Cedar & Co', 'Golden Grain', 'Olive Street Market'][i % 4],
      owner: ['Amina Rahman', 'James Carter', 'Nusrat Jahan', 'Daniel Lee'][i % 4],
      country: ['BD', 'US', 'AE', 'UK'][i % 4],
    })),
    recentOrders: [
      { id: '28901', status: 'paid', amount: 129.5 },
      { id: '28902', status: 'pending', amount: 48.75 },
      { id: '28903', status: 'fulfilled', amount: 220.0 },
      { id: '28904', status: 'paid', amount: 78.25 },
      { id: '28905', status: 'cancelled', amount: 32.0 },
      { id: '28906', status: 'pending', amount: 156.0 },
    ],
    activeDeliveries: Array.from({ length: 48 }).map((_, i) => ({
      id: String(7400 + i),
      orderId: String(28950 + i),
      driver: ['Sabbir', 'Mim', 'Rafi', 'Nadia', 'Hasan'][i % 5],
      eta: `${18 + (i % 25)}m`,
      status: (['Ongoing', 'Pickup', 'En route'] as const)[i % 3] as DeliveryStatus,
    })),
    activity: [
      { id: 'a1', title: 'New vendor submitted documents', meta: '2m ago', href: '/vendors' },
      { id: 'a2', title: 'Refund requested for Order #28905', meta: '18m ago', href: '/orders' },
      { id: 'a3', title: 'New support ticket created', meta: '42m ago', href: '/support' },
      { id: 'a4', title: 'Payout processed for Vendor #1042', meta: '1h ago', href: '/payouts' },
      { id: 'a5', title: 'Delivery status updated: En route', meta: '2h ago', href: '/delivery' },
    ],
  }

  const totals = safe.totals
  const meta = safe.meta ?? {
    activeDeliveries: safe.activeDeliveries.length,
    pendingApprovals: safe.pendingVendors.length,
    supportTickets: 0,
  }
  const visiblePendingVendors = safe.pendingVendors.filter((v) => !approvedVendorIds.has(v.id))

  return (
    <PageShell
      title="Dashboard"
      description="Overview of platform health, approvals, orders, and delivery activity."
      right={
        <div className="flex items-center gap-2">
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button variant="outline">Export</Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button>View reports</Button>
          </motion.div>
        </div>
      }
    >
      {isError && (
        <div className="rounded-lg border border-black/10 bg-white p-4 text-sm text-muted-foreground shadow-soft">
          Using placeholder data (API not reachable).
        </div>
      )}

      <motion.div
        initial="hidden"
        animate="show"
        variants={motionVariants.page}
        className="space-y-4"
      >
        <motion.div variants={motionVariants.container} className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {(
            [
              {
                kind: 'stat',
                label: 'Total Users',
                value: totals.users,
                format: (v: number) => formatNumber(v),
                href: '/users',
              },
              {
                kind: 'stat',
                label: 'Total Vendors',
                value: totals.vendors,
                format: (v: number) => formatNumber(v),
                href: '/vendors',
              },
              {
                kind: 'stat',
                label: 'Total Orders',
                value: totals.orders,
                format: (v: number) => formatNumber(v),
                href: '/orders',
              },
              { kind: 'quick_actions' },
              {
                kind: 'stat',
                label: 'Total Revenue',
                value: totals.revenue,
                format: (v: number) => formatMoney(v),
                href: '/analytics',
              },
              {
                kind: 'stat',
                label: 'Active Deliveries',
                value: meta.activeDeliveries,
                format: (v: number) => formatNumber(v),
                href: '/delivery',
              },
              {
                kind: 'stat',
                label: 'Pending Approvals',
                value: meta.pendingApprovals,
                format: (v: number) => formatNumber(v),
                href: '/vendors',
              },
              {
                kind: 'stat',
                label: 'Support Tickets',
                value: meta.supportTickets,
                format: (v: number) => formatNumber(v),
                href: '/support',
              },
            ] satisfies Array<DashboardStatItem | DashboardQuickActionsItem>
          ).map((item) =>
            item.kind === 'quick_actions' ? (
              <motion.div
                key="quick-actions"
                variants={motionVariants.statsItem}
                whileHover={{ y: -4 }}
                transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              >
                <Card className="transition-shadow hover:shadow-lg">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Quick actions</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-2">
                    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                      <Button asChild size="sm" className="w-full">
                        <Link to="/products">Add Product</Link>
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                      <Button asChild size="sm" className="w-full">
                        <Link to="/services">Add Service</Link>
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                      <Button asChild size="sm" className="w-full">
                        <Link to="/vendors">Add Vendor</Link>
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                      <Button asChild size="sm" variant="outline" className="w-full">
                        <Link to="/orders">View Orders</Link>
                      </Button>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
            <motion.div
              key={item.label}
              variants={motionVariants.statsItem}
              whileHover={{ y: -4 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            >
              <Link to={item.href} className="block">
                <Card className="transition-shadow hover:shadow-lg">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">{item.label}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-semibold text-foreground">
                      {isLoading ? (
                        <div className="h-7 w-24 animate-pulse rounded-md bg-black/5" />
                      ) : (
                        <CountUp value={item.value} format={item.format} />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
            ),
          )}
        </motion.div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <motion.div variants={motionVariants.sectionItem}>
            <Card className="transition-shadow hover:shadow-lg">
              <CardHeader>
                <CardTitle>Orders trend</CardTitle>
              </CardHeader>
              <CardContent className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={safe.ordersTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="orders"
                      stroke="#895129"
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive
                      animationDuration={450}
                      animationBegin={120}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={motionVariants.sectionItem}>
            <Card className="transition-shadow hover:shadow-lg">
              <CardHeader>
                <CardTitle>Revenue</CardTitle>
              </CardHeader>
              <CardContent className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={safe.revenueTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} />
                    <Tooltip formatter={(v) => formatMoney(Number(v))} />
                    <Bar
                      dataKey="revenue"
                      fill="#895129"
                      radius={[6, 6, 0, 0]}
                      isAnimationActive
                      animationDuration={500}
                      animationBegin={200}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <motion.div variants={motionVariants.sectionItem} className="xl:col-span-1">
            <Card className="transition-shadow hover:shadow-lg">
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Pending vendor approvals</CardTitle>
                <div className="flex items-center gap-2">
                  <Button asChild size="sm" variant="ghost" className="h-8 px-2 text-muted-foreground hover:text-foreground">
                    <Link to="/vendors">View all</Link>
                  </Button>
                  <Badge variant="secondary">{meta.pendingApprovals}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {visiblePendingVendors.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No pending vendors.</div>
                ) : (
                  <div className="space-y-3">
                    {visiblePendingVendors.slice(0, 5).map((v) => (
                      <div key={v.id} className="rounded-lg border border-black/10 p-3 transition-shadow hover:shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-medium">{v.businessName}</div>
                            <div className="text-xs text-muted-foreground">
                              {v.owner} • {v.country}
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                              <Button
                                size="sm"
                                className="h-8 bg-primary px-3 text-white hover:bg-primary/90"
                                onClick={() =>
                                  setApprovedVendorIds((prev) => {
                                    const next = new Set(prev)
                                    next.add(v.id)
                                    return next
                                  })
                                }
                              >
                                Approve
                              </Button>
                            </motion.div>
                            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                              <Button asChild size="sm" variant="outline" className="h-8 px-3">
                                <Link to="/vendors">View</Link>
                              </Button>
                            </motion.div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={motionVariants.sectionItem} className="xl:col-span-1">
            <Card className="transition-shadow hover:shadow-lg">
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Recent orders</CardTitle>
                <div className="flex items-center gap-2">
                  <Button asChild size="sm" variant="ghost" className="h-8 px-2 text-muted-foreground hover:text-foreground">
                    <Link to="/orders">View all</Link>
                  </Button>
                  <Badge variant="secondary">{safe.recentOrders.length}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <MotionTableBody initial="hidden" animate="show" variants={motionVariants.tableContainer}>
                    {safe.recentOrders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-muted-foreground">
                          No recent orders.
                        </TableCell>
                      </TableRow>
                    ) : (
                      safe.recentOrders.slice(0, 6).map((o) => {
                        const badgeVariant: BadgeProps['variant'] =
                          o.status === 'pending'
                            ? 'warning'
                            : o.status === 'paid' || o.status === 'fulfilled'
                              ? 'success'
                              : o.status === 'cancelled'
                                ? 'danger'
                                : 'secondary'

                        return (
                          <MotionTableRow key={o.id} variants={motionVariants.tableRow}>
                            <TableCell className="font-medium">#{o.id}</TableCell>
                            <TableCell>
                              <Badge variant={badgeVariant} className="capitalize">
                                {o.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">{formatMoney(o.amount)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                                  <Button asChild size="sm" variant="outline" className="h-8 px-3">
                                    <Link to="/orders">View details</Link>
                                  </Button>
                                </motion.div>
                                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                                  <Button asChild size="sm" variant="ghost" className="h-8 px-2">
                                    <Link to="/orders">Open order</Link>
                                  </Button>
                                </motion.div>
                              </div>
                            </TableCell>
                          </MotionTableRow>
                        )
                      })
                    )}
                  </MotionTableBody>
                </Table>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={motionVariants.sectionItem} className="xl:col-span-1">
            <Card className="transition-shadow hover:shadow-lg">
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Activity feed</CardTitle>
                <div className="flex items-center gap-2">
                  <Button asChild size="sm" variant="ghost" className="h-8 px-2 text-muted-foreground hover:text-foreground">
                    <Link to="/analytics">View all</Link>
                  </Button>
                  <Badge variant="secondary">{safe.activity?.length ?? 0}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <motion.div variants={motionVariants.feedContainer} initial="hidden" animate="show" className="space-y-3">
                  {(safe.activity ?? []).slice(0, 6).map((a) => (
                    <MotionLink
                      key={a.id}
                      to={a.href}
                      variants={motionVariants.feedItem}
                      className="flex items-start justify-between gap-3 rounded-lg border border-black/10 p-3 transition-colors hover:bg-black/[0.02]"
                    >
                      <div className="text-sm font-medium">{a.title}</div>
                      <div className="shrink-0 text-xs text-muted-foreground">{a.meta}</div>
                    </MotionLink>
                  ))}
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div variants={motionVariants.sectionItem}>
          <Card className="transition-shadow hover:shadow-lg">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Active deliveries</CardTitle>
              <Badge variant="secondary">{meta.activeDeliveries}</Badge>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {safe.activeDeliveries.slice(0, 6).map((d) => (
                <div key={d.id} className="rounded-lg border border-black/10 p-3 transition-shadow hover:shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">Delivery #{d.id}</div>
                    <Badge
                      variant="secondary"
                      className={cn(
                        d.status === 'Ongoing' && 'bg-primary/10 text-primary',
                        d.status === 'Ongoing' && 'transition-colors',
                        d.status === 'Ongoing' && 'relative',
                      )}
                    >
                      <span className={cn(d.status === 'Ongoing' && 'animate-pulse')}>{d.status}</span>
                    </Badge>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Order #{d.orderId} • {d.driver} • ETA {d.eta}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </PageShell>
  )
}

