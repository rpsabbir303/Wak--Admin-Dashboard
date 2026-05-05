import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

import { PageShell } from '@/components/PageShell'
import { SectionPagination } from '@/components/shared/SectionPagination'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  CATEGORY_RENAMED_EVENT,
  CATALOG_PRODUCTS_UPDATED_EVENT,
  CATEGORIES_UPDATED_EVENT,
  loadCategories,
  mergedCategoryNamesForProducts,
} from '@/features/catalog/lib/categoriesStorage'
import { ProductBulkActions } from '@/features/catalog/components/products/ProductBulkActions'
import { ProductConfirmDialog } from '@/features/catalog/components/products/ProductConfirmDialog'
import { ProductDetailsDialog } from '@/features/catalog/components/products/ProductDetailsDialog'
import { ProductFiltersBar } from '@/features/catalog/components/products/ProductFiltersBar'
import { ProductStatsCards } from '@/features/catalog/components/products/ProductStatsCards'
import { ProductTable } from '@/features/catalog/components/products/ProductTable'
import type { ProductRow } from '@/features/catalog/lib/mockProductsData'
import { MOCK_PRODUCTS_SEED } from '@/features/catalog/lib/mockProductsData'
import type { ProductStatus } from '@/features/catalog/utils/productFormatters'

type ProductOwnerType = ProductRow['productOwnerType']

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductRow[]>(MOCK_PRODUCTS_SEED)
  const [catTick, setCatTick] = useState(0)

  const categories = useMemo(
    () => mergedCategoryNamesForProducts(products, loadCategories()),
    [products, catTick],
  )

  const [tab, setTab] = useState<'all' | ProductStatus>('all')
  const [q, setQ] = useState('')
  const [category, setCategory] = useState<string | 'all'>('all')
  const [ownerType, setOwnerType] = useState<'all' | ProductOwnerType>('all')
  const [status, setStatus] = useState<ProductStatus | 'all'>('all')
  const [country, setCountry] = useState<string | 'all'>('all')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')

  const [page, setPage] = useState(1)
  const pageSize = 8

  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())
  const [selected, setSelected] = useState<ProductRow | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [confirm, setConfirm] = useState<{
    kind: 'delete_one' | 'delete_bulk' | 'disable_bulk'
    productId?: string
  } | null>(null)

  const countries = useMemo(() => {
    const set = new Set(products.map((p) => p.country).filter(Boolean))
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [products])

  useEffect(() => {
    window.dispatchEvent(new CustomEvent<ProductRow[]>(CATALOG_PRODUCTS_UPDATED_EVENT, { detail: products }))
  }, [products])

  useEffect(() => {
    const bump = () => setCatTick((t) => t + 1)
    window.addEventListener(CATEGORIES_UPDATED_EVENT, bump)
    return () => window.removeEventListener(CATEGORIES_UPDATED_EVENT, bump)
  }, [])

  useEffect(() => {
    const onRename = (e: Event) => {
      const detail = (e as CustomEvent<{ from: string; to: string }>).detail
      if (!detail?.from || detail.to === undefined) return
      setProducts((prev) =>
        prev.map((p) => (p.category === detail.from ? { ...p, category: detail.to } : p)),
      )
    }
    window.addEventListener(CATEGORY_RENAMED_EVENT, onRename)
    return () => window.removeEventListener(CATEGORY_RENAMED_EVENT, onRename)
  }, [])

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
        p.vendor.toLowerCase().includes(query)
      const matchesCategory = category === 'all' || p.category === category
      const matchesStatus = status === 'all' || p.status === status
      const matchesOwnerType = ownerType === 'all' || p.productOwnerType === ownerType
      const matchesCountry = country === 'all' || p.country === country
      const matchesMin = min === undefined || (!Number.isNaN(min) && p.price >= min)
      const matchesMax = max === undefined || (!Number.isNaN(max) && p.price <= max)
      return (
        matchesTab &&
        matchesQuery &&
        matchesCategory &&
        matchesStatus &&
        matchesOwnerType &&
        matchesCountry &&
        matchesMin &&
        matchesMax
      )
    })
  }, [products, tab, q, category, status, ownerType, country, minPrice, maxPrice])

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
    setProducts((prev) => prev.map((p) => (selectedIds.has(p.id) ? { ...p, status: 'inactive' } : p)))
    setSelectedIds(new Set())
  }

  function applyBulkDelete() {
    if (selectedIds.size === 0) return
    setProducts((prev) => prev.filter((p) => !selectedIds.has(p.id)))
    setSelectedIds(new Set())
    setPage(1)
  }

  function applyBulkCategory(nextCategory: string) {
    if (selectedIds.size === 0 || !nextCategory) return
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
          <Button variant="outline" asChild>
            <Link to="/admin/categories">Manage Categories</Link>
          </Button>
          <Button asChild>
            <Link to="/products/add">Add Product</Link>
          </Button>
        </div>
      }
    >
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-4">
        <ProductStatsCards stats={stats} />

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Product panel</CardTitle>
            <div className="text-sm text-muted-foreground">
              {filtered.length} results • {selectedIds.size} selected
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
                <ProductFiltersBar
                  category={category}
                  setCategory={setCategory}
                  ownerType={ownerType}
                  setOwnerType={setOwnerType}
                  status={status}
                  setStatus={setStatus}
                  country={country}
                  setCountry={setCountry}
                  minPrice={minPrice}
                  setMinPrice={setMinPrice}
                  maxPrice={maxPrice}
                  setMaxPrice={setMaxPrice}
                  categories={categories}
                  countries={countries}
                  onResetPage={() => setPage(1)}
                />

                <ProductBulkActions
                  selectedCount={selectedIds.size}
                  categories={categories}
                  onDeleteSelected={() => setConfirm({ kind: 'delete_bulk' })}
                  onDisableSelected={() => setConfirm({ kind: 'disable_bulk' })}
                  onChangeCategory={applyBulkCategory}
                  onClearSelection={() => setSelectedIds(new Set())}
                />

                <ProductTable
                  paged={paged}
                  selectedIds={selectedIds}
                  allVisibleSelected={allVisibleSelected}
                  onToggleSelectAllVisible={(checked) => {
                    setSelectedIds((prev) => {
                      const next = new Set(prev)
                      if (checked) paged.forEach((p) => next.add(p.id))
                      else paged.forEach((p) => next.delete(p.id))
                      return next
                    })
                  }}
                  onToggleSelected={toggleSelected}
                  onView={(p) => {
                    setSelected(p)
                    setEditMode(false)
                  }}
                  onEdit={(p) => {
                    setSelected(p)
                    setEditMode(true)
                  }}
                  onDelete={(p) => setConfirm({ kind: 'delete_one', productId: p.id })}
                  onToggleActive={toggleActive}
                />

                <SectionPagination
                  page={page}
                  totalPages={totalPages}
                  pageNumbers={pageNumbers}
                  onChangePage={setPage}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>

      <ProductDetailsDialog
        selected={selected}
        setSelected={setSelected}
        editMode={editMode}
        setEditMode={setEditMode}
        categories={categories}
        onToggleActive={toggleActive}
        onSaveEdited={(next) =>
          setProducts((prev) => prev.map((p) => (p.id === next.id ? next : p)))
        }
      />

      <ProductConfirmDialog
        confirm={confirm}
        selectedCount={selectedIds.size}
        onClose={() => setConfirm(null)}
        onDeleteOne={deleteOne}
        onDeleteBulk={applyBulkDelete}
        onDisableBulk={applyBulkDisable}
      />
    </PageShell>
  )
}

