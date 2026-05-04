import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
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

function Money({ value }: { value: number }) {
  return (
    <span>
      {new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(value)}
    </span>
  )
}

type VendorStatus = 'pending' | 'active' | 'blocked'
type VendorDocStatus = 'verified' | 'pending'

type VendorRow = {
  id: string
  businessName: string
  owner: string
  email: string
  phone: string
  country: string
  status: VendorStatus
  earnings: number
  totalOrders: number
  joinedAt: string
  rating: number
  items: Array<{ name: string; type: 'product' | 'service' }>
  documents: {
    tradeLicense: VendorDocStatus
    idVerification: VendorDocStatus
  }
}

const mockVendors: VendorRow[] = [
  {
    id: 'V-1001',
    businessName: 'Brown Barrel Foods',
    owner: 'Amina Rahman',
    email: 'amina@test.com',
    phone: '+880 1711-000000',
    country: 'BD',
    status: 'pending',
    earnings: 0,
    totalOrders: 0,
    joinedAt: '2025-03-01',
    rating: 0,
    items: [
      { name: 'Organic Honey', type: 'product' },
      { name: 'Grocery Delivery', type: 'service' },
    ],
    documents: { tradeLicense: 'pending', idVerification: 'pending' },
  },
  {
    id: 'V-1002',
    businessName: 'Cedar & Co',
    owner: 'James Carter',
    email: 'james@cedarco.com',
    phone: '+1 (415) 555-0199',
    country: 'US',
    status: 'active',
    earnings: 1200,
    totalOrders: 34,
    joinedAt: '2025-02-10',
    rating: 4.7,
    items: [
      { name: 'Artisan Coffee Beans', type: 'product' },
      { name: 'Same-day Shipping', type: 'service' },
      { name: 'Premium Gift Box', type: 'product' },
    ],
    documents: { tradeLicense: 'verified', idVerification: 'verified' },
  },
  {
    id: 'V-1003',
    businessName: 'Golden Grain',
    owner: 'Nusrat Jahan',
    email: 'nusrat@goldengrain.ae',
    phone: '+971 50 000 0000',
    country: 'AE',
    status: 'blocked',
    earnings: 540,
    totalOrders: 12,
    joinedAt: '2025-01-20',
    rating: 4.2,
    items: [
      { name: 'Bakery Subscription', type: 'service' },
      { name: 'Whole Wheat Flour', type: 'product' },
    ],
    documents: { tradeLicense: 'verified', idVerification: 'pending' },
  },
]

const MotionTableRow = motion(TableRow)

function StatusBadge({ status }: { status: VendorStatus }) {
  if (status === 'pending') return <Badge variant="warning">pending</Badge>
  if (status === 'blocked') return <Badge variant="danger">blocked</Badge>
  return <Badge variant="success">active</Badge>
}

function DocBadge({ status }: { status: VendorDocStatus }) {
  return status === 'verified' ? (
    <Badge variant="success">verified</Badge>
  ) : (
    <Badge variant="warning">pending</Badge>
  )
}

function EmptyState({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
      <svg
        width="120"
        height="90"
        viewBox="0 0 120 90"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="opacity-70"
      >
        <rect x="10" y="16" width="100" height="64" rx="10" fill="rgba(0,0,0,0.04)" />
        <rect x="22" y="30" width="56" height="10" rx="5" fill="rgba(137,81,41,0.18)" />
        <rect x="22" y="46" width="76" height="8" rx="4" fill="rgba(0,0,0,0.08)" />
        <rect x="22" y="58" width="60" height="8" rx="4" fill="rgba(0,0,0,0.08)" />
      </svg>
      <div className="text-sm font-medium text-foreground">{title}</div>
      <div className="text-sm text-muted-foreground">{subtitle}</div>
    </div>
  )
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<VendorRow[]>(mockVendors)
  const [tab, setTab] = useState<VendorStatus>('pending')
  const [q, setQ] = useState('')
  const [country, setCountry] = useState<string | 'all'>('all')
  const [minEarnings, setMinEarnings] = useState('')
  const [maxEarnings, setMaxEarnings] = useState('')

  const [selected, setSelected] = useState<VendorRow | null>(null)
  const [confirmTarget, setConfirmTarget] = useState<VendorRow | null>(null)
  const [pendingAction, setPendingAction] = useState<
    'approve' | 'reject' | 'block' | 'unblock' | null
  >(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())

  const countries = useMemo(() => {
    const set = new Set(vendors.map((v) => v.country).filter(Boolean))
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [vendors])

  const counts = useMemo(() => {
    const total = vendors.length
    const pending = vendors.filter((v) => v.status === 'pending').length
    const active = vendors.filter((v) => v.status === 'active').length
    const blocked = vendors.filter((v) => v.status === 'blocked').length
    return { total, pending, active, blocked }
  }, [vendors])

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    const min = minEarnings.trim() === '' ? undefined : Number(minEarnings)
    const max = maxEarnings.trim() === '' ? undefined : Number(maxEarnings)

    return vendors.filter((v) => {
      const matchesTab = v.status === tab
      const matchesQuery =
        query.length === 0 ||
        v.businessName.toLowerCase().includes(query) ||
        v.owner.toLowerCase().includes(query)
      const matchesCountry = country === 'all' || v.country === country
      const matchesMin = min === undefined || (!Number.isNaN(min) && v.earnings >= min)
      const matchesMax = max === undefined || (!Number.isNaN(max) && v.earnings <= max)
      return matchesTab && matchesQuery && matchesCountry && matchesMin && matchesMax
    })
  }, [vendors, tab, q, country, minEarnings, maxEarnings])

  const allVisibleSelected = filtered.length > 0 && filtered.every((v) => selectedIds.has(v.id))

  function requestAction(v: VendorRow, action: NonNullable<typeof pendingAction>) {
    setConfirmTarget(v)
    setPendingAction(action)
  }

  function applyAction() {
    if (!confirmTarget || !pendingAction) return
    setVendors((prev) =>
      prev
        .map((v) => {
          if (v.id !== confirmTarget.id) return v
          if (pendingAction === 'approve') return { ...v, status: 'active' }
          if (pendingAction === 'reject') return null
          if (pendingAction === 'block') return { ...v, status: 'blocked' }
          if (pendingAction === 'unblock') return { ...v, status: 'active' }
          return v
        })
        .filter(Boolean) as VendorRow[],
    )
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.delete(confirmTarget.id)
      return next
    })
    setConfirmTarget(null)
    setPendingAction(null)
  }

  function applyBulk(action: 'approve' | 'block' | 'unblock') {
    if (selectedIds.size === 0) return
    setVendors((prev) =>
      prev.map((v) => {
        if (!selectedIds.has(v.id)) return v
        if (action === 'approve' && v.status === 'pending') return { ...v, status: 'active' }
        if (action === 'block' && v.status === 'active') return { ...v, status: 'blocked' }
        if (action === 'unblock' && v.status === 'blocked') return { ...v, status: 'active' }
        return v
      }),
    )
    setSelectedIds(new Set())
  }

  const tabLabel = tab[0].toUpperCase() + tab.slice(1)

  return (
    <PageShell
      title="Vendors"
      description="Approve vendors, monitor performance, and take enforcement actions."
      right={
        <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search business/owner…"
            className="w-full md:w-[260px]"
          />
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="h-10 rounded-lg border border-[#EEE7DF] bg-white px-3 text-sm"
          >
            <option value="all">All countries</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <Input
            inputMode="numeric"
            value={minEarnings}
            onChange={(e) => setMinEarnings(e.target.value)}
            placeholder="Min $"
            className="w-full md:w-[120px]"
          />
          <Input
            inputMode="numeric"
            value={maxEarnings}
            onChange={(e) => setMaxEarnings(e.target.value)}
            placeholder="Max $"
            className="w-full md:w-[120px]"
          />
        </div>
      }
    >
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Total Vendors', value: counts.total },
            { label: 'Pending Approvals', value: counts.pending },
            { label: 'Active Vendors', value: counts.active },
            { label: 'Blocked Vendors', value: counts.blocked },
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

        <Card className="mt-4">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Vendor management</CardTitle>
            <div className="text-sm text-muted-foreground">
              {filtered.length} shown • {tabLabel}
            </div>
          </CardHeader>
          <CardContent>
            <Tabs
              value={tab}
              onValueChange={(v) => {
                setTab(v as VendorStatus)
                setSelectedIds(new Set())
              }}
            >
              <TabsList>
                <TabsTrigger value="pending">
                  Pending{' '}
                  <Badge className="ml-2" variant="secondary">
                    {counts.pending}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="active">
                  Active{' '}
                  <Badge className="ml-2" variant="secondary">
                    {counts.active}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="blocked">
                  Blocked{' '}
                  <Badge className="ml-2" variant="secondary">
                    {counts.blocked}
                  </Badge>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pending">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm text-muted-foreground">
                    Bulk actions: select vendors to approve.
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="bg-emerald-600 text-white hover:bg-emerald-600/90"
                      disabled={selectedIds.size === 0}
                      onClick={() => applyBulk('approve')}
                    >
                      Approve selected
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={selectedIds.size === 0}
                      onClick={() => setSelectedIds(new Set())}
                    >
                      Clear selection
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="active">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm text-muted-foreground">
                    Bulk actions: select vendors to block.
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={selectedIds.size === 0}
                      onClick={() => applyBulk('block')}
                    >
                      Block selected
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={selectedIds.size === 0}
                      onClick={() => setSelectedIds(new Set())}
                    >
                      Clear selection
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="blocked">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm text-muted-foreground">
                    Bulk actions: select vendors to unblock.
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="bg-emerald-600 text-white hover:bg-emerald-600/90"
                      disabled={selectedIds.size === 0}
                      onClick={() => applyBulk('unblock')}
                    >
                      Unblock selected
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={selectedIds.size === 0}
                      onClick={() => setSelectedIds(new Set())}
                    >
                      Clear selection
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

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
                          if (checked) filtered.forEach((v) => next.add(v.id))
                          else filtered.forEach((v) => next.delete(v.id))
                          return next
                        })
                      }}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead>Business Name</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total Orders</TableHead>
                  <TableHead>Earnings</TableHead>
                  <TableHead>Joined Date</TableHead>
                  <TableHead className="min-w-[160px] pr-6 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9}>
                      <EmptyState title="No vendors found" subtitle="Try adjusting search or filters." />
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((v) => (
                    <MotionTableRow
                      key={v.id}
                      whileHover={{ scale: 1.01 }}
                      transition={{ duration: 0.12 }}
                    >
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(v.id)}
                          onChange={(e) => {
                            const checked = e.target.checked
                            setSelectedIds((prev) => {
                              const next = new Set(prev)
                              if (checked) next.add(v.id)
                              else next.delete(v.id)
                              return next
                            })
                          }}
                          aria-label={`Select ${v.id}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{v.businessName}</TableCell>
                      <TableCell className="text-muted-foreground">{v.owner}</TableCell>
                      <TableCell>{v.country}</TableCell>
                      <TableCell>
                        <StatusBadge status={v.status} />
                      </TableCell>
                      <TableCell>{v.totalOrders}</TableCell>
                      <TableCell>
                        <Money value={v.earnings} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">{v.joinedAt}</TableCell>
                      <TableCell className="min-w-[160px] pr-6 text-right">
                        <div className="flex flex-wrap items-center justify-end gap-3">
                          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-10 w-10 rounded-xl border border-[#89512925] bg-white hover:border-[#89512940] hover:bg-[#faf7f3]"
                              onClick={() => setSelected(v)}
                              aria-label="View"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </motion.div>

                          {v.status === 'pending' ? (
                            <>
                              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                                <Button
                                  size="sm"
                                  className="bg-emerald-600 text-white hover:bg-emerald-600/90"
                                  onClick={() => requestAction(v, 'approve')}
                                >
                                  Approve
                                </Button>
                              </motion.div>
                              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => requestAction(v, 'reject')}
                                >
                                  Reject
                                </Button>
                              </motion.div>
                            </>
                          ) : v.status === 'active' ? (
                            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                              <Button
                                size="sm"
                                className="h-10 rounded-xl border border-red-200 bg-[#fff1f1] px-4 text-sm font-medium text-red-600 hover:bg-[#ffe6e6]"
                                onClick={() => requestAction(v, 'block')}
                              >
                                Block
                              </Button>
                            </motion.div>
                          ) : (
                            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                              <Button
                                size="sm"
                                className="h-10 rounded-xl border border-green-200 bg-[#eefbf3] px-4 text-sm font-medium text-green-700 hover:bg-[#e2f6ea]"
                                onClick={() => requestAction(v, 'unblock')}
                              >
                                Unblock
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
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Vendor details</DialogTitle>
            <DialogDescription>Business info, performance, items and documents.</DialogDescription>
          </DialogHeader>

          {!selected ? null : (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="rounded-lg border border-[#EEE7DF] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium">{selected.businessName}</div>
                    <div className="text-xs text-muted-foreground">{selected.owner}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {selected.email} • {selected.phone}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={selected.status} />
                    <Badge variant="secondary">{selected.country}</Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-[#EEE7DF] p-3">
                  <div className="text-xs text-muted-foreground">Total orders</div>
                  <div className="text-lg font-semibold">{selected.totalOrders}</div>
                </div>
                <div className="rounded-lg border border-[#EEE7DF] p-3">
                  <div className="text-xs text-muted-foreground">Earnings</div>
                  <div className="text-lg font-semibold">
                    <Money value={selected.earnings} />
                  </div>
                </div>
                <div className="rounded-lg border border-[#EEE7DF] p-3">
                  <div className="text-xs text-muted-foreground">Rating</div>
                  <div className="text-lg font-semibold">{selected.rating.toFixed(1)}</div>
                </div>
              </div>

              <div className="rounded-lg border border-[#EEE7DF] p-4">
                <div className="text-sm font-medium">Products / Services</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selected.items.map((it, idx) => (
                    <Badge key={`${it.name}-${idx}`} variant="secondary">
                      {it.type === 'product' ? 'Product' : 'Service'} • {it.name}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-[#EEE7DF] p-4">
                <div className="text-sm font-medium">Documents</div>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="flex items-center justify-between rounded-lg bg-black/[0.02] p-3">
                    <div>
                      <div className="text-sm font-medium">Trade license</div>
                      <div className="text-xs text-muted-foreground">Business registration</div>
                    </div>
                    <DocBadge status={selected.documents.tradeLicense} />
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-black/[0.02] p-3">
                    <div>
                      <div className="text-sm font-medium">ID verification</div>
                      <div className="text-xs text-muted-foreground">Owner identity</div>
                    </div>
                    <DocBadge status={selected.documents.idVerification} />
                  </div>
                </div>
              </div>
            </motion.div>
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
              {pendingAction === 'approve'
                ? 'Approve vendor?'
                : pendingAction === 'reject'
                  ? 'Reject vendor?'
                  : pendingAction === 'block'
                    ? 'Block vendor?'
                    : 'Unblock vendor?'}
            </DialogTitle>
            <DialogDescription>
              {confirmTarget
                ? `This will update ${confirmTarget.businessName} (${confirmTarget.id}) immediately.`
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
            {pendingAction === 'approve' ? (
              <Button
                className="bg-emerald-600 text-white hover:bg-emerald-600/90"
                onClick={applyAction}
              >
                Approve
              </Button>
            ) : pendingAction === 'reject' ? (
              <Button variant="destructive" onClick={applyAction}>
                Reject
              </Button>
            ) : pendingAction === 'block' ? (
              <Button variant="destructive" onClick={applyAction}>
                Block
              </Button>
            ) : (
              <Button
                className="bg-emerald-600 text-white hover:bg-emerald-600/90"
                onClick={applyAction}
              >
                Unblock
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  )
}

