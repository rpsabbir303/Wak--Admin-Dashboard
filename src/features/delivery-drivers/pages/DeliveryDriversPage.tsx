import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Ban,
  Bike,
  CheckCircle2,
  CircleDollarSign,
  MessageSquare,
  MoreHorizontal,
  Package,
  ShieldAlert,
  User,
  XCircle,
} from 'lucide-react'

import { PageShell } from '@/components/PageShell'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AccountStatusBadge,
  LiveStatusBadge,
  StarRow,
  VehicleTypeBadge,
} from '@/features/delivery-drivers/driverBadges'
import {
  useApproveDriverMutation,
  useBlockDriverMutation,
  useGetDeliveryDriversOverviewQuery,
  useMessageDriverMutation,
  useRejectDriverMutation,
  useSuspendDriverMutation,
} from '@/features/delivery-drivers/deliveryDriversApi'
import type { DeliveryDriver } from '@/features/delivery-drivers/types'
import { useAppDispatch } from '@/hooks/redux'
import { pushNotification } from '@/app/notifications/notificationsSlice'
import { cn } from '@/lib/utils'

function formatMoney(value: number) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(value)
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const a = parts[0]?.[0] ?? ''
  const b = parts[1]?.[0] ?? ''
  return (a + b).toUpperCase()
}

const MotionTableRow = motion(TableRow)
const MotionCard = motion(Card)

type AccountFilter = DeliveryDriver['accountStatus'] | 'all'
type PresenceFilter = DeliveryDriver['liveStatus'] | 'all'
type VerifiedFilter = 'all' | 'verified' | 'unverified'
type EarningsFilter = 'all' | 'lt5k' | '5to20k' | 'gt20k'
type RatingFilter = 'all' | '45' | '4' | '35'

export default function DeliveryDriversPage() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { data, isLoading, isFetching } = useGetDeliveryDriversOverviewQuery()
  const [approve] = useApproveDriverMutation()
  const [reject, { isLoading: rejecting }] = useRejectDriverMutation()
  const [suspend] = useSuspendDriverMutation()
  const [block] = useBlockDriverMutation()
  const [message] = useMessageDriverMutation()

  const [q, setQ] = useState('')
  const [account, setAccount] = useState<AccountFilter>('all')
  const [presence, setPresence] = useState<PresenceFilter>('all')
  const [verified, setVerified] = useState<VerifiedFilter>('all')
  const [country, setCountry] = useState<string | 'all'>('all')
  const [earnings, setEarnings] = useState<EarningsFilter>('all')
  const [rating, setRating] = useState<RatingFilter>('all')

  const [clickedId, setClickedId] = useState<string | null>(null)

  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectTarget, setRejectTarget] = useState<DeliveryDriver | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const drivers = useMemo(() => data?.drivers ?? [], [data])
  const stats = data?.stats

  const countries = useMemo(() => {
    const s = new Set(drivers.map((d) => d.country))
    return Array.from(s).sort((a, b) => a.localeCompare(b))
  }, [drivers])

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    return drivers.filter((d) => {
      const matchesQ =
        query.length === 0 ||
        d.name.toLowerCase().includes(query) ||
        d.email.toLowerCase().includes(query) ||
        d.phone.toLowerCase().includes(query) ||
        d.id.toLowerCase().includes(query)
      const matchesAccount = account === 'all' || d.accountStatus === account
      const matchesPresence = presence === 'all' || d.liveStatus === presence
      const matchesVerified =
        verified === 'all' || (verified === 'verified' ? d.verified : !d.verified)
      const matchesCountry = country === 'all' || d.country === country
      const matchesEarnings =
        earnings === 'all' ||
        (earnings === 'lt5k' && d.totalEarnings < 5000) ||
        (earnings === '5to20k' && d.totalEarnings >= 5000 && d.totalEarnings <= 20000) ||
        (earnings === 'gt20k' && d.totalEarnings > 20000)
      const matchesRating =
        rating === 'all' ||
        (rating === '45' && d.rating >= 4.5) ||
        (rating === '4' && d.rating >= 4.0) ||
        (rating === '35' && d.rating > 0 && d.rating < 4.0)
      return (
        matchesQ &&
        matchesAccount &&
        matchesPresence &&
        matchesVerified &&
        matchesCountry &&
        matchesEarnings &&
        matchesRating
      )
    })
  }, [drivers, q, account, presence, verified, country, earnings, rating])

  const statCards = useMemo(() => {
    if (!stats) return []
    return [
      { key: 'total', label: 'Total drivers', value: stats.totalDrivers, icon: User },
      { key: 'active', label: 'Active drivers', value: stats.activeDrivers, icon: CheckCircle2 },
      { key: 'pending', label: 'Pending approvals', value: stats.pendingApprovals, icon: Package },
      { key: 'online', label: 'Online drivers', value: stats.onlineDrivers, icon: Bike },
      { key: 'today', label: 'Completed today', value: stats.completedDeliveriesToday, icon: Package },
      { key: 'earn', label: 'Total driver earnings', value: formatMoney(stats.totalDriverEarnings), icon: CircleDollarSign },
    ]
  }, [stats])

  async function handleMessageDriver(d: DeliveryDriver) {
    await message({ id: d.id, name: d.name }).unwrap()
    dispatch(
      pushNotification({
        kind: 'message',
        title: 'Message queued',
        description: `Thread with ${d.name} (demo).`,
      }),
    )
  }

  return (
    <PageShell
      title="Delivery drivers"
      description="Approve riders, monitor live operations, earnings, and customer feedback — logistics control center."
      right={
        <div className="flex w-full flex-col gap-2 lg:w-auto lg:flex-row lg:flex-wrap lg:items-center lg:justify-end">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, email, phone…"
            className="w-full rounded-xl lg:w-[240px]"
          />
        </div>
      }
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
        className="space-y-5"
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          <AnimatePresence>
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <motion.div
                    key={`sk-${i}`}
                    initial={{ opacity: 0.4 }}
                    animate={{ opacity: 1 }}
                    className="h-[104px] rounded-xl border border-[#EEE7DF] bg-gradient-to-br from-muted/80 to-white shadow-soft"
                  />
                ))
              : statCards.map((c, i) => {
                  const Icon = c.icon
                  return (
                    <motion.div
                      key={c.key}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06, type: 'spring', stiffness: 320, damping: 28 }}
                      whileHover={{ y: -3 }}
                    >
                      <Card className="group overflow-hidden rounded-xl border-[#EEE7DF] bg-gradient-to-br from-white via-white to-primary/[0.06] shadow-soft transition-shadow hover:shadow-md">
                        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                          <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            {c.label}
                          </CardTitle>
                          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                            <Icon className="h-4 w-4" />
                          </span>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-semibold tracking-tight text-foreground">{c.value}</div>
                          <div className="mt-2 h-1 w-12 rounded-full bg-primary/35" />
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
          </AnimatePresence>
        </div>

        <MotionCard className="rounded-xl border-[#EEE7DF] shadow-soft" whileHover={{ boxShadow: '0 12px 36px rgba(16,24,40,0.08)' }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Filters</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
            <select
              value={account}
              onChange={(e) => setAccount(e.target.value as AccountFilter)}
              className="h-10 w-full rounded-xl border border-[#EEE7DF] bg-white px-3 text-sm lg:w-[160px]"
            >
              <option value="all">Account: All</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
              <option value="blocked">Blocked</option>
              <option value="rejected">Rejected</option>
            </select>
            <select
              value={presence}
              onChange={(e) => setPresence(e.target.value as PresenceFilter)}
              className="h-10 w-full rounded-xl border border-[#EEE7DF] bg-white px-3 text-sm lg:w-[160px]"
            >
              <option value="all">Live: All</option>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
              <option value="delivering">Delivering</option>
              <option value="idle">Idle</option>
            </select>
            <select
              value={verified}
              onChange={(e) => setVerified(e.target.value as VerifiedFilter)}
              className="h-10 w-full rounded-xl border border-[#EEE7DF] bg-white px-3 text-sm lg:w-[160px]"
            >
              <option value="all">Verified: All</option>
              <option value="verified">Verified</option>
              <option value="unverified">Unverified</option>
            </select>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="h-10 w-full rounded-xl border border-[#EEE7DF] bg-white px-3 text-sm lg:w-[180px]"
            >
              <option value="all">Country: All</option>
              {countries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              value={earnings}
              onChange={(e) => setEarnings(e.target.value as EarningsFilter)}
              className="h-10 w-full rounded-xl border border-[#EEE7DF] bg-white px-3 text-sm lg:w-[200px]"
            >
              <option value="all">Earnings: All</option>
              <option value="lt5k">Under $5k</option>
              <option value="5to20k">$5k – $20k</option>
              <option value="gt20k">Over $20k</option>
            </select>
            <select
              value={rating}
              onChange={(e) => setRating(e.target.value as RatingFilter)}
              className="h-10 w-full rounded-xl border border-[#EEE7DF] bg-white px-3 text-sm lg:w-[180px]"
            >
              <option value="all">Rating: All</option>
              <option value="45">4.5+ stars</option>
              <option value="4">4+ stars</option>
              <option value="35">Below 4 stars</option>
            </select>
            {isFetching && !isLoading && (
              <span className="text-xs font-medium text-primary">Refreshing…</span>
            )}
          </CardContent>
        </MotionCard>

        <Card className="rounded-xl border-[#EEE7DF] shadow-soft">
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 pb-3">
            <CardTitle className="text-base">Driver roster</CardTitle>
            <div className="text-sm text-muted-foreground">{filtered.length} shown</div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Driver</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead>Earnings</TableHead>
                    <TableHead>Live</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="min-w-[160px] pr-6 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="py-12 text-center text-sm text-muted-foreground">
                        No drivers match your filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((d) => (
                      <MotionTableRow
                        key={d.id}
                        onClick={() => {
                          setClickedId(d.id)
                          navigate(`/admin/vendors/delivery-drivers/${encodeURIComponent(d.id)}`)
                        }}
                        className={cn('cursor-pointer', clickedId === d.id && 'bg-primary/[0.07]')}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 rounded-xl border border-[#EEE7DF]">
                              <AvatarImage src={d.avatarUrl} alt="" />
                              <AvatarFallback>{getInitials(d.name)}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <div className="truncate font-medium">{d.name}</div>
                              <div className="truncate text-xs text-muted-foreground">{d.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{d.country}</TableCell>
                        <TableCell>
                          <VehicleTypeBadge type={d.vehicleType} />
                        </TableCell>
                        <TableCell>
                          <AccountStatusBadge status={d.accountStatus} />
                        </TableCell>
                        <TableCell>
                          {d.ratingCount ? <StarRow rating={d.rating} /> : <span className="text-xs text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="font-medium tabular-nums">{d.completedOrders.toLocaleString()}</TableCell>
                        <TableCell className="tabular-nums text-sm">{formatMoney(d.totalEarnings)}</TableCell>
                        <TableCell>
                          <LiveStatusBadge status={d.liveStatus} />
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{d.joinDate}</TableCell>
                        <TableCell className="min-w-[160px] pr-6 text-right" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-10 w-10 rounded-xl border border-[#89512925] bg-white hover:border-[#89512940] hover:bg-[#faf7f3]"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52 rounded-xl">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="cursor-pointer"
                                onClick={() => navigate(`/admin/vendors/delivery-drivers/${encodeURIComponent(d.id)}`)}
                              >
                                <User className="h-4 w-4" />
                                View details
                              </DropdownMenuItem>
                              {d.accountStatus === 'pending' && (
                                <>
                                  <DropdownMenuItem
                                    className="cursor-pointer text-[#895129] focus:text-[#895129]"
                                    onClick={async () => {
                                      await approve({ id: d.id }).unwrap()
                                      dispatch(
                                        pushNotification({
                                          kind: 'system',
                                          title: 'Driver approved',
                                          description: d.name,
                                        }),
                                      )
                                    }}
                                  >
                                    <CheckCircle2 className="h-4 w-4" />
                                    Approve
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="cursor-pointer text-red-600 focus:text-red-600"
                                    onClick={() => {
                                      setRejectTarget(d)
                                      setRejectOpen(true)
                                    }}
                                  >
                                    <XCircle className="h-4 w-4" />
                                    Reject
                                  </DropdownMenuItem>
                                </>
                              )}
                              {d.accountStatus === 'active' && (
                                <>
                                  <DropdownMenuItem
                                    className="cursor-pointer"
                                    onClick={() =>
                                      navigate(`/admin/vendors/delivery-drivers/${encodeURIComponent(d.id)}`, {
                                        state: { tab: 'deliveries' },
                                      })
                                    }
                                  >
                                    <Package className="h-4 w-4" />
                                    View deliveries
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="cursor-pointer" onClick={() => handleMessageDriver(d)}>
                                    <MessageSquare className="h-4 w-4" />
                                    Message driver
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="cursor-pointer text-amber-800 focus:text-amber-800"
                                    onClick={async () => {
                                      await suspend({ id: d.id }).unwrap()
                                      dispatch(
                                        pushNotification({
                                          kind: 'system',
                                          title: 'Driver suspended',
                                          description: d.name,
                                        }),
                                      )
                                    }}
                                  >
                                    <ShieldAlert className="h-4 w-4" />
                                    Suspend
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="cursor-pointer text-red-600 focus:text-red-600"
                                    onClick={async () => {
                                      await block({ id: d.id }).unwrap()
                                      dispatch(
                                        pushNotification({
                                          kind: 'system',
                                          title: 'Driver blocked',
                                          description: d.name,
                                        }),
                                      )
                                    }}
                                  >
                                    <Ban className="h-4 w-4" />
                                    Block
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </MotionTableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="md:hidden divide-y divide-black/10">
              {filtered.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">No drivers match your filters.</div>
              ) : null}
              {filtered.map((d) => (
                <motion.button
                  key={d.id}
                  type="button"
                  onClick={() => {
                    setClickedId(d.id)
                    navigate(`/admin/vendors/delivery-drivers/${encodeURIComponent(d.id)}`)
                  }}
                  whileTap={{ scale: 0.99 }}
                  className={cn(
                    'flex w-full flex-col gap-3 p-4 text-left transition-colors',
                    clickedId === d.id ? 'bg-primary/[0.07]' : 'bg-white hover:bg-black/[0.02]',
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-11 w-11 rounded-xl border border-[#EEE7DF]">
                        <AvatarImage src={d.avatarUrl} alt="" />
                        <AvatarFallback>{getInitials(d.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold">{d.name}</div>
                        <div className="text-xs text-muted-foreground">{d.country}</div>
                      </div>
                    </div>
                    <LiveStatusBadge status={d.liveStatus} />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <AccountStatusBadge status={d.accountStatus} />
                    <VehicleTypeBadge type={d.vehicleType} />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <div className="text-xs text-muted-foreground">Earnings</div>
                      <div className="font-medium">{formatMoney(d.totalEarnings)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Completed</div>
                      <div className="font-medium">{d.completedOrders}</div>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="rounded-xl">
          <DialogHeader>
            <DialogTitle>Reject {rejectTarget?.name ?? 'driver'}?</DialogTitle>
            <DialogDescription>Provide a clear reason — it is stored on the driver record (demo).</DialogDescription>
          </DialogHeader>
          <textarea
            className={cn(
              'min-h-[100px] w-full rounded-xl border border-[#EEE7DF] bg-white px-3 py-2 text-sm',
              'outline-none focus-visible:ring-2 focus-visible:ring-primary/30',
            )}
            placeholder="Reason for rejection…"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!rejectTarget || rejecting || rejectReason.trim().length < 4}
              onClick={async () => {
                if (!rejectTarget) return
                await reject({ id: rejectTarget.id, reason: rejectReason.trim() }).unwrap()
                setRejectReason('')
                setRejectOpen(false)
                setRejectTarget(null)
                dispatch(
                  pushNotification({
                    kind: 'system',
                    title: 'Driver rejected',
                    description: rejectTarget.name,
                  }),
                )
              }}
            >
              Reject driver
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  )
}
