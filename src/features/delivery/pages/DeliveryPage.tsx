import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { io, type Socket } from 'socket.io-client'
import { Eye, UserPlus } from 'lucide-react'

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

type DeliveryType = 'local' | 'international'
type DeliveryStatus = 'pending' | 'picked_up' | 'in_transit' | 'delivered'

type DeliveryRow = {
  id: string
  orderId: string
  type: DeliveryType
  customer: string
  vendor: string
  driver: string | null
  status: DeliveryStatus
  pickup: string
  drop: string
  eta: string
  createdAt: string // YYYY-MM-DD
  timeline: {
    requestedAt: string
    assignedAt?: string
    pickedUpAt?: string
    inTransitAt?: string
    deliveredAt?: string
  }
}

type Driver = { name: string; phone: string }

const mockDrivers: Driver[] = [
  { name: 'Karim Uddin', phone: '+880 1700-111111' },
  { name: 'Nadia Islam', phone: '+880 1700-222222' },
  { name: 'Sabbir Hossain', phone: '+880 1700-333333' },
  { name: 'Rafi Ahmed', phone: '+880 1700-444444' },
]

const mockDeliveries: DeliveryRow[] = [
  {
    id: 'D-1001',
    orderId: '#28901',
    type: 'local',
    customer: 'John Doe',
    vendor: 'Cedar & Co',
    driver: 'Karim Uddin',
    status: 'in_transit',
    pickup: 'Gulshan 1, Dhaka',
    drop: 'Banani, Dhaka',
    eta: '25 min',
    createdAt: '2026-04-25',
    timeline: {
      requestedAt: '2026-04-25 10:12',
      assignedAt: '2026-04-25 10:18',
      pickedUpAt: '2026-04-25 10:35',
      inTransitAt: '2026-04-25 10:40',
    },
  },
  {
    id: 'D-1002',
    orderId: '#28902',
    type: 'international',
    customer: 'Amina Rahman',
    vendor: 'John Doe',
    driver: null,
    status: 'pending',
    pickup: 'New York',
    drop: 'Dubai',
    eta: '3 days',
    createdAt: '2026-04-26',
    timeline: {
      requestedAt: '2026-04-26 09:02',
    },
  },
]

const socketUrl =
  import.meta.env.VITE_SOCKET_URL ??
  import.meta.env.VITE_API_BASE_URL ??
  'http://localhost:4000'

function TypeBadge({ type }: { type: DeliveryType }) {
  return type === 'local' ? (
    <Badge variant="secondary">Local</Badge>
  ) : (
    <Badge variant="secondary">International</Badge>
  )
}

function StatusBadge({ status }: { status: DeliveryStatus }) {
  if (status === 'delivered') return <Badge variant="success">Delivered</Badge>
  if (status === 'in_transit') return <Badge variant="warning">In transit</Badge>
  if (status === 'picked_up') return <Badge variant="warning">Picked up</Badge>
  return <Badge variant="secondary">Pending</Badge>
}

const MotionTableRow = motion(TableRow)

export default function DeliveryPage() {
  const dispatch = useAppDispatch()
  const notifications = useAppSelector((s) => s.notifications.items)

  const [deliveries, setDeliveries] = useState<DeliveryRow[]>(mockDeliveries)
  const [tab, setTab] = useState<
    'all' | 'local' | 'international' | 'pending' | 'in_transit' | 'delivered'
  >('all')
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<DeliveryStatus | 'all'>('all')
  const [type, setType] = useState<DeliveryType | 'all'>('all')
  const [driver, setDriver] = useState<string | 'all'>('all')

  const [page, setPage] = useState(1)
  const pageSize = 10

  const [selected, setSelected] = useState<DeliveryRow | null>(null)
  const [assignTarget, setAssignTarget] = useState<DeliveryRow | null>(null)
  const [selectedDriver, setSelectedDriver] = useState<string>(mockDrivers[0]?.name ?? '')
  const [highlightId, setHighlightId] = useState<string | null>(null)

  const [dismissedToastId, setDismissedToastId] = useState<string | null>(null)
  const lastDeliveryNotifId = useRef<string | null>(null)
  const socketRef = useRef<Socket | null>(null)

  const driverOptions = useMemo(() => {
    const set = new Set<string>()
    deliveries.forEach((d) => {
      if (d.driver) set.add(d.driver)
    })
    mockDrivers.forEach((d) => set.add(d.name))
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [deliveries])

  const stats = useMemo(() => {
    const active = deliveries.filter((d) => d.status === 'in_transit' || d.status === 'picked_up').length
    const pendingAssign = deliveries.filter((d) => !d.driver).length
    const today = '2026-04-30'
    const deliveredToday = deliveries.filter((d) => d.status === 'delivered' && d.createdAt === today).length
    const avgDeliveryTime = '42 min'
    return { active, pendingAssign, deliveredToday, avgDeliveryTime }
  }, [deliveries])

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    return deliveries.filter((d) => {
      const matchesTab =
        tab === 'all'
          ? true
          : tab === 'local'
            ? d.type === 'local'
            : tab === 'international'
              ? d.type === 'international'
              : tab === 'pending'
                ? d.status === 'pending'
                : tab === 'in_transit'
                  ? d.status === 'in_transit' || d.status === 'picked_up'
                  : d.status === 'delivered'

      const matchesQuery =
        query.length === 0 ||
        d.orderId.toLowerCase().includes(query) ||
        d.customer.toLowerCase().includes(query) ||
        d.id.toLowerCase().includes(query)

      const matchesStatus = status === 'all' || d.status === status
      const matchesType = type === 'all' || d.type === type
      const matchesDriver = driver === 'all' || d.driver === driver

      return matchesTab && matchesQuery && matchesStatus && matchesType && matchesDriver
    })
  }, [deliveries, tab, q, status, type, driver])

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

  const latestDeliveryNotification = useMemo(() => {
    return notifications.find((n) => n.kind === 'delivery')
  }, [notifications])

  const toastVisible =
    !!latestDeliveryNotification &&
    latestDeliveryNotification.id !== dismissedToastId &&
    !latestDeliveryNotification.read

  function updateDelivery(id: string, patch: Partial<DeliveryRow>) {
    setDeliveries((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)))
    setSelected((prev) => (prev?.id === id ? { ...prev, ...patch } : prev))
    setHighlightId(id)
    window.setTimeout(() => setHighlightId(null), 1800)
  }

  function nowStamp() {
    const d = new Date()
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    const hh = String(d.getHours()).padStart(2, '0')
    const mi = String(d.getMinutes()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd} ${hh}:${mi}`
  }

  function assignDriverTo(deliveryId: string, driverName: string) {
    const current = deliveries.find((d) => d.id === deliveryId)
    const timeline = { ...(current?.timeline ?? { requestedAt: nowStamp() }) }
    updateDelivery(deliveryId, {
      driver: driverName,
      timeline: { ...timeline, assignedAt: nowStamp() },
    })
  }

  function setStatusFor(deliveryId: string, nextStatus: DeliveryStatus) {
    const current = deliveries.find((d) => d.id === deliveryId)
    const timeline = { ...(current?.timeline ?? { requestedAt: nowStamp() }) }
    if (nextStatus === 'picked_up') timeline.pickedUpAt = nowStamp()
    if (nextStatus === 'in_transit') timeline.inTransitAt = nowStamp()
    if (nextStatus === 'delivered') timeline.deliveredAt = nowStamp()
    updateDelivery(deliveryId, { status: nextStatus, timeline })
  }

  // React to delivery notifications without sync setState in effect body
  useEffect(() => {
    const latest: AppNotification | undefined = latestDeliveryNotification
    if (!latest) return
    if (latest.id === lastDeliveryNotifId.current) return
    lastDeliveryNotifId.current = latest.id

    const t0 = window.setTimeout(() => {
      // highlight if we can parse delivery id from description e.g. "D-1001 • in_transit"
      const match = latest.description?.match(/(D-\d+)/)
      if (match?.[1]) {
        setHighlightId(match[1])
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
  }, [dispatch, latestDeliveryNotification])

  // Local listener for `delivery:update`
  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (!token) return

    const socket: Socket = io(socketUrl, {
      transports: ['websocket'],
      auth: { token },
    })
    socketRef.current = socket

    socket.on('delivery:update', (payload: { deliveryId: string; status?: DeliveryStatus; driver?: string | null; eta?: string }) => {
      updateDelivery(payload.deliveryId, {
        status: payload.status ?? deliveries.find((d) => d.id === payload.deliveryId)?.status ?? 'pending',
        driver: payload.driver ?? deliveries.find((d) => d.id === payload.deliveryId)?.driver ?? null,
        eta: payload.eta ?? deliveries.find((d) => d.id === payload.deliveryId)?.eta ?? '—',
      })
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <PageShell
      title="Delivery"
      description="Assign drivers, track local/international delivery and timeline."
    >
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-4">
        {toastVisible && latestDeliveryNotification && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg border border-[#EEE7DF] bg-white p-3 shadow-soft"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-medium text-foreground">{latestDeliveryNotification.title}</div>
                {latestDeliveryNotification.description && (
                  <div className="text-sm text-muted-foreground">{latestDeliveryNotification.description}</div>
                )}
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setDismissedToastId(latestDeliveryNotification.id)
                  dispatch(markRead(latestDeliveryNotification.id))
                }}
              >
                Close
              </Button>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Active Deliveries', value: stats.active },
            { label: 'Pending Assignments', value: stats.pendingAssign },
            { label: 'Delivered Today', value: stats.deliveredToday },
            { label: 'Avg Delivery Time', value: stats.avgDeliveryTime },
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
            <CardTitle>Driver assignment</CardTitle>
            <div className="text-sm text-muted-foreground">{filtered.length} results</div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 gap-2 md:grid-cols-5">
              <Input
                value={q}
                onChange={(e) => {
                  setQ(e.target.value)
                  setPage(1)
                }}
                placeholder="Search order/customer…"
                className="md:col-span-2"
              />
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value as DeliveryStatus | 'all')
                  setPage(1)
                }}
                className="h-10 rounded-lg border border-[#EEE7DF] bg-white px-3 text-sm"
              >
                <option value="all">Status: all</option>
                <option value="pending">Pending</option>
                <option value="picked_up">Picked up</option>
                <option value="in_transit">In transit</option>
                <option value="delivered">Delivered</option>
              </select>
              <select
                value={type}
                onChange={(e) => {
                  setType(e.target.value as DeliveryType | 'all')
                  setPage(1)
                }}
                className="h-10 rounded-lg border border-[#EEE7DF] bg-white px-3 text-sm"
              >
                <option value="all">Type: all</option>
                <option value="local">Local</option>
                <option value="international">International</option>
              </select>
              <select
                value={driver}
                onChange={(e) => {
                  setDriver(e.target.value)
                  setPage(1)
                }}
                className="h-10 rounded-lg border border-[#EEE7DF] bg-white px-3 text-sm"
              >
                <option value="all">Driver: all</option>
                {driverOptions.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
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
                <TabsTrigger value="local">Local Delivery</TabsTrigger>
                <TabsTrigger value="international">International Delivery</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="in_transit">In Transit</TabsTrigger>
                <TabsTrigger value="delivered">Delivered</TabsTrigger>
              </TabsList>

              <TabsContent value={tab} className="mt-3">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Delivery ID</TableHead>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Driver</TableHead>
                      <TableHead>Pickup → Drop</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>ETA</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paged.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-muted-foreground">
                          No deliveries found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      paged.map((d) => (
                        <MotionTableRow
                          key={d.id}
                          whileHover={{ scale: 1.01 }}
                          transition={{ duration: 0.12 }}
                          className={highlightId === d.id ? 'bg-primary/5' : undefined}
                        >
                          <TableCell className="font-medium">{d.id}</TableCell>
                          <TableCell className="text-muted-foreground">{d.orderId}</TableCell>
                          <TableCell>
                            <TypeBadge type={d.type} />
                          </TableCell>
                          <TableCell>{d.customer}</TableCell>
                          <TableCell className="text-muted-foreground">{d.driver ?? '—'}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {d.pickup} → {d.drop}
                          </TableCell>
                          <TableCell>
                            <motion.div
                              key={`${d.id}-${d.status}`}
                              initial={{ opacity: 0.6, scale: 0.98 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.18 }}
                              className="inline-block"
                            >
                              <StatusBadge status={d.status} />
                            </motion.div>
                          </TableCell>
                          <TableCell>{d.eta}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                                <Button variant="outline" size="icon" onClick={() => setSelected(d)} aria-label="View details">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </motion.div>
                              {d.driver === null && (
                                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                                  <Button
                                    size="sm"
                                    className="bg-primary text-white hover:bg-primary/90"
                                    onClick={() => {
                                      setAssignTarget(d)
                                      setSelectedDriver(mockDrivers[0]?.name ?? '')
                                    }}
                                  >
                                    <UserPlus className="h-4 w-4" />
                                    Assign Driver
                                  </Button>
                                </motion.div>
                              )}
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

      <Dialog open={!!assignTarget} onOpenChange={(open) => !open && setAssignTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign driver</DialogTitle>
            <DialogDescription>Select a driver and confirm assignment.</DialogDescription>
          </DialogHeader>
          {!assignTarget ? null : (
            <div className="space-y-4">
              <div className="rounded-lg border border-[#EEE7DF] p-3">
                <div className="text-sm font-medium">{assignTarget.id}</div>
                <div className="text-xs text-muted-foreground">
                  {assignTarget.pickup} → {assignTarget.drop}
                </div>
              </div>
              <select
                value={selectedDriver}
                onChange={(e) => setSelectedDriver(e.target.value)}
                className="h-10 w-full rounded-lg border border-[#EEE7DF] bg-white px-3 text-sm"
              >
                {mockDrivers.map((d) => (
                  <option key={d.name} value={d.name}>
                    {d.name} • {d.phone}
                  </option>
                ))}
              </select>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAssignTarget(null)}>
                  Cancel
                </Button>
                <Button
                  className="bg-primary text-white hover:bg-primary/90"
                  onClick={() => {
                    assignDriverTo(assignTarget.id, selectedDriver)
                    setAssignTarget(null)
                  }}
                >
                  Confirm assign
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Delivery details</DialogTitle>
            <DialogDescription>Timeline + live tracking (mock) + status controls.</DialogDescription>
          </DialogHeader>

          {!selected ? null : (
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }} className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-[#EEE7DF] p-4">
                  <div className="text-sm font-medium">Overview</div>
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <div className="text-muted-foreground">Order</div>
                      <div className="font-medium">{selected.orderId}</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-muted-foreground">Type</div>
                      <TypeBadge type={selected.type} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-muted-foreground">Status</div>
                      <StatusBadge status={selected.status} />
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-[#EEE7DF] p-4">
                  <div className="text-sm font-medium">Driver info</div>
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <div className="text-muted-foreground">Name</div>
                      <div className="font-medium">{selected.driver ?? '—'}</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-muted-foreground">Phone</div>
                      <div className="font-medium">
                        {selected.driver
                          ? mockDrivers.find((d) => d.name === selected.driver)?.phone ?? '—'
                          : '—'}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-muted-foreground">ETA</div>
                      <div className="font-medium">{selected.eta}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-[#EEE7DF] p-4">
                <div className="text-sm font-medium">Locations</div>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm">
                  <div className="rounded-lg bg-black/[0.02] p-3">
                    <div className="text-xs text-muted-foreground">Pickup</div>
                    <div className="font-medium">{selected.pickup}</div>
                  </div>
                  <div className="rounded-lg bg-black/[0.02] p-3">
                    <div className="text-xs text-muted-foreground">Drop</div>
                    <div className="font-medium">{selected.drop}</div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-[#EEE7DF] p-4">
                <div className="text-sm font-medium">Timeline</div>
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-5 text-sm">
                  <Badge variant="secondary">Requested</Badge>
                  <Badge variant={selected.timeline.assignedAt ? 'success' : 'secondary'}>Assigned</Badge>
                  <Badge variant={selected.timeline.pickedUpAt ? 'warning' : 'secondary'}>Picked Up</Badge>
                  <Badge variant={selected.timeline.inTransitAt ? 'warning' : 'secondary'}>In Transit</Badge>
                  <Badge variant={selected.timeline.deliveredAt ? 'success' : 'secondary'}>Delivered</Badge>
                </div>
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 text-xs text-muted-foreground">
                  <div>Requested: {selected.timeline.requestedAt}</div>
                  <div>Assigned: {selected.timeline.assignedAt ?? '—'}</div>
                  <div>Picked up: {selected.timeline.pickedUpAt ?? '—'}</div>
                  <div>In transit: {selected.timeline.inTransitAt ?? '—'}</div>
                  <div className="sm:col-span-2">Delivered: {selected.timeline.deliveredAt ?? '—'}</div>
                </div>
              </div>

              <div className="rounded-lg border border-[#EEE7DF] p-4">
                <div className="text-sm font-medium">Live tracking (mock)</div>
                <div className="mt-3 h-44 rounded-lg border border-[#EEE7DF] bg-black/[0.02] grid place-items-center text-sm text-muted-foreground">
                  Map placeholder
                </div>
              </div>

              <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-between sm:gap-2">
                <Button variant="outline" onClick={() => setSelected(null)}>
                  Close
                </Button>
                <div className="flex flex-wrap justify-end gap-2">
                  <Button
                    variant="outline"
                    disabled={selected.status !== 'pending'}
                    onClick={() => setStatusFor(selected.id, 'picked_up')}
                  >
                    Mark as Picked Up
                  </Button>
                  <Button
                    variant="outline"
                    disabled={selected.status === 'delivered'}
                    onClick={() => setStatusFor(selected.id, 'in_transit')}
                  >
                    Mark as In Transit
                  </Button>
                  <Button
                    disabled={selected.status === 'delivered'}
                    onClick={() => setStatusFor(selected.id, 'delivered')}
                  >
                    Mark as Delivered
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

