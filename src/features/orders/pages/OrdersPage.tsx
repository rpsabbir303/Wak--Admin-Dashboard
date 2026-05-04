import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { io, type Socket } from 'socket.io-client'
import { Eye } from 'lucide-react'

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
import type { AppNotification } from '@/app/notifications/notificationsSlice'
import { markRead } from '@/app/notifications/notificationsSlice'
import { useAppDispatch, useAppSelector } from '@/hooks/redux'

type OrderType = 'product' | 'service'
type PaymentStatus = 'paid' | 'pending' | 'failed' | 'cancelled'
type DeliveryStatus = 'not_started' | 'in_transit' | 'delivered'

type OrderRow = {
  id: string
  type: OrderType
  customer: { name: string; email: string; country: string }
  vendor: { name: string; contact: string }
  amount: number
  status: PaymentStatus
  payment: { method: 'Stripe'; transactionId: string }
  delivery: { status: DeliveryStatus; driver?: string; eta?: string; address: string }
  createdAt: string // YYYY-MM-DD
  items: Array<{ title: string; qty: number; price: number }>
}

const mockOrders: OrderRow[] = [
  {
    id: '#28901',
    type: 'product',
    customer: { name: 'John Doe', email: 'john@example.com', country: 'US' },
    vendor: { name: 'Cedar & Co', contact: 'support@cedarco.com' },
    amount: 129.5,
    status: 'paid',
    payment: { method: 'Stripe', transactionId: 'txn_7f3a28901' },
    delivery: {
      status: 'in_transit',
      driver: 'Sabbir',
      eta: '35m',
      address: '221B Market St, San Francisco, CA',
    },
    createdAt: '2026-04-25',
    items: [{ title: 'Wireless Headphones', qty: 1, price: 129.5 }],
  },
  {
    id: '#28902',
    type: 'service',
    customer: { name: 'Amina Rahman', email: 'amina@test.com', country: 'BD' },
    vendor: { name: 'John Doe', contact: 'john@example.com' },
    amount: 250,
    status: 'pending',
    payment: { method: 'Stripe', transactionId: 'txn_2b1c28902' },
    delivery: {
      status: 'not_started',
      address: 'House 12, Road 4, Dhaka',
    },
    createdAt: '2026-04-26',
    items: [{ title: 'Web Development Service', qty: 1, price: 250 }],
  },
]

function formatMoney(value: number) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(value)
}

function TypeBadge({ type }: { type: OrderType }) {
  return type === 'product' ? (
    <Badge variant="secondary">Product</Badge>
  ) : (
    <Badge variant="secondary">Service</Badge>
  )
}

function PaymentBadge({ status }: { status: PaymentStatus }) {
  if (status === 'paid') return <Badge variant="success">Paid</Badge>
  if (status === 'pending') return <Badge variant="warning">Pending</Badge>
  if (status === 'failed') return <Badge variant="danger">Failed</Badge>
  return <Badge variant="secondary">Cancelled</Badge>
}

function DeliveryBadge({ status }: { status: DeliveryStatus }) {
  if (status === 'delivered') return <Badge variant="success">Delivered</Badge>
  if (status === 'in_transit') return <Badge variant="warning">In transit</Badge>
  return <Badge variant="secondary">Not started</Badge>
}

const socketUrl =
  import.meta.env.VITE_SOCKET_URL ??
  import.meta.env.VITE_API_BASE_URL ??
  'http://localhost:4000'

const MotionTableRow = motion(TableRow)

export default function OrdersPage() {
  const dispatch = useAppDispatch()
  const notifications = useAppSelector((s) => s.notifications.items)

  const [orders, setOrders] = useState<OrderRow[]>(mockOrders)
  const [selected, setSelected] = useState<OrderRow | null>(null)

  const [tab, setTab] = useState<'all' | 'pending' | 'paid' | 'in_transit' | 'completed' | 'cancelled'>('all')
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<PaymentStatus | 'all'>('all')
  const [deliveryStatus, setDeliveryStatus] = useState<DeliveryStatus | 'all'>('all')
  const [type, setType] = useState<OrderType | 'all'>('all')
  const [country, setCountry] = useState<string | 'all'>('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const [page, setPage] = useState(1)
  const pageSize = 10

  const [dismissedToastId, setDismissedToastId] = useState<string | null>(null)
  const [highlightId, setHighlightId] = useState<string | null>(null)

  const lastOrderNotifId = useRef<string | null>(null)
  const socketRef = useRef<Socket | null>(null)

  const countries = useMemo(() => {
    const set = new Set(orders.map((o) => o.customer.country).filter(Boolean))
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [orders])

  const stats = useMemo(() => {
    const total = orders.length
    const pending = orders.filter((o) => o.status === 'pending').length
    const today = '2026-04-30'
    const revenueToday = orders
      .filter((o) => o.createdAt === today && o.status === 'paid')
      .reduce((sum, o) => sum + o.amount, 0)
    const activeDeliveries = orders.filter((o) => o.delivery.status === 'in_transit').length
    return { total, pending, revenueToday, activeDeliveries }
  }, [orders])

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    const from = fromDate.trim() || undefined
    const to = toDate.trim() || undefined

    return orders.filter((o) => {
      const matchesTab =
        tab === 'all'
          ? true
          : tab === 'pending'
            ? o.status === 'pending'
            : tab === 'paid'
              ? o.status === 'paid'
              : tab === 'cancelled'
                ? o.status === 'cancelled'
                : tab === 'in_transit'
                  ? o.delivery.status === 'in_transit'
                  : o.delivery.status === 'delivered'

      const matchesQuery =
        query.length === 0 ||
        o.id.toLowerCase().includes(query) ||
        o.customer.name.toLowerCase().includes(query) ||
        o.vendor.name.toLowerCase().includes(query)

      const matchesStatus = status === 'all' || o.status === status
      const matchesDelivery = deliveryStatus === 'all' || o.delivery.status === deliveryStatus
      const matchesType = type === 'all' || o.type === type
      const matchesCountry = country === 'all' || o.customer.country === country

      const matchesFrom = !from || o.createdAt >= from
      const matchesTo = !to || o.createdAt <= to

      return (
        matchesTab &&
        matchesQuery &&
        matchesStatus &&
        matchesDelivery &&
        matchesType &&
        matchesCountry &&
        matchesFrom &&
        matchesTo
      )
    })
  }, [orders, tab, q, status, deliveryStatus, type, country, fromDate, toDate])

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

  function upsertOrder(next: OrderRow) {
    setOrders((prev) => {
      const idx = prev.findIndex((o) => o.id === next.id)
      if (idx === -1) return [next, ...prev]
      const copy = [...prev]
      copy[idx] = { ...copy[idx], ...next }
      return copy
    })
  }

  function makeDemoOrderFromSocket(orderId: string, amount?: number): OrderRow {
    const id = orderId.startsWith('#') ? orderId : `#${orderId}`
    const createdAt = new Date().toISOString().slice(0, 10)
    return {
      id,
      type: Math.random() > 0.5 ? 'product' : 'service',
      customer: { name: 'New Customer', email: 'new@demo.com', country: 'US' },
      vendor: { name: 'Demo Vendor', contact: 'vendor@demo.com' },
      amount: amount ?? Math.round((50 + Math.random() * 350) * 100) / 100,
      status: 'pending',
      payment: { method: 'Stripe', transactionId: `txn_${Math.random().toString(16).slice(2, 10)}` },
      delivery: { status: 'not_started', address: '—' },
      createdAt,
      items: [{ title: 'New item', qty: 1, price: amount ?? 99 }],
    }
  }

  function markPaid(orderId: string) {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: 'paid' } : o)))
    setSelected((prev) => (prev?.id === orderId ? { ...prev, status: 'paid' } : prev))
  }

  function markDelivered(orderId: string) {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, delivery: { ...o.delivery, status: 'delivered' } } : o,
      ),
    )
    setSelected((prev) =>
      prev?.id === orderId ? { ...prev, delivery: { ...prev.delivery, status: 'delivered' } } : prev,
    )
  }

  function cancelOrder(orderId: string) {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: 'cancelled' } : o)))
    setSelected((prev) => (prev?.id === orderId ? { ...prev, status: 'cancelled' } : prev))
  }

  const latestOrderNotification = useMemo(() => {
    return notifications.find((n) => n.kind === 'order')
  }, [notifications])

  const toastVisible =
    !!latestOrderNotification &&
    latestOrderNotification.id !== dismissedToastId &&
    !latestOrderNotification.read

  // React to notifications (from AdminSocketProvider) without sync setState
  useEffect(() => {
    const latest: AppNotification | undefined = latestOrderNotification
    if (!latest) return
    if (latest.id === lastOrderNotifId.current) return
    lastOrderNotifId.current = latest.id

    // defer local state updates to callbacks (avoid sync setState in effect body)
    const t0 = window.setTimeout(() => {
      const match = latest.description?.match(/Order\s+#?(\d+)/i)
      if (match?.[1]) {
        const newOrder = makeDemoOrderFromSocket(match[1], undefined)
        upsertOrder(newOrder)
        setHighlightId(newOrder.id)
        window.setTimeout(() => setHighlightId(null), 1800)
      }
    }, 0)

    const t1 = window.setTimeout(() => {
      setDismissedToastId(latest.id)
      dispatch(markRead(latest.id))
    }, 3000)

    return () => {
      window.clearTimeout(t0)
      window.clearTimeout(t1)
    }
  }, [dispatch, latestOrderNotification])

  // Local listener for `order:update` to satisfy requirement
  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (!token) return

    const socket: Socket = io(socketUrl, {
      transports: ['websocket'],
      auth: { token },
    })
    socketRef.current = socket

    socket.on('order:update', (payload: { orderId: string; status?: PaymentStatus; deliveryStatus?: DeliveryStatus }) => {
      const id = payload.orderId.startsWith('#') ? payload.orderId : `#${payload.orderId}`
      setOrders((prev) =>
        prev.map((o) => {
          if (o.id !== id) return o
          return {
            ...o,
            status: payload.status ?? o.status,
            delivery: { ...o.delivery, status: payload.deliveryStatus ?? o.delivery.status },
          }
        }),
      )
      setHighlightId(id)
      window.setTimeout(() => setHighlightId(null), 1800)
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [])

  return (
    <PageShell
      title="Orders"
      description="Filter orders, inspect details, and handle delivery/chat actions."
    >
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-4">
        {toastVisible && latestOrderNotification && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-lg border border-[#EEE7DF] bg-white p-3 shadow-soft"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-medium text-foreground">{latestOrderNotification.title}</div>
                {latestOrderNotification.description && (
                  <div className="text-sm text-muted-foreground">{latestOrderNotification.description}</div>
                )}
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setDismissedToastId(latestOrderNotification.id)
                  dispatch(markRead(latestOrderNotification.id))
                }}
              >
                Close
              </Button>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Total Orders', value: stats.total },
            { label: 'Pending Orders', value: stats.pending },
            { label: 'Revenue Today', value: formatMoney(stats.revenueToday) },
            { label: 'Active Deliveries', value: stats.activeDeliveries },
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

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Order lifecycle</CardTitle>
            <div className="text-sm text-muted-foreground">{filtered.length} results</div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 gap-2 md:grid-cols-6">
              <Input
                value={q}
                onChange={(e) => {
                  setQ(e.target.value)
                  setPage(1)
                }}
                placeholder="Search id/customer/vendor…"
                className="md:col-span-2"
              />
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value as PaymentStatus | 'all')
                  setPage(1)
                }}
                className="h-10 rounded-lg border border-[#EEE7DF] bg-white px-3 text-sm"
              >
                <option value="all">Payment: all</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <select
                value={deliveryStatus}
                onChange={(e) => {
                  setDeliveryStatus(e.target.value as DeliveryStatus | 'all')
                  setPage(1)
                }}
                className="h-10 rounded-lg border border-[#EEE7DF] bg-white px-3 text-sm"
              >
                <option value="all">Delivery: all</option>
                <option value="not_started">Not started</option>
                <option value="in_transit">In transit</option>
                <option value="delivered">Delivered</option>
              </select>
              <select
                value={type}
                onChange={(e) => {
                  setType(e.target.value as OrderType | 'all')
                  setPage(1)
                }}
                className="h-10 rounded-lg border border-[#EEE7DF] bg-white px-3 text-sm"
              >
                <option value="all">Type: all</option>
                <option value="product">Product</option>
                <option value="service">Service</option>
              </select>
              <select
                value={country}
                onChange={(e) => {
                  setCountry(e.target.value)
                  setPage(1)
                }}
                className="h-10 rounded-lg border border-[#EEE7DF] bg-white px-3 text-sm"
              >
                <option value="all">Country: all</option>
                {countries.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-2 md:grid-cols-6">
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value)
                  setPage(1)
                }}
                className="md:col-span-1"
              />
              <Input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value)
                  setPage(1)
                }}
                className="md:col-span-1"
              />
              <div className="md:col-span-4 flex items-center justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setQ('')
                    setStatus('all')
                    setDeliveryStatus('all')
                    setType('all')
                    setCountry('all')
                    setFromDate('')
                    setToDate('')
                    setTab('all')
                    setPage(1)
                  }}
                >
                  Reset filters
                </Button>
              </div>
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
                <TabsTrigger value="paid">Paid</TabsTrigger>
                <TabsTrigger value="in_transit">In Transit</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
                <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
              </TabsList>

              <TabsContent value={tab} className="mt-3">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Delivery</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paged.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-muted-foreground">
                          No orders yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      paged.map((o) => (
                        <MotionTableRow
                          key={o.id}
                          whileHover={{ scale: 1.01 }}
                          transition={{ duration: 0.12 }}
                          className={highlightId === o.id ? 'bg-primary/5' : undefined}
                        >
                          <TableCell className="font-medium">{o.id}</TableCell>
                          <TableCell>
                            <TypeBadge type={o.type} />
                          </TableCell>
                          <TableCell>{o.customer.name}</TableCell>
                          <TableCell className="text-muted-foreground">{o.vendor.name}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {o.items
                              .slice(0, 2)
                              .map((i) => i.title)
                              .join(', ')}
                            {o.items.length > 2 ? '…' : ''}
                          </TableCell>
                          <TableCell>{formatMoney(o.amount)}</TableCell>
                          <TableCell>
                            <PaymentBadge status={o.status} />
                          </TableCell>
                          <TableCell>
                            <DeliveryBadge status={o.delivery.status} />
                          </TableCell>
                          <TableCell className="text-muted-foreground">{o.createdAt}</TableCell>
                          <TableCell className="text-right">
                            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="inline-block">
                              <Button variant="outline" size="icon" onClick={() => setSelected(o)} aria-label="View">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </motion.div>
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
                    <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
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
      </motion.div>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Order details</DialogTitle>
            <DialogDescription>Full view: payment, delivery, and timeline.</DialogDescription>
          </DialogHeader>

          {!selected ? null : (
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }} className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-[#EEE7DF] p-4">
                  <div className="text-sm font-medium">Order info</div>
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <div className="text-muted-foreground">Order</div>
                      <div className="font-medium">{selected.id}</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-muted-foreground">Date</div>
                      <div className="font-medium">{selected.createdAt}</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-muted-foreground">Type</div>
                      <TypeBadge type={selected.type} />
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-[#EEE7DF] p-4">
                  <div className="text-sm font-medium">Payment</div>
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <div className="text-muted-foreground">Status</div>
                      <PaymentBadge status={selected.status} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-muted-foreground">Method</div>
                      <div className="font-medium">{selected.payment.method}</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-muted-foreground">Transaction</div>
                      <div className="font-medium">{selected.payment.transactionId}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-[#EEE7DF] p-4">
                  <div className="text-sm font-medium">Customer</div>
                  <div className="mt-3 space-y-1 text-sm">
                    <div className="font-medium">{selected.customer.name}</div>
                    <div className="text-muted-foreground">{selected.customer.email}</div>
                    <div className="text-muted-foreground">{selected.customer.country}</div>
                  </div>
                </div>
                <div className="rounded-lg border border-[#EEE7DF] p-4">
                  <div className="text-sm font-medium">Vendor</div>
                  <div className="mt-3 space-y-1 text-sm">
                    <div className="font-medium">{selected.vendor.name}</div>
                    <div className="text-muted-foreground">{selected.vendor.contact}</div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-[#EEE7DF] p-4">
                <div className="text-sm font-medium">Items</div>
                <div className="mt-3 space-y-2">
                  {selected.items.map((i, idx) => (
                    <div key={`${selected.id}-it-${idx}`} className="flex items-center justify-between rounded-lg bg-black/[0.02] p-3 text-sm">
                      <div className="font-medium">
                        {i.title} <span className="text-muted-foreground">×{i.qty}</span>
                      </div>
                      <div className="font-medium">{formatMoney(i.price * i.qty)}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-[#EEE7DF] p-4">
                <div className="text-sm font-medium">Delivery</div>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm">
                  <div className="flex items-center justify-between">
                    <div className="text-muted-foreground">Status</div>
                    <DeliveryBadge status={selected.delivery.status} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-muted-foreground">Driver</div>
                    <div className="font-medium">{selected.delivery.driver ?? '—'}</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-muted-foreground">ETA</div>
                    <div className="font-medium">{selected.delivery.eta ?? '—'}</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-muted-foreground">Address</div>
                    <div className="font-medium text-right">{selected.delivery.address}</div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-[#EEE7DF] p-4">
                <div className="text-sm font-medium">Timeline</div>
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-4 text-sm">
                  <Badge variant="secondary">Ordered</Badge>
                  <Badge variant={selected.status === 'paid' ? 'success' : 'secondary'}>Paid</Badge>
                  <Badge variant={selected.delivery.status !== 'not_started' ? 'warning' : 'secondary'}>Shipped</Badge>
                  <Badge variant={selected.delivery.status === 'delivered' ? 'success' : 'secondary'}>Delivered</Badge>
                </div>
              </div>

              <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-between sm:gap-2">
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setSelected(null)}>
                    Close
                  </Button>
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  <Button
                    variant="outline"
                    disabled={selected.status === 'paid' || selected.status === 'cancelled'}
                    onClick={() => markPaid(selected.id)}
                  >
                    Mark as Paid
                  </Button>
                  <Button
                    variant="outline"
                    disabled={selected.delivery.status === 'delivered'}
                    onClick={() => markDelivered(selected.id)}
                  >
                    Mark as Delivered
                  </Button>
                  <Button
                    variant="destructive"
                    disabled={selected.status === 'cancelled'}
                    onClick={() => cancelOrder(selected.id)}
                  >
                    Cancel Order
                  </Button>
                </div>
              </DialogFooter>
            </motion.div>
          )}
        </DialogContent>
      </Dialog>
    </PageShell>
  )
}

