import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Eye, ShieldAlert } from 'lucide-react'

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type PayoutStatus = 'pending' | 'approved' | 'flagged' | 'hold'

type PayoutRow = {
  id: string
  vendor: string
  vendorCountry: string
  vendorTotalEarnings: number
  amount: number
  status: PayoutStatus
  method: 'Stripe'
  requestDate: string // YYYY-MM-DD
  orders: number
  ordersBreakdown: Array<{ id: string; amount: number }>
  refundRatio: number // 0..1
  suspiciousVendor: boolean
}

const mockPayouts: PayoutRow[] = [
  {
    id: 'PAY-1001',
    vendor: 'Cedar & Co',
    vendorCountry: 'US',
    vendorTotalEarnings: 6200,
    amount: 250,
    status: 'pending',
    method: 'Stripe',
    requestDate: '2026-04-20',
    orders: 5,
    ordersBreakdown: [
      { id: '#28901', amount: 78.25 },
      { id: '#28877', amount: 49.5 },
      { id: '#28812', amount: 36.0 },
      { id: '#28744', amount: 42.0 },
      { id: '#28690', amount: 44.25 },
    ],
    refundRatio: 0.06,
    suspiciousVendor: false,
  },
  {
    id: 'PAY-1002',
    vendor: 'Brown Barrel Foods',
    vendorCountry: 'BD',
    vendorTotalEarnings: 12400,
    amount: 540,
    status: 'approved',
    method: 'Stripe',
    requestDate: '2026-04-18',
    orders: 12,
    ordersBreakdown: Array.from({ length: 12 }).map((_, i) => ({
      id: `#287${10 + i}`,
      amount: Math.round((20 + Math.random() * 80) * 100) / 100,
    })),
    refundRatio: 0.11,
    suspiciousVendor: false,
  },
  {
    id: 'PAY-1003',
    vendor: 'Golden Grain',
    vendorCountry: 'AE',
    vendorTotalEarnings: 3100,
    amount: 120,
    status: 'flagged',
    method: 'Stripe',
    requestDate: '2026-04-22',
    orders: 3,
    ordersBreakdown: [
      { id: '#28992', amount: 29.5 },
      { id: '#28964', amount: 42.25 },
      { id: '#28910', amount: 48.25 },
    ],
    refundRatio: 0.34,
    suspiciousVendor: true,
  },
]

function formatMoney(value: number) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(value)
}

function StatusBadge({ status }: { status: PayoutStatus }) {
  if (status === 'approved') return <Badge variant="success">approved</Badge>
  if (status === 'flagged') return <Badge variant="danger">flagged</Badge>
  if (status === 'hold') return <Badge variant="warning">hold</Badge>
  return <Badge variant="warning">pending</Badge>
}

const MotionTableRow = motion(TableRow)

export default function PayoutsPage() {
  const [payouts, setPayouts] = useState<PayoutRow[]>(mockPayouts)
  const [selected, setSelected] = useState<PayoutRow | null>(null)

  const [tab, setTab] = useState<'all' | 'pending' | 'approved' | 'flagged'>('all')
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<PayoutStatus | 'all'>('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [minAmount, setMinAmount] = useState('')
  const [maxAmount, setMaxAmount] = useState('')

  const [page, setPage] = useState(1)
  const pageSize = 10

  const commissionRate = 0.1

  const summary = useMemo(() => {
    const totalRevenue = payouts.reduce((sum, p) => sum + p.ordersBreakdown.reduce((s, o) => s + o.amount, 0), 0)
    const totalPayouts = payouts
      .filter((p) => p.status === 'approved')
      .reduce((sum, p) => sum + p.amount, 0)
    const pendingPayouts = payouts
      .filter((p) => p.status === 'pending' || p.status === 'hold')
      .reduce((sum, p) => sum + p.amount, 0)
    const platformEarnings = totalRevenue * commissionRate
    return { totalRevenue, totalPayouts, pendingPayouts, platformEarnings }
  }, [payouts])

  const insights = useMemo(() => {
    const topVendors = [...payouts]
      .sort((a, b) => b.vendorTotalEarnings - a.vendorTotalEarnings)
      .slice(0, 3)
    const highestPayouts = [...payouts].sort((a, b) => b.amount - a.amount).slice(0, 3)
    const recent = [...payouts].sort((a, b) => (a.requestDate < b.requestDate ? 1 : -1)).slice(0, 5)
    return { topVendors, highestPayouts, recent }
  }, [payouts])

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    const from = fromDate.trim() || undefined
    const to = toDate.trim() || undefined
    const min = minAmount.trim() === '' ? undefined : Number(minAmount)
    const max = maxAmount.trim() === '' ? undefined : Number(maxAmount)

    return payouts.filter((p) => {
      const matchesTab =
        tab === 'all'
          ? true
          : tab === 'pending'
            ? p.status === 'pending' || p.status === 'hold'
            : p.status === tab

      const matchesQuery =
        query.length === 0 ||
        p.vendor.toLowerCase().includes(query) ||
        p.id.toLowerCase().includes(query)

      const matchesStatus = status === 'all' || p.status === status
      const matchesFrom = !from || p.requestDate >= from
      const matchesTo = !to || p.requestDate <= to
      const matchesMin = min === undefined || (!Number.isNaN(min) && p.amount >= min)
      const matchesMax = max === undefined || (!Number.isNaN(max) && p.amount <= max)

      return matchesTab && matchesQuery && matchesStatus && matchesFrom && matchesTo && matchesMin && matchesMax
    })
  }, [payouts, tab, q, status, fromDate, toDate, minAmount, maxAmount])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)

  const pageNumbers = useMemo(() => {
    const delta = 2
    const start = Math.max(1, page - delta)
    const end = Math.min(totalPages, page + delta)
    const nums: number[] = []
    for (let p = start; p <= end; p++) nums.push(p)
    return nums
  }, [page, totalPages])

  function setPayoutStatus(id: string, next: PayoutStatus) {
    setPayouts((prev) => prev.map((p) => (p.id === id ? { ...p, status: next } : p)))
    setSelected((prev) => (prev?.id === id ? { ...prev, status: next } : prev))
  }

  function commissionFor(p: PayoutRow) {
    // fee based on payout amount (simplified)
    const fee = Math.round(p.amount * commissionRate * 100) / 100
    const vendorEarning = Math.round((p.amount - fee) * 100) / 100
    return { fee, vendorEarning }
  }

  return (
    <PageShell
      title="Earnings & Payouts"
      description="Approve payouts, flag suspicious activity, and monitor revenue."
      right={
        <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
          <Input
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setPage(1)
            }}
            placeholder="Search vendor / payout id…"
            className="w-full md:w-[260px]"
          />
        </div>
      }
    >
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Total Revenue', value: formatMoney(summary.totalRevenue) },
            { label: 'Total Payouts', value: formatMoney(summary.totalPayouts) },
            { label: 'Pending Payouts', value: formatMoney(summary.pendingPayouts) },
            { label: 'Platform Earnings (commission)', value: formatMoney(summary.platformEarnings) },
          ].map((s, idx) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: idx * 0.05 }}
              whileHover={{ y: -4 }}
            >
              <Card className="transition-shadow hover:shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">{s.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold text-foreground">{s.value}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Payout approvals</CardTitle>
              <div className="text-sm text-muted-foreground">{filtered.length} results</div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 gap-2 md:grid-cols-5">
                <select
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value as PayoutStatus | 'all')
                    setPage(1)
                  }}
                  className="h-10 rounded-lg border border-black/10 bg-white px-3 text-sm"
                >
                  <option value="all">Status: all</option>
                  <option value="pending">Pending</option>
                  <option value="hold">Hold</option>
                  <option value="approved">Approved</option>
                  <option value="flagged">Flagged</option>
                </select>
                <Input
                  type="date"
                  value={fromDate}
                  onChange={(e) => {
                    setFromDate(e.target.value)
                    setPage(1)
                  }}
                />
                <Input
                  type="date"
                  value={toDate}
                  onChange={(e) => {
                    setToDate(e.target.value)
                    setPage(1)
                  }}
                />
                <Input
                  inputMode="numeric"
                  value={minAmount}
                  onChange={(e) => {
                    setMinAmount(e.target.value)
                    setPage(1)
                  }}
                  placeholder="Min $"
                />
                <Input
                  inputMode="numeric"
                  value={maxAmount}
                  onChange={(e) => {
                    setMaxAmount(e.target.value)
                    setPage(1)
                  }}
                  placeholder="Max $"
                />
              </div>

              <Tabs
                value={tab}
                onValueChange={(v) => {
                  setTab(v as typeof tab)
                  setPage(1)
                }}
              >
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                  <TabsTrigger value="approved">Approved</TabsTrigger>
                  <TabsTrigger value="flagged">Flagged</TabsTrigger>
                </TabsList>

                <TabsContent value={tab} className="mt-3">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Payout ID</TableHead>
                        <TableHead>Vendor</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Orders</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Request Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paged.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-muted-foreground">
                            No payout requests.
                          </TableCell>
                        </TableRow>
                      ) : (
                        paged.map((p) => (
                          <MotionTableRow
                            key={p.id}
                            whileHover={{ scale: 1.01 }}
                            transition={{ duration: 0.12 }}
                          >
                            <TableCell className="font-medium">{p.id}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="font-medium">{p.vendor}</div>
                                {(p.refundRatio >= 0.25 || p.suspiciousVendor) && (
                                  <Badge variant="danger">🚫 Suspicious vendor</Badge>
                                )}
                                {p.refundRatio >= 0.2 && (
                                  <Badge variant="warning">⚠ High refund rate</Badge>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">{p.vendorCountry}</div>
                            </TableCell>
                            <TableCell>{formatMoney(p.amount)}</TableCell>
                            <TableCell>{p.orders}</TableCell>
                            <TableCell className="text-muted-foreground">{p.method}</TableCell>
                            <TableCell className="text-muted-foreground">{p.requestDate}</TableCell>
                            <TableCell>
                              <motion.div
                                key={`${p.id}-${p.status}`}
                                initial={{ opacity: 0.6, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.18 }}
                                className="inline-block"
                              >
                                <StatusBadge status={p.status} />
                              </motion.div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                {p.status === 'pending' || p.status === 'hold' ? (
                                  <>
                                    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                                      <Button
                                        size="sm"
                                        className="bg-emerald-600 text-white hover:bg-emerald-600/90"
                                        onClick={() => setPayoutStatus(p.id, 'approved')}
                                      >
                                        Approve
                                      </Button>
                                    </motion.div>
                                    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                                      <Button
                                        size="sm"
                                        className="bg-amber-500 text-white hover:bg-amber-500/90"
                                        onClick={() => setPayoutStatus(p.id, 'hold')}
                                      >
                                        Hold
                                      </Button>
                                    </motion.div>
                                    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => setPayoutStatus(p.id, 'flagged')}
                                      >
                                        Flag
                                      </Button>
                                    </motion.div>
                                  </>
                                ) : (
                                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setSelected(p)}
                                    >
                                      {p.status === 'flagged' ? 'Review' : 'View'}
                                    </Button>
                                  </motion.div>
                                )}
                                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setSelected(p)}
                                    aria-label="Open payout details"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </motion.div>
                              </div>
                            </TableCell>
                          </MotionTableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Page {page} of {totalPages}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="outline"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                      >
                        Prev
                      </Button>
                      {pageNumbers.map((p) => (
                        <Button
                          key={p}
                          variant={p === page ? 'default' : 'outline'}
                          size="sm"
                          className="h-9 w-9 px-0"
                          onClick={() => setPage(p)}
                        >
                          {p}
                        </Button>
                      ))}
                      <Button
                        variant="outline"
                        disabled={page >= totalPages}
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card className="xl:col-span-1">
            <CardHeader>
              <CardTitle>Quick insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-black/10 p-3">
                <div className="text-sm font-medium">Top earning vendors</div>
                <div className="mt-3 space-y-2">
                  {insights.topVendors.map((v) => (
                    <div key={v.id} className="flex items-center justify-between text-sm">
                      <div className="font-medium">{v.vendor}</div>
                      <div className="text-muted-foreground">{formatMoney(v.vendorTotalEarnings)}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-black/10 p-3">
                <div className="text-sm font-medium">Highest payouts</div>
                <div className="mt-3 space-y-2">
                  {insights.highestPayouts.map((p) => (
                    <div key={p.id} className="flex items-center justify-between text-sm">
                      <div className="font-medium">{p.vendor}</div>
                      <div className="text-muted-foreground">{formatMoney(p.amount)}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-black/10 p-3">
                <div className="text-sm font-medium">Recent transactions</div>
                <div className="mt-3 space-y-2">
                  {insights.recent.map((p) => (
                    <div key={p.id} className="flex items-start justify-between gap-2 text-sm">
                      <div>
                        <div className="font-medium">{p.id}</div>
                        <div className="text-xs text-muted-foreground">{p.vendor}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-muted-foreground">{formatMoney(p.amount)}</div>
                        <div className="text-xs text-muted-foreground">{p.requestDate}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Payout details</DialogTitle>
            <DialogDescription>Vendor info, breakdown, commission and risk checks.</DialogDescription>
          </DialogHeader>

          {!selected ? null : (
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }} className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-black/10 p-4">
                  <div className="text-sm font-medium">Vendor info</div>
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <div className="text-muted-foreground">Name</div>
                      <div className="font-medium">{selected.vendor}</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-muted-foreground">Country</div>
                      <div className="font-medium">{selected.vendorCountry}</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-muted-foreground">Total earnings</div>
                      <div className="font-medium">{formatMoney(selected.vendorTotalEarnings)}</div>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-black/10 p-4">
                  <div className="text-sm font-medium">Payout info</div>
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <div className="text-muted-foreground">Amount</div>
                      <div className="font-medium">{formatMoney(selected.amount)}</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-muted-foreground">Method</div>
                      <div className="font-medium">{selected.method}</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-muted-foreground">Request date</div>
                      <div className="font-medium">{selected.requestDate}</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-muted-foreground">Status</div>
                      <StatusBadge status={selected.status} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-black/10 p-4">
                <div className="text-sm font-medium">Orders breakdown</div>
                <div className="mt-3 space-y-2">
                  {selected.ordersBreakdown.slice(0, 8).map((o) => (
                    <div key={o.id} className="flex items-center justify-between rounded-lg bg-black/[0.02] p-3 text-sm">
                      <div className="font-medium">{o.id}</div>
                      <div className="font-medium">{formatMoney(o.amount)}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-black/10 p-4">
                  <div className="text-sm font-medium">Commission info</div>
                  {(() => {
                    const { fee, vendorEarning } = commissionFor(selected)
                    return (
                      <div className="mt-3 space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <div className="text-muted-foreground">Platform fee ({Math.round(commissionRate * 100)}%)</div>
                          <div className="font-medium">{formatMoney(fee)}</div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-muted-foreground">Vendor earning</div>
                          <div className="font-medium">{formatMoney(vendorEarning)}</div>
                        </div>
                      </div>
                    )
                  })()}
                </div>

                <div className="rounded-lg border border-black/10 p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">Risk check</div>
                    <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <div className="text-muted-foreground">Refund ratio</div>
                      <div className="font-medium">{Math.round(selected.refundRatio * 100)}%</div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selected.refundRatio >= 0.2 && <Badge variant="warning">⚠ High refund rate</Badge>}
                      {selected.suspiciousVendor && <Badge variant="danger">🚫 Suspicious vendor</Badge>}
                      {selected.refundRatio < 0.2 && !selected.suspiciousVendor && (
                        <Badge variant="success">No issues detected</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-between sm:gap-2">
                <Button variant="outline" onClick={() => setSelected(null)}>
                  Close
                </Button>
                <div className="flex flex-wrap justify-end gap-2">
                  {(selected.status === 'pending' || selected.status === 'hold') && (
                    <>
                      <Button
                        className="bg-emerald-600 text-white hover:bg-emerald-600/90"
                        onClick={() => setPayoutStatus(selected.id, 'approved')}
                      >
                        Approve
                      </Button>
                      <Button
                        className="bg-amber-500 text-white hover:bg-amber-500/90"
                        onClick={() => setPayoutStatus(selected.id, 'hold')}
                      >
                        Hold
                      </Button>
                      <Button variant="destructive" onClick={() => setPayoutStatus(selected.id, 'flagged')}>
                        Flag
                      </Button>
                    </>
                  )}
                </div>
              </DialogFooter>
            </motion.div>
          )}
        </DialogContent>
      </Dialog>
    </PageShell>
  )
}

