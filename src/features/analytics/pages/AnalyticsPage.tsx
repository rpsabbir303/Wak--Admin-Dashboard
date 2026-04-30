import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { io, type Socket } from 'socket.io-client'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { DollarSign, Download, ShoppingCart, Store, Users } from 'lucide-react'

import { PageShell } from '@/components/PageShell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

type RoleFilter = 'all' | 'Customer' | 'Vendor' | 'Driver'

type VendorRow = { name: string; revenue: number; orders: number; rating: number }
type CountrySlice = { name: string; value: number }

const socketUrl =
  import.meta.env.VITE_SOCKET_URL ??
  import.meta.env.VITE_API_BASE_URL ??
  'http://localhost:4000'

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const

const demo = {
  revenue: [1200, 1800, 900, 2400, 1600, 3000, 2200],
  orders: [12, 18, 9, 22, 15, 28, 19],
  usersGrowth: [5, 8, 3, 10, 7, 12, 9],
  topVendors: [
    { name: 'Brown Barrel Foods', revenue: 5200, orders: 148, rating: 4.6 },
    { name: 'Cedar & Co', revenue: 4100, orders: 112, rating: 4.7 },
    { name: 'Golden Grain', revenue: 3500, orders: 96, rating: 4.2 },
  ] satisfies VendorRow[],
  countries: [
    { name: 'USA', value: 45 },
    { name: 'BD', value: 30 },
    { name: 'UK', value: 15 },
    { name: 'AE', value: 10 },
  ] satisfies CountrySlice[],
}

const pieColors = ['#895129', '#111827', '#6b7280', '#d1d5db']

function formatMoney(value: number) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(value)
}

function downloadTextFile(filename: string, text: string, mime = 'text/plain') {
  const blob = new Blob([text], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function safePercent(n: number) {
  const sign = n >= 0 ? '+' : '−'
  const v = Math.abs(n).toFixed(1)
  return `${sign}${v}%`
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-black/5 ${className ?? ''}`} />
}

export default function AnalyticsPage() {
  const [fromDate, setFromDate] = useState('2026-04-24')
  const [toDate, setToDate] = useState('2026-04-30')
  const [role, setRole] = useState<RoleFilter>('all')
  const [selectedCountries, setSelectedCountries] = useState<string[]>([])
  const [selectedVendor, setSelectedVendor] = useState<VendorRow | null>(null)

  const socketRef = useRef<Socket | null>(null)
  const [lastUpdate, setLastUpdate] = useState<string | null>(null)

  const dataset = useMemo(() => {
    // demo: keep 7 days always; filters are stored for future API integration
    return days.map((d, i) => ({
      day: d,
      revenue: demo.revenue[i] ?? 0,
      orders: demo.orders[i] ?? 0,
      users: demo.usersGrowth[i] ?? 0,
    }))
  }, [])

  const countryData = useMemo(() => {
    if (selectedCountries.length === 0) return demo.countries
    return demo.countries.filter((c) => selectedCountries.includes(c.name))
  }, [selectedCountries])

  const vendorData = useMemo(() => {
    // demo: role filter could affect visibility later; for now it keeps all vendors
    void role
    return demo.topVendors
  }, [role])

  const totals = useMemo(() => {
    const totalRevenue = dataset.reduce((sum, r) => sum + r.revenue, 0)
    const totalOrders = dataset.reduce((sum, r) => sum + r.orders, 0)
    const totalUsers = dataset.reduce((sum, r) => sum + r.users, 0)
    const activeVendors = vendorData.length
    return { totalRevenue, totalOrders, totalUsers, activeVendors }
  }, [dataset, vendorData.length])

  const insights = useMemo(() => {
    const peak = [...dataset].sort((a, b) => b.orders - a.orders)[0]
    const highestRevenueDay = [...dataset].sort((a, b) => b.revenue - a.revenue)[0]
    const topVendor = [...vendorData].sort((a, b) => b.revenue - a.revenue)[0]
    const mostActiveCountry = [...demo.countries].sort((a, b) => b.value - a.value)[0]
    return {
      peakOrderTime: peak ? `${peak.day} (demo 6–9 PM)` : '—',
      mostActiveCountry: mostActiveCountry?.name ?? '—',
      highestRevenueDay: highestRevenueDay ? `${highestRevenueDay.day} • ${formatMoney(highestRevenueDay.revenue)}` : '—',
      topVendor: topVendor ? `${topVendor.name} • ${formatMoney(topVendor.revenue)}` : '—',
    }
  }, [dataset, vendorData])

  const isEmpty = dataset.length === 0 || countryData.length === 0 || vendorData.length === 0

  function exportCsv() {
    const rows = [
      ['day', 'revenue', 'orders', 'users'],
      ...dataset.map((r) => [r.day, String(r.revenue), String(r.orders), String(r.users)]),
    ]
    const csv = rows.map((r) => r.map((v) => `"${v.replaceAll('"', '""')}"`).join(',')).join('\n')
    downloadTextFile('analytics_export.csv', csv, 'text/csv')
  }

  function exportPdf() {
    // Lightweight "PDF export" without extra deps: opens print dialog
    const w = window.open('', '_blank', 'noopener,noreferrer,width=860,height=720')
    if (!w) return
    const html = `
      <html>
        <head>
          <title>Analytics export</title>
          <style>
            body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial; padding: 24px; }
            h1 { margin: 0 0 8px; font-size: 18px; }
            .muted { color: #6b7280; font-size: 12px; margin-bottom: 16px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid rgba(0,0,0,0.1); padding: 8px; font-size: 12px; text-align: left; }
            th { background: rgba(0,0,0,0.03); }
          </style>
        </head>
        <body>
          <h1>Analytics export</h1>
          <div class="muted">Date range: ${fromDate} → ${toDate} • Role: ${role} • Countries: ${
            selectedCountries.length ? selectedCountries.join(', ') : 'All'
          }</div>
          <table>
            <thead>
              <tr><th>Day</th><th>Revenue</th><th>Orders</th><th>Users</th></tr>
            </thead>
            <tbody>
              ${dataset
                .map(
                  (r) =>
                    `<tr><td>${r.day}</td><td>${formatMoney(r.revenue)}</td><td>${r.orders}</td><td>${r.users}</td></tr>`,
                )
                .join('')}
            </tbody>
          </table>
        </body>
      </html>
    `
    w.document.open()
    w.document.write(html)
    w.document.close()
    w.focus()
    w.print()
  }

  // Real-time ready hook
  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (!token) return

    const socket: Socket = io(socketUrl, {
      transports: ['websocket'],
      auth: { token },
    })
    socketRef.current = socket

    socket.on('analytics:update', (payload: { at?: string }) => {
      setLastUpdate(payload.at ?? new Date().toISOString())
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [])

  return (
    <PageShell
      title="Analytics"
      description="Revenue growth, orders, vendor performance, and exports."
    >
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-4">
        {/* Cards */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
          className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"
        >
          {[
            {
              label: 'Total Revenue',
              value: formatMoney(totals.totalRevenue),
              growth: safePercent(12.4),
              icon: DollarSign,
            },
            { label: 'Total Orders', value: totals.totalOrders, growth: safePercent(6.1), icon: ShoppingCart },
            { label: 'Total Users', value: totals.totalUsers, growth: safePercent(9.8), icon: Users },
            { label: 'Active Vendors', value: totals.activeVendors, growth: safePercent(2.3), icon: Store },
          ].map((c) => {
            const Icon = c.icon
            return (
              <motion.div
                key={c.label}
                variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } }}
                whileHover={{ scale: 1.02, y: -2 }}
                transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              >
                <Card className="transition-shadow hover:shadow-lg">
                  <CardHeader className="flex-row items-start justify-between pb-2">
                    <div>
                      <CardTitle className="text-sm text-muted-foreground">{c.label}</CardTitle>
                      <div className="mt-2 text-2xl font-semibold text-foreground">{c.value}</div>
                    </div>
                    <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground">
                      <Badge variant="secondary" className="mr-2">
                        {c.growth}
                      </Badge>
                      vs last week
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Filters */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Filters</CardTitle>
            <div className="flex items-center gap-2">
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button variant="outline" onClick={exportCsv}>
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button variant="outline" onClick={exportPdf}>
                  <Download className="h-4 w-4" />
                  Export PDF
                </Button>
              </motion.div>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="grid grid-cols-2 gap-2">
              <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
              <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>

            <select
              multiple
              value={selectedCountries}
              onChange={(e) => {
                const next = Array.from(e.currentTarget.selectedOptions).map((o) => o.value)
                setSelectedCountries(next)
              }}
              className="h-10 min-h-10 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm"
            >
              {demo.countries.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={role}
              onChange={(e) => setRole(e.target.value as RoleFilter)}
              className="h-10 rounded-lg border border-black/10 bg-white px-3 text-sm"
            >
              <option value="all">All roles</option>
              <option value="Customer">Customer</option>
              <option value="Vendor">Vendor</option>
              <option value="Driver">Driver</option>
            </select>

            <div className="md:col-span-3 text-xs text-muted-foreground">
              Tip: hold Ctrl/⌘ to multi-select countries. {lastUpdate ? `Last update: ${lastUpdate}` : 'Real-time ready: analytics:update'}
            </div>
          </CardContent>
        </Card>

        {/* Charts */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.35 }}>
            <Card className="transition-shadow hover:shadow-lg">
              <CardHeader>
                <CardTitle>Revenue (last 7 days)</CardTitle>
              </CardHeader>
              <CardContent className="h-[280px]">
                {isEmpty ? (
                  <Skeleton className="h-[240px] w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dataset}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                      <XAxis dataKey="day" tickLine={false} axisLine={false} />
                      <YAxis tickLine={false} axisLine={false} />
                      <Tooltip formatter={(v) => formatMoney(Number(v))} />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#895129"
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive
                        animationDuration={450}
                        animationBegin={120}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.35, delay: 0.1 }}>
            <Card className="transition-shadow hover:shadow-lg">
              <CardHeader>
                <CardTitle>Orders</CardTitle>
              </CardHeader>
              <CardContent className="h-[280px]">
                {isEmpty ? (
                  <Skeleton className="h-[240px] w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dataset}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                      <XAxis dataKey="day" tickLine={false} axisLine={false} />
                      <YAxis tickLine={false} axisLine={false} />
                      <Tooltip />
                      <Bar dataKey="orders" fill="#895129" radius={[6, 6, 0, 0]} isAnimationActive animationDuration={500} animationBegin={200} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.35, delay: 0.15 }}>
          <Card className="transition-shadow hover:shadow-lg">
            <CardHeader>
              <CardTitle>Users growth</CardTitle>
            </CardHeader>
            <CardContent className="h-[260px]">
              {isEmpty ? (
                <Skeleton className="h-[220px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dataset}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                    <XAxis dataKey="day" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="users"
                      stroke="#895129"
                      fill="rgba(137,81,41,0.18)"
                      isAnimationActive
                      animationDuration={550}
                      animationBegin={220}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Vendor + country + insights */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="xl:col-span-2">
            <Card className="transition-shadow hover:shadow-lg">
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Vendor performance</CardTitle>
                <Badge variant="secondary">{vendorData.length}</Badge>
              </CardHeader>
              <CardContent>
                {isEmpty ? (
                  <div className="space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {vendorData.map((v, idx) => (
                      <motion.div
                        key={v.name}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, delay: idx * 0.04 }}
                        className="flex items-center justify-between rounded-lg border border-black/10 p-3"
                      >
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{v.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {v.orders} orders • Rating {v.rating.toFixed(1)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{formatMoney(v.revenue)}</Badge>
                          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                            <Button size="sm" variant="outline" onClick={() => setSelectedVendor(v)}>
                              View details
                            </Button>
                          </motion.div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.1 }}>
            <Card className="transition-shadow hover:shadow-lg">
              <CardHeader>
                <CardTitle>Country distribution</CardTitle>
              </CardHeader>
              <CardContent className="h-[320px]">
                {isEmpty ? (
                  <Skeleton className="h-[280px] w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={countryData} dataKey="value" nameKey="name" outerRadius={90} innerRadius={50} paddingAngle={3} isAnimationActive animationDuration={500}>
                        {countryData.map((_, i) => (
                          <Cell key={i} fill={pieColors[i % pieColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.12 }}>
          <Card className="transition-shadow hover:shadow-lg">
            <CardHeader>
              <CardTitle>Activity insights</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-4">
              {[
                { label: 'Peak order time', value: insights.peakOrderTime },
                { label: 'Most active country', value: insights.mostActiveCountry },
                { label: 'Highest revenue day', value: insights.highestRevenueDay },
                { label: 'Top performing vendor', value: insights.topVendor },
              ].map((i) => (
                <div key={i.label} className="rounded-lg border border-black/10 p-3">
                  <div className="text-xs text-muted-foreground">{i.label}</div>
                  <div className="mt-1 text-sm font-medium">{i.value}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <Dialog open={!!selectedVendor} onOpenChange={(open) => !open && setSelectedVendor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vendor details</DialogTitle>
            <DialogDescription>Performance snapshot (demo).</DialogDescription>
          </DialogHeader>
          {!selectedVendor ? null : (
            <div className="space-y-3">
              <div className="rounded-lg border border-black/10 p-3">
                <div className="text-sm font-medium">{selectedVendor.name}</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="secondary">Revenue {formatMoney(selectedVendor.revenue)}</Badge>
                  <Badge variant="secondary">{selectedVendor.orders} orders</Badge>
                  <Badge variant="secondary">Rating {selectedVendor.rating.toFixed(1)}</Badge>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                This is a demo modal. Hook to vendor analytics API later.
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedVendor(null)}>
                  Close
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageShell>
  )
}

