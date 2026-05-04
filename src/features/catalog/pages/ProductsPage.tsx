import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Eye, Pencil, Trash2 } from 'lucide-react'

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

type ProductStatus = 'active' | 'inactive' | 'out_of_stock'

type ProductRow = {
  id: string
  name: string
  vendor: string
  category: string
  price: number
  stock: number
  status: ProductStatus
  country: string
  createdAt: string
  description: string
  images: string[]
  totalSales: number
}

const mockProducts: ProductRow[] = [
  {
    id: 'P-1001',
    name: 'Wireless Headphones',
    vendor: 'Cedar & Co',
    category: 'Electronics',
    price: 120,
    stock: 45,
    status: 'active',
    country: 'US',
    createdAt: '2025-03-10',
    description:
      'Premium wireless headphones with active noise cancellation, 30-hour battery life, and fast charge.',
    images: ['#895129', '#f1f5f9', '#111827'],
    totalSales: 92,
  },
  {
    id: 'P-1002',
    name: 'Leather Wallet',
    vendor: 'Brown Barrel Foods',
    category: 'Accessories',
    price: 35,
    stock: 0,
    status: 'out_of_stock',
    country: 'BD',
    createdAt: '2025-02-20',
    description: 'Handcrafted leather wallet with 6 card slots and an RFID shield layer.',
    images: ['#111827', '#895129'],
    totalSales: 140,
  },
  {
    id: 'P-1003',
    name: 'Desk Lamp',
    vendor: 'Golden Grain',
    category: 'Home',
    price: 45,
    stock: 20,
    status: 'inactive',
    country: 'AE',
    createdAt: '2025-01-15',
    description: 'Minimal desk lamp with warm LED, adjustable neck, and touch dimmer.',
    images: ['#f8f9fb', '#895129', '#0f172a'],
    totalSales: 28,
  },
]

function formatMoney(value: number) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(value)
}

function StatusBadge({ status }: { status: ProductStatus }) {
  if (status === 'active') return <Badge variant="success">active</Badge>
  if (status === 'inactive') return <Badge variant="secondary">inactive</Badge>
  return <Badge variant="warning">out of stock</Badge>
}

function statusLabel(status: ProductStatus) {
  if (status === 'out_of_stock') return 'Out of Stock'
  return status[0].toUpperCase() + status.slice(1)
}

function productCardColor(product: ProductRow) {
  if (product.status === 'inactive') return 'bg-black/[0.02]'
  if (product.status === 'out_of_stock') return 'bg-amber-500/10'
  return 'bg-primary/10'
}

const MotionTableRow = motion(TableRow)

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductRow[]>(mockProducts)
  const [categories, setCategories] = useState<string[]>(() => {
    const set = new Set(mockProducts.map((p) => p.category))
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  })

  const [tab, setTab] = useState<'all' | ProductStatus>('all')
  const [q, setQ] = useState('')
  const [category, setCategory] = useState<string | 'all'>('all')
  const [status, setStatus] = useState<ProductStatus | 'all'>('all')
  const [country, setCountry] = useState<string | 'all'>('all')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')

  const [page, setPage] = useState(1)
  const pageSize = 8

  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())

  const [selected, setSelected] = useState<ProductRow | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [categoriesOpen, setCategoriesOpen] = useState(false)

  const [confirm, setConfirm] = useState<{
    kind: 'delete_one' | 'delete_bulk' | 'disable_bulk'
    productId?: string
  } | null>(null)

  const countries = useMemo(() => {
    const set = new Set(products.map((p) => p.country).filter(Boolean))
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [products])

  const stats = useMemo(() => {
    const total = products.length
    const active = products.filter((p) => p.status === 'active').length
    const outOfStock = products.filter((p) => p.status === 'out_of_stock').length
    const revenue = products.reduce((sum, p) => sum + p.totalSales * p.price, 0)
    return { total, active, outOfStock, revenue }
  }, [products])

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    const min = minPrice.trim() === '' ? undefined : Number(minPrice)
    const max = maxPrice.trim() === '' ? undefined : Number(maxPrice)

    return products.filter((p) => {
      const matchesTab = tab === 'all' || p.status === tab
      const matchesQuery =
        query.length === 0 ||
        p.name.toLowerCase().includes(query) ||
        p.vendor.toLowerCase().includes(query) ||
        p.id.toLowerCase().includes(query)
      const matchesCategory = category === 'all' || p.category === category
      const matchesStatus = status === 'all' || p.status === status
      const matchesCountry = country === 'all' || p.country === country
      const matchesMin = min === undefined || (!Number.isNaN(min) && p.price >= min)
      const matchesMax = max === undefined || (!Number.isNaN(max) && p.price <= max)
      return (
        matchesTab &&
        matchesQuery &&
        matchesCategory &&
        matchesStatus &&
        matchesCountry &&
        matchesMin &&
        matchesMax
      )
    })
  }, [products, tab, q, category, status, country, minPrice, maxPrice])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)

  const allVisibleSelected = paged.length > 0 && paged.every((p) => selectedIds.has(p.id))

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

  function applyBulkDisable() {
    if (selectedIds.size === 0) return
    setProducts((prev) =>
      prev.map((p) => (selectedIds.has(p.id) ? { ...p, status: 'inactive' } : p)),
    )
    setSelectedIds(new Set())
  }

  function applyBulkDelete() {
    if (selectedIds.size === 0) return
    setProducts((prev) => prev.filter((p) => !selectedIds.has(p.id)))
    setSelectedIds(new Set())
    setPage(1)
  }

  function applyBulkCategory(nextCategory: string) {
    if (selectedIds.size === 0) return
    if (!nextCategory) return
    setProducts((prev) =>
      prev.map((p) => (selectedIds.has(p.id) ? { ...p, category: nextCategory } : p)),
    )
    setSelectedIds(new Set())
  }

  function deleteOne(productId: string) {
    setProducts((prev) => prev.filter((p) => p.id !== productId))
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.delete(productId)
      return next
    })
    if (selected?.id === productId) setSelected(null)
  }

  function toggleActive(productId: string) {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p
        if (p.status === 'active') return { ...p, status: 'inactive' }
        if (p.status === 'inactive') return { ...p, status: p.stock === 0 ? 'out_of_stock' : 'active' }
        return p
      }),
    )
  }

  const selectedCount = selectedIds.size

  return (
    <PageShell
      title="Products"
      description="Manage products, categories, bulk actions, and status."
      right={
        <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
          <Input
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setPage(1)
            }}
            placeholder="Search product/vendor…"
            className="w-full md:w-[260px]"
          />
          <Button variant="outline" onClick={() => setCategoriesOpen(true)}>
            Manage Categories
          </Button>
        </div>
      }
    >
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Total Products', value: stats.total },
            { label: 'Active Products', value: stats.active },
            { label: 'Out of Stock', value: stats.outOfStock },
            { label: 'Total Revenue', value: formatMoney(stats.revenue) },
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
            <CardTitle>Product panel</CardTitle>
            <div className="text-sm text-muted-foreground">
              {filtered.length} results • {selectedCount} selected
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Tabs
              value={tab}
              onValueChange={(v) => {
                setTab(v as 'all' | ProductStatus)
                setPage(1)
                setSelectedIds(new Set())
              }}
            >
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="inactive">Inactive</TabsTrigger>
                <TabsTrigger value="out_of_stock">Out of Stock</TabsTrigger>
              </TabsList>

              <TabsContent value={tab} className="mt-3 space-y-3">
                <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
                  <select
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value)
                      setPage(1)
                    }}
                    className="h-10 rounded-lg border border-[#EEE7DF] bg-white px-3 text-sm"
                  >
                    <option value="all">All categories</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>

                  <select
                    value={status}
                    onChange={(e) => {
                      setStatus(e.target.value as ProductStatus | 'all')
                      setPage(1)
                    }}
                    className="h-10 rounded-lg border border-[#EEE7DF] bg-white px-3 text-sm"
                  >
                    <option value="all">All status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="out_of_stock">Out of Stock</option>
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

                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      inputMode="numeric"
                      value={minPrice}
                      onChange={(e) => {
                        setMinPrice(e.target.value)
                        setPage(1)
                      }}
                      placeholder="Min $"
                    />
                    <Input
                      inputMode="numeric"
                      value={maxPrice}
                      onChange={(e) => {
                        setMaxPrice(e.target.value)
                        setPage(1)
                      }}
                      placeholder="Max $"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={selectedIds.size === 0}
                      onClick={() => setConfirm({ kind: 'delete_bulk' })}
                    >
                      Delete selected
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={selectedIds.size === 0}
                      onClick={() => setConfirm({ kind: 'disable_bulk' })}
                    >
                      Disable selected
                    </Button>
                    <select
                      disabled={selectedIds.size === 0}
                      defaultValue=""
                      onChange={(e) => {
                        const nextCategory = e.target.value
                        if (!nextCategory) return
                        applyBulkCategory(nextCategory)
                        e.currentTarget.value = ''
                      }}
                      className="h-9 rounded-lg border border-[#EEE7DF] bg-white px-3 text-sm disabled:opacity-50"
                    >
                      <option value="">Change category…</option>
                      {categories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
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
                              if (checked) paged.forEach((p) => next.add(p.id))
                              else paged.forEach((p) => next.delete(p.id))
                              return next
                            })
                          }}
                          aria-label="Select all"
                        />
                      </TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Country</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paged.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-muted-foreground">
                          No products found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      paged.map((p) => (
                        <MotionTableRow
                          key={p.id}
                          whileHover={{ scale: 1.01 }}
                          transition={{ duration: 0.12 }}
                        >
                          <TableCell>
                            <input
                              type="checkbox"
                              checked={selectedIds.has(p.id)}
                              onChange={(e) => toggleSelected(p.id, e.target.checked)}
                              aria-label={`Select ${p.id}`}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className={`grid h-9 w-9 place-items-center rounded-lg ${productCardColor(p)}`}>
                                <span className="text-xs font-semibold text-foreground">
                                  {p.name
                                    .split(' ')
                                    .slice(0, 2)
                                    .map((w) => w[0]?.toUpperCase())
                                    .join('')}
                                </span>
                              </div>
                              <div className="leading-tight">
                                <div className="font-medium">{p.name}</div>
                                <div className="text-xs text-muted-foreground">{p.id}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{p.vendor}</TableCell>
                          <TableCell>{p.category}</TableCell>
                          <TableCell>{formatMoney(p.price)}</TableCell>
                          <TableCell>{p.stock}</TableCell>
                          <TableCell>{p.country}</TableCell>
                          <TableCell>
                            <StatusBadge status={p.status} />
                          </TableCell>
                          <TableCell className="text-muted-foreground">{p.createdAt}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => {
                                    setSelected(p)
                                    setEditMode(false)
                                  }}
                                  aria-label="View"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </motion.div>
                              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => {
                                    setSelected(p)
                                    setEditMode(true)
                                  }}
                                  aria-label="Edit"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </motion.div>
                              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => setConfirm({ kind: 'delete_one', productId: p.id })}
                                  aria-label="Delete"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </motion.div>
                              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                                {p.status === 'active' ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => toggleActive(p.id)}
                                  >
                                    Disable
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    className="bg-emerald-600 text-white hover:bg-emerald-600/90"
                                    onClick={() => toggleActive(p.id)}
                                  >
                                    Enable
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
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>

      <Dialog
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) {
            setSelected(null)
            setEditMode(false)
          }
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editMode ? 'Edit product' : 'Product details'}</DialogTitle>
            <DialogDescription>
              {selected ? `${selected.name} • ${statusLabel(selected.status)}` : ''}
            </DialogDescription>
          </DialogHeader>

          {!selected ? null : (
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }} className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-[#EEE7DF] p-4">
                  <div className="text-sm font-medium">Basic info</div>
                  <div className="mt-3 space-y-2 text-sm">
                    {editMode ? (
                      <>
                        <Input
                          value={selected.name}
                          onChange={(e) => setSelected({ ...selected, name: e.target.value })}
                        />
                        <Input
                          value={selected.vendor}
                          onChange={(e) => setSelected({ ...selected, vendor: e.target.value })}
                          placeholder="Vendor"
                        />
                        <select
                          value={selected.category}
                          onChange={(e) => setSelected({ ...selected, category: e.target.value })}
                          className="h-10 w-full rounded-lg border border-[#EEE7DF] bg-white px-3 text-sm"
                        >
                          {categories.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            inputMode="numeric"
                            value={String(selected.price)}
                            onChange={(e) =>
                              setSelected({ ...selected, price: Number(e.target.value || 0) })
                            }
                            placeholder="Price"
                          />
                          <Input
                            inputMode="numeric"
                            value={String(selected.stock)}
                            onChange={(e) =>
                              setSelected({ ...selected, stock: Number(e.target.value || 0) })
                            }
                            placeholder="Stock"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center justify-between">
                          <div className="text-muted-foreground">Name</div>
                          <div className="font-medium">{selected.name}</div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-muted-foreground">Vendor</div>
                          <div className="font-medium">{selected.vendor}</div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-muted-foreground">Category</div>
                          <div className="font-medium">{selected.category}</div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-muted-foreground">Price</div>
                          <div className="font-medium">{formatMoney(selected.price)}</div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-muted-foreground">Stock</div>
                          <div className="font-medium">{selected.stock}</div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="rounded-lg border border-[#EEE7DF] p-4">
                  <div className="text-sm font-medium">Sales info</div>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-lg bg-black/[0.02] p-3">
                      <div className="text-xs text-muted-foreground">Total sales</div>
                      <div className="text-base font-semibold">{selected.totalSales}</div>
                    </div>
                    <div className="rounded-lg bg-black/[0.02] p-3">
                      <div className="text-xs text-muted-foreground">Revenue</div>
                      <div className="text-base font-semibold">
                        {formatMoney(selected.totalSales * selected.price)}
                      </div>
                    </div>
                    <div className="rounded-lg bg-black/[0.02] p-3 col-span-2">
                      <div className="text-xs text-muted-foreground">Status</div>
                      <div className="mt-1 flex items-center justify-between">
                        <StatusBadge status={selected.status} />
                        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                          <Button
                            size="sm"
                            variant={selected.status === 'active' ? 'outline' : 'default'}
                            onClick={() => {
                              toggleActive(selected.id)
                              setSelected((prev) =>
                                !prev
                                  ? prev
                                  : {
                                      ...prev,
                                      status:
                                        prev.status === 'active'
                                          ? 'inactive'
                                          : prev.stock === 0
                                            ? 'out_of_stock'
                                            : 'active',
                                    },
                              )
                            }}
                          >
                            {selected.status === 'active' ? 'Disable' : 'Enable'}
                          </Button>
                        </motion.div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-[#EEE7DF] p-4">
                <div className="text-sm font-medium">Description</div>
                <div className="mt-2 text-sm text-muted-foreground">
                  {editMode ? (
                    <textarea
                      value={selected.description}
                      onChange={(e) => setSelected({ ...selected, description: e.target.value })}
                      className="min-h-24 w-full rounded-lg border border-[#EEE7DF] bg-white p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                    />
                  ) : (
                    selected.description
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-[#EEE7DF] p-4">
                <div className="text-sm font-medium">Images</div>
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {selected.images.map((c, idx) => (
                    <div
                      key={`${selected.id}-img-${idx}`}
                      className="h-28 rounded-lg border border-[#EEE7DF]"
                      style={{ background: c }}
                    />
                  ))}
                </div>
              </div>

              <DialogFooter>
                {editMode ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelected(null)
                        setEditMode(false)
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => {
                        setProducts((prev) =>
                          prev.map((p) => (p.id === selected.id ? selected : p)),
                        )
                        if (!categories.includes(selected.category)) {
                          setCategories((prev) =>
                            [...prev, selected.category].sort((a, b) => a.localeCompare(b)),
                          )
                        }
                        setSelected(null)
                        setEditMode(false)
                      }}
                    >
                      Save changes
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelected(null)
                      setEditMode(false)
                    }}
                  >
                    Close
                  </Button>
                )}
              </DialogFooter>
            </motion.div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={categoriesOpen} onOpenChange={setCategoriesOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Manage categories</DialogTitle>
            <DialogDescription>Add, edit, and delete categories (demo).</DialogDescription>
          </DialogHeader>

          <CategoryManager
            categories={categories}
            onChange={(next) => {
              setCategories(next)
              // if selected filter no longer exists, reset
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

      <Dialog open={!!confirm} onOpenChange={(open) => !open && setConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirm?.kind === 'delete_one'
                ? 'Delete product?'
                : confirm?.kind === 'delete_bulk'
                  ? 'Delete selected products?'
                  : 'Disable selected products?'}
            </DialogTitle>
            <DialogDescription>
              {confirm?.kind === 'delete_one'
                ? 'This will remove the product from the list.'
                : confirm?.kind === 'delete_bulk'
                  ? `This will remove ${selectedCount} products from the list.`
                  : `This will mark ${selectedCount} products as inactive.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirm(null)}>
              Cancel
            </Button>
            {confirm?.kind === 'delete_one' ? (
              <Button
                variant="destructive"
                onClick={() => {
                  if (confirm.productId) deleteOne(confirm.productId)
                  setConfirm(null)
                }}
              >
                Delete
              </Button>
            ) : confirm?.kind === 'delete_bulk' ? (
              <Button
                variant="destructive"
                onClick={() => {
                  applyBulkDelete()
                  setConfirm(null)
                }}
              >
                Delete selected
              </Button>
            ) : (
              <Button
                onClick={() => {
                  applyBulkDisable()
                  setConfirm(null)
                }}
              >
                Disable selected
              </Button>
            )}
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
              className="flex items-center justify-between rounded-lg border border-[#EEE7DF] p-3"
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

