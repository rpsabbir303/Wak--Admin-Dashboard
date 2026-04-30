import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Eye, Trash2 } from 'lucide-react'

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

type ServiceStatus = 'active' | 'inactive'
type PricingType = 'fixed' | 'hourly'

type BookingStatus = 'ongoing' | 'completed'

type ServiceRow = {
  id: string
  title: string
  provider: string
  category: string
  price: number
  pricingType: PricingType
  bookings: number
  rating: number
  reviewsCount: number
  status: ServiceStatus
  country: string
  createdAt: string
  description: string
  recentBookings: Array<{ id: string; date: string; status: BookingStatus; amount: number }>
}

const mockServices: ServiceRow[] = [
  {
    id: 'S-1001',
    title: 'AC Repair & Maintenance',
    provider: 'Amina Rahman',
    category: 'Home Service',
    price: 80,
    pricingType: 'fixed',
    bookings: 12,
    rating: 4.5,
    reviewsCount: 18,
    status: 'active',
    country: 'BD',
    createdAt: '2025-03-12',
    description:
      'Complete AC repair and maintenance service including diagnosis, cleaning, gas check, and performance tuning.',
    recentBookings: [
      { id: 'B-39001', date: '2026-04-21', status: 'completed', amount: 80 },
      { id: 'B-38964', date: '2026-04-18', status: 'completed', amount: 80 },
      { id: 'B-38910', date: '2026-04-15', status: 'ongoing', amount: 80 },
      { id: 'B-38822', date: '2026-04-10', status: 'completed', amount: 80 },
      { id: 'B-38751', date: '2026-04-02', status: 'completed', amount: 80 },
    ],
  },
  {
    id: 'S-1002',
    title: 'Full Stack Web Development',
    provider: 'John Doe',
    category: 'IT Services',
    price: 250,
    pricingType: 'hourly',
    bookings: 5,
    rating: 4.8,
    reviewsCount: 11,
    status: 'active',
    country: 'US',
    createdAt: '2025-02-18',
    description:
      'End-to-end full stack development for web applications. Includes architecture, implementation, deployment and optimization.',
    recentBookings: [
      { id: 'B-42011', date: '2026-04-28', status: 'ongoing', amount: 250 },
      { id: 'B-41890', date: '2026-04-19', status: 'completed', amount: 250 },
      { id: 'B-41624', date: '2026-04-06', status: 'completed', amount: 250 },
      { id: 'B-41201', date: '2026-03-21', status: 'completed', amount: 250 },
      { id: 'B-41010', date: '2026-03-10', status: 'completed', amount: 250 },
    ],
  },
  {
    id: 'S-1003',
    title: 'Home Cleaning Service',
    provider: 'Karim Uddin',
    category: 'Cleaning',
    price: 30,
    pricingType: 'fixed',
    bookings: 0,
    rating: 0,
    reviewsCount: 0,
    status: 'inactive',
    country: 'AE',
    createdAt: '2025-01-25',
    description:
      'Standard home cleaning package (kitchen + bathroom + living room). Add-ons available for deep cleaning and sanitization.',
    recentBookings: [],
  },
]

function formatMoney(value: number) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(value)
}

function ratingVariant(rating: number): 'success' | 'warning' | 'secondary' {
  if (rating >= 4.5) return 'success'
  if (rating >= 4.0) return 'warning'
  return 'secondary'
}

function StatusBadge({ status }: { status: ServiceStatus }) {
  return status === 'active' ? (
    <Badge variant="success">active</Badge>
  ) : (
    <Badge variant="secondary">inactive</Badge>
  )
}

function PricingBadge({ pricingType }: { pricingType: PricingType }) {
  return pricingType === 'hourly' ? (
    <Badge variant="secondary">hourly</Badge>
  ) : (
    <Badge variant="secondary">fixed</Badge>
  )
}

function BookingStatusBadge({ status }: { status: BookingStatus }) {
  return status === 'completed' ? (
    <Badge variant="success">completed</Badge>
  ) : (
    <Badge variant="warning">ongoing</Badge>
  )
}

const MotionTableRow = motion(TableRow)

export default function ServicesPage() {
  const [services, setServices] = useState<ServiceRow[]>(mockServices)
  const [categories, setCategories] = useState<string[]>(() => {
    const set = new Set(mockServices.map((s) => s.category))
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  })

  const [tab, setTab] = useState<'all' | 'active' | 'inactive' | 'high_rated' | 'no_bookings'>(
    'all',
  )

  const [q, setQ] = useState('')
  const [category, setCategory] = useState<string | 'all'>('all')
  const [country, setCountry] = useState<string | 'all'>('all')
  const [minRating, setMinRating] = useState<string>('all') // "all" | number string
  const [pricingType, setPricingType] = useState<PricingType | 'all'>('all')

  const [page, setPage] = useState(1)
  const pageSize = 8

  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())
  const [selected, setSelected] = useState<ServiceRow | null>(null)
  const [categoriesOpen, setCategoriesOpen] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const countries = useMemo(() => {
    const set = new Set(services.map((s) => s.country).filter(Boolean))
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [services])

  const stats = useMemo(() => {
    const total = services.length
    const active = services.filter((s) => s.status === 'active').length
    const totalBookings = services.reduce((sum, s) => sum + s.bookings, 0)
    const rated = services.filter((s) => s.rating > 0)
    const avgRating = rated.length === 0 ? 0 : rated.reduce((sum, s) => sum + s.rating, 0) / rated.length
    return { total, active, totalBookings, avgRating }
  }, [services])

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    const ratingMin = minRating === 'all' ? undefined : Number(minRating)

    return services.filter((s) => {
      const matchesTab =
        tab === 'all'
          ? true
          : tab === 'high_rated'
            ? s.rating >= 4
            : tab === 'no_bookings'
              ? s.bookings === 0
              : s.status === tab

      const matchesQuery =
        query.length === 0 ||
        s.title.toLowerCase().includes(query) ||
        s.provider.toLowerCase().includes(query) ||
        s.id.toLowerCase().includes(query)

      const matchesCategory = category === 'all' || s.category === category
      const matchesCountry = country === 'all' || s.country === country
      const matchesRating =
        ratingMin === undefined || (!Number.isNaN(ratingMin) && s.rating >= ratingMin)
      const matchesPricing = pricingType === 'all' || s.pricingType === pricingType

      return (
        matchesTab &&
        matchesQuery &&
        matchesCategory &&
        matchesCountry &&
        matchesRating &&
        matchesPricing
      )
    })
  }, [services, tab, q, category, country, minRating, pricingType])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)
  const allVisibleSelected = paged.length > 0 && paged.every((s) => selectedIds.has(s.id))

  const pageNumbers = useMemo(() => {
    const delta = 2
    const start = Math.max(1, page - delta)
    const end = Math.min(totalPages, page + delta)
    const nums: number[] = []
    for (let p = start; p <= end; p++) nums.push(p)
    return nums
  }, [page, totalPages])

  function toggleSelected(id: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  function deleteOne(serviceId: string) {
    setServices((prev) => prev.filter((s) => s.id !== serviceId))
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.delete(serviceId)
      return next
    })
    if (selected?.id === serviceId) setSelected(null)
    setConfirmDeleteId(null)
  }

  function toggleActive(serviceId: string) {
    setServices((prev) =>
      prev.map((s) =>
        s.id === serviceId ? { ...s, status: s.status === 'active' ? 'inactive' : 'active' } : s,
      ),
    )
  }

  const selectedCount = selectedIds.size

  return (
    <PageShell
      title="Services"
      description="Manage services, categories, bulk actions, and status."
      right={
        <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
          <Input
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setPage(1)
            }}
            placeholder="Search service/provider…"
            className="w-full md:w-[260px]"
          />
          <Button variant="outline" onClick={() => setCategoriesOpen(true)}>
            Manage Service Categories
          </Button>
        </div>
      }
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="space-y-4"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Total Services', value: stats.total },
            { label: 'Active Services', value: stats.active },
            { label: 'Total Bookings', value: stats.totalBookings },
            { label: 'Avg Rating', value: stats.avgRating === 0 ? '—' : stats.avgRating.toFixed(2) },
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
            <CardTitle>Service moderation</CardTitle>
            <div className="text-sm text-muted-foreground">
              {filtered.length} results • {selectedCount} selected
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Tabs
              value={tab}
              onValueChange={(v) => {
                setTab(v as typeof tab)
                setPage(1)
                setSelectedIds(new Set())
              }}
            >
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="inactive">Inactive</TabsTrigger>
                <TabsTrigger value="high_rated">High Rated (4+)</TabsTrigger>
                <TabsTrigger value="no_bookings">No Bookings</TabsTrigger>
              </TabsList>

              <TabsContent value={tab} className="mt-3 space-y-3">
                <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
                  <select
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value)
                      setPage(1)
                    }}
                    className="h-10 rounded-lg border border-black/10 bg-white px-3 text-sm"
                  >
                    <option value="all">All categories</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>

                  <select
                    value={country}
                    onChange={(e) => {
                      setCountry(e.target.value)
                      setPage(1)
                    }}
                    className="h-10 rounded-lg border border-black/10 bg-white px-3 text-sm"
                  >
                    <option value="all">All countries</option>
                    {countries.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>

                  <select
                    value={minRating}
                    onChange={(e) => {
                      setMinRating(e.target.value)
                      setPage(1)
                    }}
                    className="h-10 rounded-lg border border-black/10 bg-white px-3 text-sm"
                  >
                    <option value="all">Any rating</option>
                    <option value="4">4+</option>
                    <option value="4.5">4.5+</option>
                  </select>

                  <select
                    value={pricingType}
                    onChange={(e) => {
                      setPricingType(e.target.value as PricingType | 'all')
                      setPage(1)
                    }}
                    className="h-10 rounded-lg border border-black/10 bg-white px-3 text-sm"
                  >
                    <option value="all">All pricing</option>
                    <option value="fixed">Fixed</option>
                    <option value="hourly">Hourly</option>
                  </select>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={selectedIds.size === 0}
                      onClick={() => {
                        setServices((prev) =>
                          prev.map((s) =>
                            selectedIds.has(s.id) ? { ...s, status: 'inactive' } : s,
                          ),
                        )
                        setSelectedIds(new Set())
                      }}
                    >
                      Disable selected
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={selectedIds.size === 0}
                      onClick={() => {
                        setServices((prev) => prev.filter((s) => !selectedIds.has(s.id)))
                        setSelectedIds(new Set())
                        setPage(1)
                      }}
                    >
                      Delete selected
                    </Button>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={selectedIds.size === 0}
                    onClick={() => setSelectedIds(new Set())}
                  >
                    Clear selection
                  </Button>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <input
                          type="checkbox"
                          checked={allVisibleSelected}
                          onChange={(e) => {
                            const checked = e.target.checked
                            setSelectedIds((prev) => {
                              const next = new Set(prev)
                              if (checked) paged.forEach((s) => next.add(s.id))
                              else paged.forEach((s) => next.delete(s.id))
                              return next
                            })
                          }}
                          aria-label="Select all"
                        />
                      </TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Bookings</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Country</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paged.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={11} className="text-muted-foreground">
                          No services available.
                        </TableCell>
                      </TableRow>
                    ) : (
                      paged.map((s) => (
                        <MotionTableRow
                          key={s.id}
                          whileHover={{ scale: 1.01 }}
                          transition={{ duration: 0.12 }}
                        >
                          <TableCell>
                            <input
                              type="checkbox"
                              checked={selectedIds.has(s.id)}
                              onChange={(e) => toggleSelected(s.id, e.target.checked)}
                              aria-label={`Select ${s.id}`}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-start gap-3">
                              <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10">
                                <span className="text-xs font-semibold text-primary">S</span>
                              </div>
                              <div className="leading-tight">
                                <div className="font-medium">{s.title}</div>
                                <div className="mt-1 flex flex-wrap items-center gap-2">
                                  {s.rating > 0 && s.rating < 4 && (
                                    <Badge variant="warning">⚠ Low Rating</Badge>
                                  )}
                                  {s.bookings === 0 && <Badge variant="danger">🚫 No bookings</Badge>}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{s.provider}</TableCell>
                          <TableCell>{s.category}</TableCell>
                          <TableCell>
                            {formatMoney(s.price)}{' '}
                            <span className="text-xs text-muted-foreground">
                              / {s.pricingType}
                            </span>
                          </TableCell>
                          <TableCell>{s.bookings}</TableCell>
                          <TableCell>
                            {s.rating === 0 ? (
                              <Badge variant="secondary">—</Badge>
                            ) : (
                              <Badge variant={ratingVariant(s.rating)}>{s.rating.toFixed(1)}</Badge>
                            )}
                          </TableCell>
                          <TableCell>{s.country}</TableCell>
                          <TableCell>
                            <StatusBadge status={s.status} />
                          </TableCell>
                          <TableCell className="text-muted-foreground">{s.createdAt}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => setSelected(s)}
                                  aria-label="View"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </motion.div>
                              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                                {s.status === 'active' ? (
                                  <Button size="sm" variant="outline" onClick={() => toggleActive(s.id)}>
                                    Disable
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    className="bg-emerald-600 text-white hover:bg-emerald-600/90"
                                    onClick={() => toggleActive(s.id)}
                                  >
                                    Enable
                                  </Button>
                                )}
                              </motion.div>
                              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => setConfirmDeleteId(s.id)}
                                  aria-label="Delete"
                                >
                                  <Trash2 className="h-4 w-4" />
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
      </motion.div>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Service details</DialogTitle>
            <DialogDescription>Moderation view with booking insights.</DialogDescription>
          </DialogHeader>

          {!selected ? null : (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-black/10 p-4">
                  <div className="text-sm font-medium">Basic info</div>
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-muted-foreground">Title</div>
                      <div className="font-medium text-right">{selected.title}</div>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-muted-foreground">Provider</div>
                      <div className="font-medium">{selected.provider}</div>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-muted-foreground">Category</div>
                      <div className="font-medium">{selected.category}</div>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-muted-foreground">Country</div>
                      <div className="font-medium">{selected.country}</div>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-muted-foreground">Status</div>
                      <StatusBadge status={selected.status} />
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-black/10 p-4">
                  <div className="text-sm font-medium">Pricing</div>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-lg bg-black/[0.02] p-3">
                      <div className="text-xs text-muted-foreground">Price</div>
                      <div className="text-base font-semibold">{formatMoney(selected.price)}</div>
                    </div>
                    <div className="rounded-lg bg-black/[0.02] p-3">
                      <div className="text-xs text-muted-foreground">Type</div>
                      <div className="text-base font-semibold">
                        <PricingBadge pricingType={selected.pricingType} />
                      </div>
                    </div>
                    <div className="rounded-lg bg-black/[0.02] p-3 col-span-2">
                      <div className="text-xs text-muted-foreground">Status control</div>
                      <div className="mt-2 flex items-center justify-between">
                        <StatusBadge status={selected.status} />
                        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                          {selected.status === 'active' ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                toggleActive(selected.id)
                                setSelected({ ...selected, status: 'inactive' })
                              }}
                            >
                              Disable
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              className="bg-emerald-600 text-white hover:bg-emerald-600/90"
                              onClick={() => {
                                toggleActive(selected.id)
                                setSelected({ ...selected, status: 'active' })
                              }}
                            >
                              Enable
                            </Button>
                          )}
                        </motion.div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-black/10 p-4">
                  <div className="text-xs text-muted-foreground">Total bookings</div>
                  <div className="text-xl font-semibold">{selected.bookings}</div>
                </div>
                <div className="rounded-lg border border-black/10 p-4">
                  <div className="text-xs text-muted-foreground">Rating</div>
                  <div className="text-xl font-semibold">
                    {selected.rating === 0 ? '—' : selected.rating.toFixed(1)}
                  </div>
                </div>
                <div className="rounded-lg border border-black/10 p-4">
                  <div className="text-xs text-muted-foreground">Reviews</div>
                  <div className="text-xl font-semibold">{selected.reviewsCount}</div>
                </div>
              </div>

              <div className="rounded-lg border border-black/10 p-4">
                <div className="text-sm font-medium">Description</div>
                <div className="mt-2 text-sm text-muted-foreground">{selected.description}</div>
              </div>

              <div className="rounded-lg border border-black/10 p-4">
                <div className="text-sm font-medium">Booking insights</div>
                <div className="mt-2 text-sm text-muted-foreground">
                  Recent bookings for this service.
                </div>
                <div className="mt-3 space-y-2">
                  {selected.recentBookings.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No bookings yet.</div>
                  ) : (
                    selected.recentBookings.slice(0, 5).map((b) => (
                      <div
                        key={b.id}
                        className="flex items-center justify-between rounded-lg border border-black/10 p-3"
                      >
                        <div>
                          <div className="text-sm font-medium">{b.id}</div>
                          <div className="text-xs text-muted-foreground">{b.date}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{formatMoney(b.amount)}</Badge>
                          <BookingStatusBadge status={b.status} />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setSelected(null)}>
                  Close
                </Button>
              </DialogFooter>
            </motion.div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={categoriesOpen} onOpenChange={setCategoriesOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Manage service categories</DialogTitle>
            <DialogDescription>Add, edit, and delete categories (demo).</DialogDescription>
          </DialogHeader>

          <CategoryManager
            categories={categories}
            onChange={(next) => {
              setCategories(next)
              if (category !== 'all' && !next.includes(category)) setCategory('all')
            }}
          />

          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoriesOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmDeleteId} onOpenChange={(open) => !open && setConfirmDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete service?</DialogTitle>
            <DialogDescription>This will remove the service from the list.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => confirmDeleteId && deleteOne(confirmDeleteId)}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  )
}

function CategoryManager({
  categories,
  onChange,
}: {
  categories: string[]
  onChange: (next: string[]) => void
}) {
  const [newCategory, setNewCategory] = useState('')
  const [edit, setEdit] = useState<{ original: string; value: string } | null>(null)

  function add() {
    const name = newCategory.trim()
    if (!name) return
    if (categories.includes(name)) {
      setNewCategory('')
      return
    }
    onChange([...categories, name].sort((a, b) => a.localeCompare(b)))
    setNewCategory('')
  }

  function remove(name: string) {
    onChange(categories.filter((c) => c !== name))
  }

  function startEdit(name: string) {
    setEdit({ original: name, value: name })
  }

  function saveEdit() {
    if (!edit) return
    const value = edit.value.trim()
    if (!value) return
    const next = categories.map((c) => (c === edit.original ? value : c))
    onChange(Array.from(new Set(next)).sort((a, b) => a.localeCompare(b)))
    setEdit(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          placeholder="New category name…"
        />
        <Button onClick={add}>Add</Button>
      </div>

      <div className="space-y-2">
        {categories.length === 0 ? (
          <div className="text-sm text-muted-foreground">No categories yet.</div>
        ) : (
          categories.map((c) => (
            <div
              key={c}
              className="flex items-center justify-between rounded-lg border border-black/10 p-3"
            >
              {edit?.original === c ? (
                <div className="flex w-full items-center gap-2">
                  <Input
                    value={edit.value}
                    onChange={(e) => setEdit({ ...edit, value: e.target.value })}
                  />
                  <Button onClick={saveEdit}>Save</Button>
                  <Button variant="outline" onClick={() => setEdit(null)}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <>
                  <div className="text-sm font-medium">{c}</div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => startEdit(c)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => remove(c)}>
                      Delete
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

