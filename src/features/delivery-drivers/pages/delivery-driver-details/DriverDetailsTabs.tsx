import { useId, useMemo, useState, type ComponentProps } from 'react'
import { motion } from 'framer-motion'
import {
  Area,
  AreaChart,
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
import { Check, Download } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StarRow } from '@/features/delivery-drivers/driverBadges'
import type {
  DeliveryDriverDetail,
  DeliveryRowStatus,
  DocumentVerificationStatus,
} from '@/features/delivery-drivers/types'
import { cn } from '@/lib/utils'

const CHART = '#895129'

function formatMoney(value: number) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(value)
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase()
}

function deliveryBadgeVariant(s: DeliveryRowStatus): ComponentProps<typeof Badge>['variant'] {
  if (s === 'completed') return 'success'
  if (s === 'in_transit') return 'warning'
  if (s === 'cancelled' || s === 'failed') return 'danger'
  return 'secondary'
}

const MotionRow = motion(TableRow)

const TAB_IDS = new Set(['overview', 'earnings', 'deliveries', 'reviews', 'documents', 'activity'])

type Props = {
  driver: DeliveryDriverDetail
  initialTab?: string
  onDownloadEarningsReport: () => void
  onDownloadDeliveriesExport: () => void
}

export function DriverDetailsTabs({
  driver,
  initialTab,
  onDownloadEarningsReport,
  onDownloadDeliveriesExport,
}: Props) {
  const chartUid = useId().replace(/:/g, '')
  const [tab, setTab] = useState(() =>
    initialTab && TAB_IDS.has(initialTab) ? initialTab : 'overview',
  )
  const [docOverrides, setDocOverrides] = useState<Record<string, DocumentVerificationStatus>>({})
  const docs = useMemo(
    () => driver.documentsDetail.map((d) => ({ ...d, status: docOverrides[d.id] ?? d.status })),
    [driver.documentsDetail, docOverrides],
  )

  const [delQ, setDelQ] = useState('')
  const [delStatus, setDelStatus] = useState<DeliveryRowStatus | 'all'>('all')
  const [delPage, setDelPage] = useState(1)
  const pageSize = 8

  const filteredDeliveries = useMemo(() => {
    const q = delQ.trim().toLowerCase()
    return driver.deliveries.filter((d) => {
      const ok =
        !q ||
        d.id.toLowerCase().includes(q) ||
        d.customer.toLowerCase().includes(q) ||
        d.vendor.toLowerCase().includes(q) ||
        d.pickup.toLowerCase().includes(q) ||
        d.dropoff.toLowerCase().includes(q)
      const st = delStatus === 'all' || d.status === delStatus
      return ok && st
    })
  }, [driver.deliveries, delQ, delStatus])

  const delPages = Math.max(1, Math.ceil(filteredDeliveries.length / pageSize))
  const delSlice = filteredDeliveries.slice((delPage - 1) * pageSize, delPage * pageSize)

  const successRate = useMemo(() => {
    const d = driver.completedOrders + driver.cancelledOrders
    if (d <= 0) return 0
    return Math.round((driver.completedOrders / d) * 1000) / 10
  }, [driver.completedOrders, driver.cancelledOrders])

  const ratingBuckets = useMemo(() => {
    const m: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    for (const r of driver.reviews) {
      const k = Math.min(5, Math.max(1, Math.round(r.rating)))
      m[k] += 1
    }
    return [5, 4, 3, 2, 1].map((star) => ({ star: `${star}★`, count: m[star] ?? 0 }))
  }, [driver.reviews])

  return (
    <Tabs value={tab} onValueChange={setTab} className="w-full">
      <TabsList className="mb-4 flex h-auto w-full flex-wrap justify-start gap-1 rounded-xl bg-muted/70 p-1.5">
        {(
          [
            ['overview', 'Overview'],
            ['earnings', 'Earnings'],
            ['deliveries', 'Deliveries'],
            ['reviews', 'Reviews'],
            ['documents', 'Documents'],
            ['activity', 'Activity logs'],
          ] as const
        ).map(([value, label]) => (
          <TabsTrigger key={value} value={value} className="rounded-lg px-3 py-2 text-sm">
            {label}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="overview" className="mt-0 space-y-4">
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="rounded-xl border-black/10 shadow-soft lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                <span className="font-medium text-foreground">{driver.name}</span> · {driver.assignedRegion} · Success{' '}
                <span className="text-primary font-medium">{successRate}%</span>
              </p>
              <p>Wallet {formatMoney(driver.walletBalance)} · Avg {driver.avgDeliveryMinutes || '—'} min</p>
            </CardContent>
          </Card>
          <Card className="rounded-xl border-black/10 shadow-soft">
            <CardHeader>
              <CardTitle className="text-base">Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="h-2 overflow-hidden rounded-full bg-black/10">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${driver.profileCompletion}%` }}
                  className="h-full rounded-full bg-primary"
                  transition={{ duration: 0.5 }}
                />
              </div>
              <div className="text-xl font-semibold text-primary">{driver.profileCompletion}%</div>
              <ul className="space-y-1 text-sm">
                <li className="flex gap-2">
                  <Check className={cn('h-4 w-4', driver.verificationSummary.identity ? 'text-emerald-600' : 'opacity-30')} />
                  Identity
                </li>
                <li className="flex gap-2">
                  <Check className={cn('h-4 w-4', driver.verificationSummary.vehicle ? 'text-emerald-600' : 'opacity-30')} />
                  Vehicle
                </li>
                <li className="flex gap-2">
                  <Check className={cn('h-4 w-4', driver.verificationSummary.insurance ? 'text-emerald-600' : 'opacity-30')} />
                  Insurance
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
        {driver.currentDelivery && (
          <Card className="rounded-xl border-primary/25 bg-primary/[0.04]">
            <CardHeader>
              <CardTitle className="text-base text-primary">Active delivery</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <div className="font-semibold">{driver.currentDelivery.orderId}</div>
              <div className="text-muted-foreground">
                {driver.currentDelivery.pickup} → {driver.currentDelivery.dropoff}
              </div>
            </CardContent>
          </Card>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="rounded-xl border-black/10 shadow-soft">
            <CardHeader>
              <CardTitle className="text-base">Weekly activity</CardTitle>
            </CardHeader>
            <CardContent className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={driver.activityHeatmap}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#0000000d" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis width={32} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="deliveries" fill={CHART} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="rounded-xl border-black/10 shadow-soft">
            <CardHeader>
              <CardTitle className="text-base">Satisfaction</CardTitle>
            </CardHeader>
            <CardContent className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={driver.satisfactionSeries}>
                  <defs>
                    <linearGradient id={`${chartUid}-sat`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CHART} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={CHART} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#0000000d" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis domain={[3, 5]} width={28} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="score" stroke={CHART} fill={`url(#${chartUid}-sat)`} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="earnings" className="mt-0 space-y-4">
        <div className="flex flex-wrap justify-between gap-2">
          <p className="text-sm text-muted-foreground">Earnings & payouts (demo)</p>
          <Button variant="outline" size="sm" className="rounded-xl" onClick={onDownloadEarningsReport}>
            <Download className="h-4 w-4" />
            Download report
          </Button>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="rounded-xl border-black/10 shadow-soft lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Weekly earnings</CardTitle>
            </CardHeader>
            <CardContent className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={driver.weeklyEarningsSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#0000000d" />
                  <XAxis dataKey="label" />
                  <YAxis width={44} />
                  <Tooltip />
                  <Line type="monotone" dataKey="amount" stroke={CHART} strokeWidth={2} dot={{ fill: CHART }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="rounded-xl border-black/10 shadow-soft">
            <CardHeader>
              <CardTitle className="text-base">Monthly</CardTitle>
            </CardHeader>
            <CardContent className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={driver.monthlyEarningsFull}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#0000000d" />
                  <XAxis dataKey="label" interval={0} angle={-30} textAnchor="end" height={48} tick={{ fontSize: 10 }} />
                  <YAxis width={40} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="amount" fill={CHART} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="rounded-xl border-black/10 shadow-soft">
            <CardHeader>
              <CardTitle className="text-base">Yearly</CardTitle>
            </CardHeader>
            <CardContent className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={driver.yearlyEarningsSeries}>
                  <defs>
                    <linearGradient id={`${chartUid}-yr`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CHART} stopOpacity={0.4} />
                      <stop offset="100%" stopColor={CHART} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#0000000d" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis width={48} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="amount" stroke={CHART} fill={`url(#${chartUid}-yr)`} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="rounded-xl border-black/10 shadow-soft">
            <CardHeader>
              <CardTitle className="text-sm">Payouts</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0 text-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {driver.payouts.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-xs">{p.id}</TableCell>
                      <TableCell className="text-xs">{p.date}</TableCell>
                      <TableCell>{formatMoney(p.amount)}</TableCell>
                      <TableCell>
                        <Badge variant={p.status === 'paid' ? 'success' : 'warning'}>{p.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card className="rounded-xl border-black/10 shadow-soft">
            <CardHeader>
              <CardTitle className="text-sm">Commission</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0 text-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {driver.commissions.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>{c.period}</TableCell>
                      <TableCell>{c.rate}</TableCell>
                      <TableCell>{formatMoney(c.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="deliveries" className="mt-0 space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Input
            placeholder="Search…"
            value={delQ}
            onChange={(e) => {
              setDelQ(e.target.value)
              setDelPage(1)
            }}
            className="max-w-md rounded-xl"
          />
          <div className="flex flex-wrap gap-2">
            <select
              value={delStatus}
              onChange={(e) => {
                setDelStatus(e.target.value as DeliveryRowStatus | 'all')
                setDelPage(1)
              }}
              className="h-10 rounded-xl border border-black/10 bg-white px-3 text-sm"
            >
              <option value="all">All</option>
              <option value="completed">Completed</option>
              <option value="in_transit">In transit</option>
              <option value="cancelled">Cancelled</option>
              <option value="failed">Failed</option>
            </select>
            <Button variant="outline" size="sm" className="rounded-xl" onClick={onDownloadDeliveriesExport}>
              <Download className="h-4 w-4" />
              CSV
            </Button>
          </div>
        </div>
        <Card className="rounded-xl border-black/10 shadow-soft">
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Pickup</TableHead>
                  <TableHead>Dropoff</TableHead>
                  <TableHead>Km</TableHead>
                  <TableHead>Fee</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {delSlice.map((row) => (
                  <MotionRow key={row.id} whileHover={{ backgroundColor: 'rgba(137,81,41,0.06)' }}>
                    <TableCell className="font-mono text-xs whitespace-nowrap">{row.id}</TableCell>
                    <TableCell>{row.customer}</TableCell>
                    <TableCell className="max-w-[120px] truncate text-muted-foreground">{row.vendor}</TableCell>
                    <TableCell className="max-w-[140px] truncate text-xs">{row.pickup}</TableCell>
                    <TableCell className="max-w-[140px] truncate text-xs">{row.dropoff}</TableCell>
                    <TableCell>{row.distanceKm.toFixed(1)}</TableCell>
                    <TableCell>{formatMoney(row.deliveryFee)}</TableCell>
                    <TableCell>
                      <Badge variant={deliveryBadgeVariant(row.status)} className="capitalize">
                        {row.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{row.date}</TableCell>
                  </MotionRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>
            Page {delPage} / {delPages}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={delPage <= 1} onClick={() => setDelPage((p) => p - 1)}>
              Prev
            </Button>
            <Button variant="outline" size="sm" disabled={delPage >= delPages} onClick={() => setDelPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="reviews" className="mt-0 space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="rounded-xl border-black/10 shadow-soft">
            <CardHeader>
              <CardTitle className="text-sm">Average</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold text-primary">
                {driver.ratingCount ? driver.rating.toFixed(2) : '—'}
              </div>
              {driver.ratingCount > 0 && <StarRow rating={driver.rating} />}
            </CardContent>
          </Card>
          <Card className="rounded-xl border-black/10 shadow-soft md:col-span-2">
            <CardHeader>
              <CardTitle className="text-sm">Distribution</CardTitle>
            </CardHeader>
            <CardContent className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ratingBuckets} layout="vertical" margin={{ left: 4 }}>
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="star" width={40} />
                  <Tooltip />
                  <Bar dataKey="count" fill={CHART} radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {driver.reviews.map((r) => (
            <Card key={r.id} className="rounded-xl border-black/10 shadow-soft">
              <CardContent className="flex gap-3 pt-4">
                <Avatar>
                  <AvatarImage src={r.customerAvatar} alt="" />
                  <AvatarFallback>{getInitials(r.customerName)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1 space-y-1 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{r.customerName}</span>
                    <StarRow rating={r.rating} />
                  </div>
                  <p className="text-muted-foreground">{r.text}</p>
                  <p className="text-xs text-primary">{r.orderId}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="documents" className="mt-0">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {docs.map((doc) => (
            <Card key={doc.id} className="overflow-hidden rounded-xl border-black/10 shadow-soft">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 py-3">
                <CardTitle className="text-sm font-medium">{doc.label}</CardTitle>
                <Badge variant={doc.status === 'approved' ? 'success' : doc.status === 'rejected' ? 'danger' : 'warning'}>
                  {doc.status}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-3 p-0">
                <div className="aspect-[16/10] bg-muted">
                  <img src={doc.previewUrl} alt="" className="h-full w-full object-cover" />
                </div>
                <div className="flex gap-2 px-4 pb-4">
                  <Button
                    size="sm"
                    className="bg-[#895129] hover:bg-[#895129]/90"
                    disabled={doc.status === 'approved'}
                    onClick={() => setDocOverrides((o) => ({ ...o, [doc.id]: 'approved' }))}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={doc.status === 'rejected'}
                    onClick={() => setDocOverrides((o) => ({ ...o, [doc.id]: 'rejected' }))}
                  >
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="activity" className="mt-0">
        <Card className="rounded-xl border-black/10 shadow-soft">
          <CardContent className="p-6">
            <ul className="space-y-4">
              {driver.activityLogs.map((log, idx) => (
                <motion.li
                  key={log.id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="rounded-xl border border-black/10 bg-white px-4 py-3 text-sm shadow-sm"
                >
                  <div className="flex justify-between gap-2">
                    <span className="font-medium">{log.title}</span>
                    <span className="text-xs text-muted-foreground">{log.at}</span>
                  </div>
                  <p className="text-muted-foreground">{log.detail}</p>
                  <Badge variant="secondary" className="mt-1 capitalize">
                    {log.category}
                  </Badge>
                </motion.li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
