import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Ban,
  CheckCircle2,
  MapPin,
  MessageSquare,
  Navigation,
  Package,
  ShieldAlert,
} from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
import { DriverDetailsTabs } from '@/features/delivery-drivers/pages/delivery-driver-details/DriverDetailsTabs'
import {
  AccountStatusBadge,
  LiveStatusBadge,
  StarRow,
  VehicleTypeBadge,
} from '@/features/delivery-drivers/driverBadges'
import {
  useApproveDriverMutation,
  useBlockDriverMutation,
  useGetDeliveryDriverQuery,
  useMessageDriverMutation,
  useRejectDriverMutation,
  useSuspendDriverMutation,
} from '@/features/delivery-drivers/deliveryDriversApi'
import type { DeliveryDriverDetail } from '@/features/delivery-drivers/types'
import { useAppDispatch } from '@/hooks/redux'
import { pushNotification } from '@/app/notifications/notificationsSlice'
import { cn } from '@/lib/utils'
import { DeliveryDriverDetailsSkeleton } from '@/features/delivery-drivers/pages/DeliveryDriverDetailsSkeleton'

function formatMoney(value: number) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(value)
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase()
}

function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const esc = (v: string | number) => {
    const s = String(v)
    if (s.includes('"') || s.includes(',') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`
    return s
  }
  const body = [headers.join(','), ...rows.map((r) => r.map(esc).join(','))].join('\n')
  const blob = new Blob([body], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

const MotionCard = motion(Card)

export default function DeliveryDriverDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useAppDispatch()
  const initialTab = (location.state as { tab?: string } | null)?.tab

  const { data: driver, isLoading, isError } = useGetDeliveryDriverQuery(id ?? '', { skip: !id })
  const [approve, { isLoading: approving }] = useApproveDriverMutation()
  const [reject, { isLoading: rejecting }] = useRejectDriverMutation()
  const [suspend, { isLoading: suspending }] = useSuspendDriverMutation()
  const [block, { isLoading: blocking }] = useBlockDriverMutation()
  const [message] = useMessageDriverMutation()

  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [suspendOpen, setSuspendOpen] = useState(false)
  const [blockOpen, setBlockOpen] = useState(false)

  const successRate = useMemo(() => {
    if (!driver) return 0
    const d = driver.completedOrders + driver.cancelledOrders
    if (d <= 0) return 0
    return Math.round((driver.completedOrders / d) * 1000) / 10
  }, [driver])

  const statItems = useMemo(() => {
    if (!driver) return []
    return [
      { label: 'Total deliveries', value: String(driver.deliveries.length) },
      { label: 'Completed', value: driver.completedOrders.toLocaleString() },
      { label: 'Cancelled', value: driver.cancelledOrders.toLocaleString() },
      { label: 'Success rate', value: `${successRate}%` },
      { label: 'Total earnings', value: formatMoney(driver.totalEarnings) },
      { label: 'Weekly', value: formatMoney(driver.weeklyEarnings) },
      { label: 'Monthly', value: formatMoney(driver.monthlyEarningsTotal) },
      { label: 'Avg time', value: `${driver.avgDeliveryMinutes || '—'} min` },
      { label: 'Rating', value: driver.ratingCount ? driver.rating.toFixed(2) : '—' },
      { label: 'Active', value: String(driver.activeDeliveries) },
    ]
  }, [driver, successRate])

  async function handleMessage(d: DeliveryDriverDetail) {
    await message({ id: d.id, name: d.name }).unwrap()
    dispatch(
      pushNotification({ kind: 'message', title: 'Message queued', description: `${d.name} (demo)` }),
    )
  }

  function handleLiveMap() {
    dispatch(pushNotification({ kind: 'delivery', title: 'Map', description: 'Scroll to map section.' }))
    document.getElementById('driver-live-map')?.scrollIntoView({ behavior: 'smooth' })
  }

  function earningsCsv(d: DeliveryDriverDetail) {
    downloadCsv(
      `${d.id}-earnings.csv`,
      ['type', 'label', 'amount'],
      [
        ...d.weeklyEarningsSeries.map((p) => ['weekly', p.label, p.amount]),
        ...d.monthlyEarningsFull.map((p) => ['monthly', p.label, p.amount]),
      ],
    )
    dispatch(pushNotification({ kind: 'system', title: 'Downloaded', description: 'Earnings CSV' }))
  }

  function deliveriesCsv(d: DeliveryDriverDetail) {
    downloadCsv(
      `${d.id}-deliveries.csv`,
      ['id', 'customer', 'vendor', 'pickup', 'dropoff', 'km', 'fee', 'status', 'date'],
      d.deliveries.map((r) => [
        r.id,
        r.customer,
        r.vendor,
        r.pickup,
        r.dropoff,
        r.distanceKm,
        r.deliveryFee,
        r.status,
        r.date,
      ]),
    )
    dispatch(pushNotification({ kind: 'system', title: 'Export', description: 'Deliveries CSV' }))
  }

  if (!id) {
    return <p className="text-sm text-muted-foreground">Missing driver id.</p>
  }

  if (isLoading) {
    return <DeliveryDriverDetailsSkeleton />
  }

  if (isError || !driver) {
    return (
      <div className="rounded-xl border border-black/10 bg-white p-10 text-center shadow-soft">
        <p className="font-semibold">Driver not found</p>
        <Button asChild className="mt-4 bg-[#895129] hover:bg-[#895129]/90">
          <Link to="/admin/vendors/delivery-drivers">Back</Link>
        </Button>
      </div>
    )
  }

  const d = driver

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-12">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" className="rounded-xl" asChild>
          <Link to="/admin/vendors/delivery-drivers" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            All drivers
          </Link>
        </Button>
        <span className="text-sm text-muted-foreground">{d.id}</span>
      </div>

      <div className="rounded-2xl border border-black/10 bg-gradient-to-br from-white to-primary/[0.05] p-6 shadow-soft md:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row">
            <Avatar className="h-24 w-24 rounded-2xl border border-primary/20 sm:h-28 sm:w-28">
              <AvatarImage src={d.avatarUrl} alt="" />
              <AvatarFallback className="rounded-2xl text-xl">{getInitials(d.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{d.name}</h1>
              <div className="flex flex-wrap gap-2">
                <LiveStatusBadge status={d.liveStatus} />
                <AccountStatusBadge status={d.accountStatus} />
                <Badge variant="secondary">{d.country}</Badge>
                <VehicleTypeBadge type={d.vehicleType} />
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                {d.ratingCount ? <StarRow rating={d.rating} /> : <span>No ratings</span>}
                <span>·</span>
                <span>Joined {d.joinDate}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap xl:sticky xl:top-20 xl:self-start">
            <Button variant="outline" className="rounded-xl" onClick={() => handleMessage(d)}>
              <MessageSquare className="h-4 w-4" />
              Message
            </Button>
            {d.accountStatus === 'pending' && (
              <>
                <Button
                  className="rounded-xl bg-[#895129] hover:bg-[#895129]/90"
                  disabled={approving}
                  onClick={async () => {
                    await approve({ id: d.id }).unwrap()
                    dispatch(pushNotification({ kind: 'system', title: 'Approved', description: d.name }))
                  }}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Approve
                </Button>
                <Button variant="destructive" className="rounded-xl" onClick={() => setRejectOpen(true)}>
                  Reject
                </Button>
              </>
            )}
            {d.accountStatus === 'active' && (
              <>
                <Button variant="outline" className="rounded-xl" onClick={() => setSuspendOpen(true)}>
                  <ShieldAlert className="h-4 w-4" />
                  Suspend
                </Button>
                <Button variant="destructive" className="rounded-xl" onClick={() => setBlockOpen(true)}>
                  <Ban className="h-4 w-4" />
                  Block
                </Button>
              </>
            )}
            <Button className="rounded-xl bg-[#895129] hover:bg-[#895129]/90" onClick={handleLiveMap}>
              <Navigation className="h-4 w-4" />
              Live location
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_280px]">
        <div className="min-w-0 space-y-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {statItems.map((s, i) => (
              <MotionCard
                key={s.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                whileHover={{ y: -2 }}
                className="rounded-xl border-black/10 shadow-soft"
              >
                <CardHeader className="pb-1">
                  <CardTitle className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    {s.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-lg font-semibold">{s.value}</CardContent>
              </MotionCard>
            ))}
          </div>

          <DriverDetailsTabs
            key={`${d.id}-${initialTab ?? 'default'}`}
            driver={d}
            initialTab={initialTab}
            onDownloadEarningsReport={() => earningsCsv(d)}
            onDownloadDeliveriesExport={() => deliveriesCsv(d)}
          />

          <Card id="driver-live-map" className="scroll-mt-24 rounded-xl border-black/10 shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Map</CardTitle>
              <Badge variant="secondary">Demo</Badge>
            </CardHeader>
            <CardContent className="p-0">
              <div className="relative flex h-[220px] items-center justify-center bg-gradient-to-br from-primary/10 to-muted/30">
                <div
                  className="absolute inset-0 opacity-30"
                  style={{
                    backgroundImage:
                      'linear-gradient(rgba(137,81,41,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(137,81,41,0.15) 1px, transparent 1px)',
                    backgroundSize: '24px 24px',
                  }}
                />
                <div className="relative text-center text-sm">
                  <MapPin className="mx-auto mb-2 h-8 w-8 text-primary" />
                  <p className="font-medium">Placeholder map</p>
                  <p className="text-xs text-muted-foreground">
                    {d.mapCoords.lat.toFixed(4)}, {d.mapCoords.lng.toFixed(4)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-20 xl:self-start">
          <Card className="rounded-xl border-black/10 shadow-soft">
            <CardHeader>
              <CardTitle className="text-sm">Quick info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Wallet</span>
                <span className="font-medium">{formatMoney(d.walletBalance)}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Region</span>
                <span className="text-right text-sm font-medium">{d.assignedRegion}</span>
              </div>
              <div className="border-t border-black/10 pt-2 text-xs text-muted-foreground">
                {d.deviceInfo.model} · {d.deviceInfo.os}
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-xl border-black/10 shadow-soft">
            <CardHeader>
              <CardTitle className="text-sm">Emergency</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <div className="font-medium">{d.emergencyContact.name}</div>
              <div className="text-muted-foreground">{d.emergencyContact.phone}</div>
            </CardContent>
          </Card>
          <Button variant="outline" className="w-full rounded-xl" asChild>
            <Link to="/orders">
              <Package className="h-4 w-4" />
              Orders
            </Link>
          </Button>
        </aside>
      </div>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="rounded-xl">
          <DialogHeader>
            <DialogTitle>Reject {d.name}?</DialogTitle>
            <DialogDescription>Reason stored on record (demo).</DialogDescription>
          </DialogHeader>
          <textarea
            className={cn(
              'min-h-[96px] w-full rounded-xl border border-black/10 px-3 py-2 text-sm',
              'outline-none focus-visible:ring-2 focus-visible:ring-primary/30',
            )}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={rejecting || rejectReason.trim().length < 4}
              onClick={async () => {
                await reject({ id: d.id, reason: rejectReason.trim() }).unwrap()
                setRejectOpen(false)
                navigate('/admin/vendors/delivery-drivers')
              }}
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={suspendOpen} onOpenChange={setSuspendOpen}>
        <DialogContent className="rounded-xl">
          <DialogHeader>
            <DialogTitle>Suspend?</DialogTitle>
            <DialogDescription>{d.name}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspendOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={suspending}
              onClick={async () => {
                await suspend({ id: d.id }).unwrap()
                setSuspendOpen(false)
              }}
            >
              Suspend
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={blockOpen} onOpenChange={setBlockOpen}>
        <DialogContent className="rounded-xl">
          <DialogHeader>
            <DialogTitle>Block?</DialogTitle>
            <DialogDescription>{d.name}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBlockOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={blocking}
              onClick={async () => {
                await block({ id: d.id }).unwrap()
                setBlockOpen(false)
                navigate('/admin/vendors/delivery-drivers')
              }}
            >
              Block
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
