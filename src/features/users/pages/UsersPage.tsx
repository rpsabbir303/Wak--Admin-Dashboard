import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Eye } from 'lucide-react'

import { PageShell } from '@/components/PageShell'
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
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type UserRole = 'customer' | 'vendor' | 'driver'
type UserStatus = 'active' | 'blocked'

type UserRow = {
  id: string
  name: string
  email: string
  role: UserRole
  country: string
  status: UserStatus
  totalOrders: number
  totalSpent: number
  joinedAt: string
  lastActive: string
  ordersHistory: Array<{ id: string; amount: number; status: 'paid' | 'pending' | 'refunded' | 'cancelled' }>
  bookings: Array<{ serviceName: string; date: string; status: 'confirmed' | 'pending' | 'cancelled' }>
}

const mockUsers: UserRow[] = [
  {
    id: 'U-1001',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'customer',
    country: 'USA',
    status: 'active',
    totalOrders: 5,
    totalSpent: 320,
    joinedAt: '2025-01-10',
    lastActive: '2026-04-29 18:22',
    ordersHistory: [
      { id: 'O-28901', amount: 78.25, status: 'paid' },
      { id: 'O-28744', amount: 42.0, status: 'paid' },
      { id: 'O-28612', amount: 64.5, status: 'pending' },
      { id: 'O-28502', amount: 19.99, status: 'paid' },
      { id: 'O-28401', amount: 115.0, status: 'refunded' },
    ],
    bookings: [
      { serviceName: 'AC Repair', date: '2026-04-18', status: 'confirmed' },
      { serviceName: 'Home Cleaning', date: '2026-03-22', status: 'confirmed' },
      { serviceName: 'Plumbing', date: '2026-03-02', status: 'cancelled' },
    ],
  },
  {
    id: 'U-1002',
    name: 'Amina Rahman',
    email: 'amina@test.com',
    role: 'vendor',
    country: 'BD',
    status: 'blocked',
    totalOrders: 12,
    totalSpent: 820,
    joinedAt: '2025-02-14',
    lastActive: '2026-04-12 09:10',
    ordersHistory: [
      { id: 'O-29010', amount: 156.0, status: 'paid' },
      { id: 'O-28992', amount: 29.5, status: 'cancelled' },
      { id: 'O-28964', amount: 210.0, status: 'paid' },
      { id: 'O-28910', amount: 48.75, status: 'pending' },
      { id: 'O-28877', amount: 76.0, status: 'paid' },
    ],
    bookings: [
      { serviceName: 'Vendor Onboarding', date: '2026-01-21', status: 'confirmed' },
      { serviceName: 'Catalog Audit', date: '2025-12-11', status: 'pending' },
    ],
  },
]

function RoleBadge({ role }: { role: UserRow['role'] }) {
  const variant: 'default' | 'secondary' | 'warning' =
    role === 'vendor' ? 'secondary' : role === 'driver' ? 'warning' : 'default'
  return <Badge variant={variant}>{role}</Badge>
}

function StatusBadge({ status }: { status: UserRow['status'] }) {
  return status === 'blocked' ? (
    <Badge variant="danger">blocked</Badge>
  ) : (
    <Badge variant="success">active</Badge>
  )
}

function formatMoney(value: number) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(value)
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const a = parts[0]?.[0] ?? ''
  const b = parts[1]?.[0] ?? ''
  return (a + b).toUpperCase()
}

function orderStatusVariant(status: UserRow['ordersHistory'][number]['status']): 'secondary' | 'success' | 'warning' | 'danger' {
  if (status === 'paid') return 'success'
  if (status === 'pending') return 'warning'
  if (status === 'refunded') return 'secondary'
  return 'danger'
}

const MotionTableRow = motion(TableRow)

export default function UsersPage() {
  const [q, setQ] = useState('')
  const [role, setRole] = useState<UserRole | 'all'>('all')
  const [status, setStatus] = useState<UserStatus | 'all'>('all')
  const [country, setCountry] = useState<string | 'all'>('all')
  const [page, setPage] = useState(1)
  const pageSize = 10

  const [users, setUsers] = useState<UserRow[]>(mockUsers)
  const [selected, setSelected] = useState<UserRow | null>(null)
  const [confirmTarget, setConfirmTarget] = useState<UserRow | null>(null)
  const [pendingAction, setPendingAction] = useState<'block' | 'unblock' | null>(null)
  const [clickedId, setClickedId] = useState<string | null>(null)

  const countries = useMemo(() => {
    const set = new Set(users.map((u) => u.country).filter(Boolean))
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [users])

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    return users.filter((u) => {
      const matchesQuery =
        query.length === 0 ||
        u.name.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query) ||
        u.id.toLowerCase().includes(query)
      const matchesRole = role === 'all' || u.role === role
      const matchesStatus = status === 'all' || u.status === status
      const matchesCountry = country === 'all' || u.country === country
      return matchesQuery && matchesRole && matchesStatus && matchesCountry
    })
  }, [users, q, role, status, country])

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

  function requestToggle(u: UserRow) {
    setConfirmTarget(u)
    setPendingAction(u.status === 'blocked' ? 'unblock' : 'block')
  }

  function applyToggle() {
    if (!confirmTarget || !pendingAction) return
    setUsers((prev) =>
      prev.map((u) =>
        u.id === confirmTarget.id
          ? { ...u, status: pendingAction === 'block' ? 'blocked' : 'active' }
          : u,
      ),
    )
    setConfirmTarget(null)
    setPendingAction(null)
  }

  return (
    <PageShell
      title="Users"
      description="Search, filter, and manage customers, vendors, and drivers."
      right={
        <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
          <Input
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setPage(1)
            }}
            placeholder="Search id/name/email…"
            className="w-full md:w-[260px]"
          />
          <select
            value={role}
            onChange={(e) => {
              setRole(e.target.value as UserRole | 'all')
              setPage(1)
            }}
            className="h-10 rounded-lg border border-[#EEE7DF] bg-white px-3 text-sm"
          >
            <option value="all">All roles</option>
            <option value="customer">Customer</option>
            <option value="vendor">Vendor</option>
            <option value="driver">Driver</option>
          </select>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as UserStatus | 'all')
              setPage(1)
            }}
            className="h-10 rounded-lg border border-[#EEE7DF] bg-white px-3 text-sm"
          >
            <option value="all">All status</option>
            <option value="active">Active</option>
            <option value="blocked">Blocked</option>
          </select>
          <select
            value={country}
            onChange={(e) => {
              setCountry(e.target.value)
              setPage(1)
            }}
            className="h-10 rounded-lg border border-[#EEE7DF] bg-white px-3 text-sm"
          >
            <option value="all">All countries</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      }
    >
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>User list</CardTitle>
            <div className="text-sm text-muted-foreground">
              {filtered.length} total
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Total Spend</TableHead>
                  <TableHead className="min-w-[160px] pr-6 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-10">
                      <div className="flex flex-col items-center justify-center gap-3 text-center">
                        <svg
                          width="120"
                          height="90"
                          viewBox="0 0 120 90"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          className="opacity-70"
                        >
                          <rect x="10" y="16" width="100" height="64" rx="10" fill="rgba(0,0,0,0.04)" />
                          <rect x="22" y="30" width="44" height="10" rx="5" fill="rgba(137,81,41,0.18)" />
                          <rect x="22" y="46" width="76" height="8" rx="4" fill="rgba(0,0,0,0.08)" />
                          <rect x="22" y="58" width="60" height="8" rx="4" fill="rgba(0,0,0,0.08)" />
                        </svg>
                        <div className="text-sm font-medium text-foreground">No users yet</div>
                        <div className="text-sm text-muted-foreground">
                          Try adjusting search or filters.
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paged.map((u) => (
                    <MotionTableRow
                      key={u.id}
                      whileHover={{ scale: 1.01 }}
                      transition={{ duration: 0.12 }}
                      onClick={() => setClickedId(u.id)}
                      className={clickedId === u.id ? 'bg-primary/5' : undefined}
                    >
                      <TableCell className="align-middle py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback>{getInitials(u.name)}</AvatarFallback>
                          </Avatar>
                          <div className="leading-tight">
                            <div className="font-medium">{u.name}</div>
                            <div className="text-xs text-muted-foreground">{u.id}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="align-middle py-4 text-muted-foreground">{u.email}</TableCell>
                      <TableCell className="align-middle py-4">
                        <RoleBadge role={u.role} />
                      </TableCell>
                      <TableCell className="align-middle py-4">{u.country}</TableCell>
                      <TableCell className="align-middle py-4">
                        <StatusBadge status={u.status} />
                      </TableCell>
                      <TableCell className="align-middle py-4">{u.totalOrders}</TableCell>
                      <TableCell className="align-middle py-4">{formatMoney(u.totalSpent)}</TableCell>
                      <TableCell className="min-w-[160px] align-middle py-4 pr-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-9 w-9 rounded-lg border border-[#89512920] bg-white text-[#895129] hover:bg-[#faf7f3]"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelected(u)
                              }}
                              aria-label="View details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </motion.div>

                          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                            {u.status === 'active' ? (
                              <Button
                                size="sm"
                                className="h-9 rounded-lg border border-red-200 bg-[#fff1f1] px-3 text-sm font-medium text-red-600 hover:bg-[#ffe6e6]"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  requestToggle(u)
                                }}
                              >
                                Block
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                className="h-9 rounded-lg border border-green-200 bg-[#eefbf3] px-3 text-sm font-medium text-green-700 hover:bg-[#e2f6ea]"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  requestToggle(u)
                                }}
                              >
                                Unblock
                              </Button>
                            )}
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
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User details</DialogTitle>
            <DialogDescription>Full history and admin controls.</DialogDescription>
          </DialogHeader>

          {selected && (
            <Tabs defaultValue="overview">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="orders">Orders</TabsTrigger>
                <TabsTrigger value="bookings">Bookings</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="rounded-lg border border-[#EEE7DF] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{getInitials(selected.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm font-medium">{selected.name}</div>
                        <div className="text-xs text-muted-foreground">{selected.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <RoleBadge role={selected.role} />
                      <StatusBadge status={selected.status} />
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="text-sm">
                      <div className="text-xs text-muted-foreground">Country</div>
                      <div className="font-medium">{selected.country}</div>
                    </div>
                    <div className="text-sm">
                      <div className="text-xs text-muted-foreground">Joined</div>
                      <div className="font-medium">{selected.joinedAt}</div>
                    </div>
                    <div className="text-sm">
                      <div className="text-xs text-muted-foreground">Total orders</div>
                      <div className="font-medium">{selected.totalOrders}</div>
                    </div>
                    <div className="text-sm">
                      <div className="text-xs text-muted-foreground">Total spent</div>
                      <div className="font-medium">{formatMoney(selected.totalSpent)}</div>
                    </div>
                    <div className="text-sm sm:col-span-2">
                      <div className="text-xs text-muted-foreground">Last active</div>
                      <div className="font-medium">{selected.lastActive}</div>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-[#EEE7DF] p-4">
                  <div className="text-sm font-medium">Activity summary</div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    Quick snapshot across orders and bookings.
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-3">
                    <div className="rounded-lg bg-black/[0.02] p-3">
                      <div className="text-xs text-muted-foreground">Orders</div>
                      <div className="text-base font-semibold">{selected.totalOrders}</div>
                    </div>
                    <div className="rounded-lg bg-black/[0.02] p-3">
                      <div className="text-xs text-muted-foreground">Spend</div>
                      <div className="text-base font-semibold">{formatMoney(selected.totalSpent)}</div>
                    </div>
                    <div className="rounded-lg bg-black/[0.02] p-3">
                      <div className="text-xs text-muted-foreground">Bookings</div>
                      <div className="text-base font-semibold">{selected.bookings.length}</div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="orders" className="space-y-3">
                <div className="text-sm font-medium">Last 5 orders</div>
                <div className="space-y-2">
                  {selected.ordersHistory.slice(0, 5).map((o) => (
                    <div
                      key={o.id}
                      className="flex items-center justify-between rounded-lg border border-[#EEE7DF] p-3"
                    >
                      <div>
                        <div className="text-sm font-medium">{o.id}</div>
                        <div className="text-xs text-muted-foreground">{formatMoney(o.amount)}</div>
                      </div>
                      <Badge variant={orderStatusVariant(o.status)} className="capitalize">
                        {o.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="bookings" className="space-y-3">
                <div className="text-sm font-medium">Service bookings</div>
                <div className="space-y-2">
                  {selected.bookings.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No bookings found.</div>
                  ) : (
                    selected.bookings.slice(0, 8).map((b, idx) => (
                      <div
                        key={`${b.serviceName}-${idx}`}
                        className="flex items-center justify-between rounded-lg border border-[#EEE7DF] p-3"
                      >
                        <div>
                          <div className="text-sm font-medium">{b.serviceName}</div>
                          <div className="text-xs text-muted-foreground">{b.date}</div>
                        </div>
                        <Badge
                          variant={b.status === 'confirmed' ? 'success' : b.status === 'pending' ? 'warning' : 'danger'}
                          className="capitalize"
                        >
                          {b.status}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!confirmTarget && !!pendingAction}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmTarget(null)
            setPendingAction(null)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pendingAction === 'block' ? 'Block user?' : 'Unblock user?'}
            </DialogTitle>
            <DialogDescription>
              {confirmTarget
                ? `${pendingAction === 'block' ? 'Blocking' : 'Unblocking'} ${confirmTarget.name} will immediately change their access.`
                : ''}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setConfirmTarget(null)
                setPendingAction(null)
              }}
            >
              Cancel
            </Button>
            {pendingAction === 'block' ? (
              <Button variant="destructive" onClick={applyToggle}>
                Block
              </Button>
            ) : (
              <Button className="bg-emerald-600 text-white hover:bg-emerald-600/90" onClick={applyToggle}>
                Unblock
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  )
}

