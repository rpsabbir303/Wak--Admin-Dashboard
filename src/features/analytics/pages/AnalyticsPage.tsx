import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { io, type Socket } from 'socket.io-client'
import { DollarSign, Download, ShoppingCart, Store, Users } from 'lucide-react'

import { AnalyticsChartsSection } from '@/features/analytics/components/AnalyticsChartsSection'
import { AnalyticsSummaryCards } from '@/features/analytics/components/AnalyticsSummaryCards'
import { PageShell } from '@/components/PageShell'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

type RoleFilter = 'all' | 'Customer' | 'Vendor' | 'Driver'
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
  countries: [
    { name: 'USA', value: 45 },
    { name: 'BD', value: 30 },
    { name: 'UK', value: 15 },
    { name: 'AE', value: 10 },
  ] satisfies CountrySlice[],
}

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

export default function AnalyticsPage() {
  const [fromDate, setFromDate] = useState('2026-04-24')
  const [toDate, setToDate] = useState('2026-04-30')
  const [role, setRole] = useState<RoleFilter>('all')
  const [selectedCountries, setSelectedCountries] = useState<string[]>([])

  const socketRef = useRef<Socket | null>(null)
  const [lastUpdate, setLastUpdate] = useState<string | null>(null)

  const dataset = useMemo(() => {
    return days.map((d, i) => ({
      day: d,
      revenue: demo.revenue[i] ?? 0,
      orders: demo.orders[i] ?? 0,
      users: demo.usersGrowth[i] ?? 0,
    }))
  }, [])

  const activeCountries = useMemo(() => {
    if (selectedCountries.length === 0) return demo.countries
    return demo.countries.filter((c) => selectedCountries.includes(c.name))
  }, [selectedCountries])

  const totals = useMemo(() => {
    const totalRevenue = dataset.reduce((sum, r) => sum + r.revenue, 0)
    const totalOrders = dataset.reduce((sum, r) => sum + r.orders, 0)
    const totalUsers = dataset.reduce((sum, r) => sum + r.users, 0)
    const activeVendors = 3
    return { totalRevenue, totalOrders, totalUsers, activeVendors }
  }, [dataset])

  const isEmpty = dataset.length === 0

  function exportCsv() {
    const rows = [
      ['day', 'revenue', 'orders', 'users'],
      ...dataset.map((r) => [r.day, String(r.revenue), String(r.orders), String(r.users)]),
    ]
    const csv = rows.map((r) => r.map((v) => `"${v.replaceAll('"', '""')}"`).join(',')).join('\n')
    downloadTextFile('analytics_export.csv', csv, 'text/csv')
  }

  function exportPdf() {
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
            th, td { border: 1px solid #EFEAE4; padding: 10px 12px; font-size: 12px; text-align: left; }
            th { background: rgba(137,81,41,0.06); color: #374151; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; font-size: 11px; }
            tr:nth-child(even) td { background: rgba(249,250,251,0.8); }
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
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="space-y-4"
      >
        <AnalyticsSummaryCards
          cards={[
            {
              label: 'Total Revenue',
              value: formatMoney(totals.totalRevenue),
              growth: safePercent(12.4),
              icon: DollarSign,
            },
            { label: 'Total Orders', value: totals.totalOrders, growth: safePercent(6.1), icon: ShoppingCart },
            { label: 'Total Users', value: totals.totalUsers, growth: safePercent(9.8), icon: Users },
            { label: 'Active Vendors', value: totals.activeVendors, growth: safePercent(2.3), icon: Store },
          ]}
        />

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
              className="h-10 min-h-10 rounded-lg border border-[#EEE7DF] bg-white px-3 py-2 text-sm"
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
              className="h-10 rounded-lg border border-[#EEE7DF] bg-white px-3 text-sm"
            >
              <option value="all">All roles</option>
              <option value="Customer">Customer</option>
              <option value="Vendor">Vendor</option>
              <option value="Driver">Driver</option>
            </select>

            <div className="md:col-span-3 text-xs text-muted-foreground">
              Tip: hold Ctrl/⌘ to multi-select countries. {lastUpdate ? `Last update: ${lastUpdate}` : 'Real-time ready: analytics:update'}
            </div>
            {activeCountries.length === 0 && (
              <div className="md:col-span-3 text-xs text-red-600">No countries selected.</div>
            )}
          </CardContent>
        </Card>

        <AnalyticsChartsSection dataset={dataset} isEmpty={isEmpty} formatMoney={formatMoney} />
      </motion.div>
    </PageShell>
  )
}

