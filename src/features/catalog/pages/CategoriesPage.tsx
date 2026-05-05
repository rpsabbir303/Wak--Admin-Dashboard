import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown, ImageIcon, Pencil, Star, Trash2, Upload } from 'lucide-react'

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
  type AdminCategory,
  CATEGORY_RENAMED_EVENT,
  CATALOG_PRODUCTS_UPDATED_EVENT,
  loadCategories,
  previewCountsFromSeed,
  saveCategories,
  slugify,
} from '@/features/catalog/lib/categoriesStorage'
import type { ProductRow } from '@/features/catalog/lib/mockProductsData'
import { MOCK_PRODUCTS_SEED } from '@/features/catalog/lib/mockProductsData'

const MotionTableRow = motion(TableRow)

function CategoryThumbnail({ url }: { url: string }) {
  const t = url.trim()
  const isHex = /^#([0-9a-f]{3,8})$/i.test(t)
  const looksLikeUrl =
    t.startsWith('http://') || t.startsWith('https://') || t.startsWith('data:') || t.startsWith('/')
  if (looksLikeUrl) {
    return (
      <img
        src={t}
        alt=""
        className="h-10 w-10 rounded-lg border border-[#EEE7DF] object-cover"
      />
    )
  }
  return (
    <div
      className="h-10 w-10 shrink-0 rounded-lg border border-[#EEE7DF]"
      style={{ background: isHex ? t : '#f4f4f5' }}
    />
  )
}

/** Fills a square container (e.g. modal uploader preview). */
function CategoryImageFill({ url }: { url: string }) {
  const t = url.trim()
  const isHex = /^#([0-9a-f]{3,8})$/i.test(t)
  const looksLikeUrl =
    t.startsWith('http://') || t.startsWith('https://') || t.startsWith('data:') || t.startsWith('/')
  if (looksLikeUrl) {
    return <img src={t} alt="" className="h-full w-full object-cover" />
  }
  return <div className="h-full w-full" style={{ background: isHex ? t : '#f4f4f5' }} />
}

function StatusBadge({ active }: { active: boolean }) {
  return active ? (
    <Badge variant="success">active</Badge>
  ) : (
    <Badge variant="secondary">inactive</Badge>
  )
}

function FeaturedToggle({
  featured,
  onToggle,
}: {
  featured: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={featured}
      onClick={(e) => {
        e.stopPropagation()
        onToggle()
      }}
      className={
        featured
          ? 'inline-flex h-7 w-12 shrink-0 items-center justify-end rounded-full bg-primary p-0.5 transition-colors'
          : 'inline-flex h-7 w-12 shrink-0 items-center justify-start rounded-full bg-muted p-0.5 transition-colors'
      }
    >
      <span className="block h-5 w-5 rounded-full bg-white shadow-sm" />
    </button>
  )
}

/** Compact switch for dialogs (smaller thumb / track). */
function CompactSwitch({
  checked,
  onCheckedChange,
  id,
}: {
  checked: boolean
  onCheckedChange: () => void
  id?: string
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onCheckedChange}
      className={
        checked
          ? 'inline-flex h-5 w-9 shrink-0 items-center justify-end rounded-full bg-primary p-px transition-colors'
          : 'inline-flex h-5 w-9 shrink-0 items-center justify-start rounded-full bg-[#e7e5e4] p-px transition-colors'
      }
    >
      <span className="pointer-events-none block h-4 w-4 rounded-full bg-white shadow-sm ring-1 ring-black/[0.06]" />
    </button>
  )
}

type CategoryFormDraft = {
  id?: string
  name: string
  slug: string
  imageUrl: string
  featured: boolean
  active: boolean
}

function emptyDraft(): CategoryFormDraft {
  return {
    name: '',
    slug: '',
    imageUrl: '',
    featured: false,
    active: true,
  }
}

export default function CategoriesPage() {
  const [rows, setRows] = useState<AdminCategory[]>(() => loadCategories())
  const [productCounts, setProductCounts] = useState<Record<string, number>>(previewCountsFromSeed)

  const [q, setQ] = useState('')
  const [featuredFilter, setFeaturedFilter] = useState<'all' | 'yes' | 'no'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [page, setPage] = useState(1)
  const pageSize = 8

  const [modalOpen, setModalOpen] = useState(false)
  const [draft, setDraft] = useState(emptyDraft())
  const [originalNameForRename, setOriginalNameForRename] = useState<string | null>(null)
  const modalFileInputRef = useRef<HTMLInputElement>(null)
  const [imageDropActive, setImageDropActive] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<AdminCategory | null>(null)

  const persist = useCallback((next: AdminCategory[]) => {
    setRows(next)
    saveCategories(next)
  }, [])

  useEffect(() => {
    const onProducts = (e: Event) => {
      const detail = (e as CustomEvent<ProductRow[]>).detail
      if (!Array.isArray(detail)) return
      const map: Record<string, number> = {}
      for (const p of detail) {
        map[p.category] = (map[p.category] ?? 0) + 1
      }
      setProductCounts(map)
    }
    window.addEventListener(CATALOG_PRODUCTS_UPDATED_EVENT, onProducts as EventListener)
    window.dispatchEvent(new CustomEvent<ProductRow[]>(CATALOG_PRODUCTS_UPDATED_EVENT, { detail: MOCK_PRODUCTS_SEED }))
    return () => window.removeEventListener(CATALOG_PRODUCTS_UPDATED_EVENT, onProducts as EventListener)
  }, [])

  useEffect(() => {
    const syncFromStorage = () => setRows(loadCategories())
    window.addEventListener('storage', syncFromStorage)
    return () => window.removeEventListener('storage', syncFromStorage)
  }, [])

  const stats = useMemo(() => {
    const total = rows.length
    const featured = rows.filter((c) => c.featured).length
    const active = rows.filter((c) => c.active).length
    const hidden = rows.filter((c) => !c.active).length
    return { total, featured, active, hidden }
  }, [rows])

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    return rows.filter((c) => {
      const matchesQ =
        query.length === 0 ||
        c.name.toLowerCase().includes(query) ||
        c.slug.toLowerCase().includes(query)
      const matchesFeat =
        featuredFilter === 'all' ||
        (featuredFilter === 'yes' ? c.featured : !c.featured)
      const matchesStat =
        statusFilter === 'all' ||
        (statusFilter === 'active' ? c.active : !c.active)
      return matchesQ && matchesFeat && matchesStat
    })
  }, [rows, q, featuredFilter, statusFilter])

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

  function openCreate() {
    setOriginalNameForRename(null)
    setDraft(emptyDraft())
    setModalOpen(true)
  }

  function openEdit(row: AdminCategory) {
    setOriginalNameForRename(row.name)
    setDraft({
      id: row.id,
      name: row.name,
      slug: row.slug,
      imageUrl: row.imageUrl,
      featured: row.featured,
      active: row.active,
    })
    setModalOpen(true)
  }

  const readImageFiles = useCallback((files: FileList | File[] | null) => {
    const file = files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      if (result) setDraft((d) => ({ ...d, imageUrl: result }))
    }
    reader.readAsDataURL(file)
  }, [])

  function upsertDraft() {
    const name = draft.name.trim()
    const slug = slugify(draft.slug.trim() || name)
    if (!name || !slug) return

    const slugTaken = rows.some((c) => c.slug === slug && c.id !== draft.id)
    if (slugTaken) return

    if (draft.id) {
      const prev = rows.find((c) => c.id === draft.id)
      if (!prev) return

      const nextRows = rows.map((c) =>
        c.id === draft.id
          ? {
              ...c,
              name,
              slug,
              imageUrl: draft.imageUrl.trim() || '#f4f4f5',
              featured: draft.featured,
              active: draft.active,
            }
          : c,
      )

      const oldNameForProducts = prev.name
      if (originalNameForRename !== null && oldNameForProducts !== name) {
        window.dispatchEvent(
          new CustomEvent<{ from: string; to: string }>(CATEGORY_RENAMED_EVENT, {
            detail: { from: oldNameForProducts, to: name },
          }),
        )
      }

      persist(nextRows)
    } else {
      const row: AdminCategory = {
        id: `cat-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
        name,
        slug,
        description: '',
        imageUrl: draft.imageUrl.trim() || '#f4f4f5',
        featured: draft.featured,
        active: draft.active,
        parentId: null,
        createdAt: new Date().toISOString().slice(0, 10),
      }
      persist([...rows, row])
    }
    setModalOpen(false)
    setDraft(emptyDraft())
    setOriginalNameForRename(null)
  }

  function removeRow(id: string) {
    persist(rows.filter((c) => c.id !== id && c.parentId !== id))
    setDeleteTarget(null)
    setPage(1)
  }

  function toggleFeatured(id: string) {
    persist(
      rows.map((c) => (c.id === id ? { ...c, featured: !c.featured } : c)),
    )
  }

  function setHidden(id: string) {
    persist(rows.map((c) => (c.id === id ? { ...c, active: false } : c)))
  }

  function setActive(id: string) {
    persist(rows.map((c) => (c.id === id ? { ...c, active: true } : c)))
  }

  return (
    <PageShell
      title="Categories"
      description="Manage catalog categories, featured storefront placement, and visibility."
      right={
        <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
          <Input
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setPage(1)
            }}
            placeholder="Search category…"
            className="w-full md:w-[260px]"
          />
          <select
            value={featuredFilter}
            onChange={(e) => {
              setFeaturedFilter(e.target.value as typeof featuredFilter)
              setPage(1)
            }}
            className="h-10 rounded-lg border border-[#EEE7DF] bg-white px-3 text-sm"
          >
            <option value="all">Featured: all</option>
            <option value="yes">Featured</option>
            <option value="no">Not featured</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as typeof statusFilter)
              setPage(1)
            }}
            className="h-10 rounded-lg border border-[#EEE7DF] bg-white px-3 text-sm"
          >
            <option value="all">Status: all</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            type="button"
            onClick={openCreate}
          >
            Add category
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
            { label: 'Total Categories', value: stats.total },
            { label: 'Featured Categories', value: stats.featured },
            { label: 'Active Categories', value: stats.active },
            { label: 'Hidden Categories', value: stats.hidden },
          ].map((s, idx) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: idx * 0.05 }}
              whileHover={{ y: -4 }}
            >
              <Card className="h-full rounded-2xl border border-[#89512914] bg-white transition-shadow hover:shadow-[0_10px_24px_rgba(137,81,41,0.10)]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
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
            <CardTitle>Categories</CardTitle>
            <div className="text-sm text-muted-foreground">{filtered.length} total</div>
          </CardHeader>
          <CardContent>
            <div className="w-full overflow-x-auto">
              <Table className="w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[72px] py-3 text-xs font-medium uppercase tracking-wide text-[#895129b3]">
                      Image
                    </TableHead>
                    <TableHead className="min-w-[160px] py-3 text-xs font-medium uppercase tracking-wide text-[#895129b3]">
                      Category Name
                    </TableHead>
                    <TableHead className="min-w-[120px] py-3 text-xs font-medium uppercase tracking-wide text-[#895129b3]">
                      Slug
                    </TableHead>
                    <TableHead className="w-[110px] py-3 text-center text-xs font-medium uppercase tracking-wide text-[#895129b3]">
                      Total Products
                    </TableHead>
                    <TableHead className="w-[100px] py-3 text-center text-xs font-medium uppercase tracking-wide text-[#895129b3]">
                      Featured
                    </TableHead>
                    <TableHead className="w-[110px] py-3 text-xs font-medium uppercase tracking-wide text-[#895129b3]">
                      Status
                    </TableHead>
                    <TableHead className="w-[120px] py-3 text-xs font-medium uppercase tracking-wide text-[#895129b3]">
                      Created
                    </TableHead>
                    <TableHead className="w-[140px] py-3 pr-6 text-right text-xs font-medium uppercase tracking-wide text-[#895129b3]">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="py-10">
                        <div className="text-center text-sm text-muted-foreground">
                          No categories match your filters.
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paged.map((row) => (
                      <MotionTableRow
                        key={row.id}
                        whileHover={{ scale: 1.005 }}
                        transition={{ duration: 0.12 }}
                      >
                        <TableCell className="py-3 align-middle">
                          <CategoryThumbnail url={row.imageUrl} />
                        </TableCell>
                        <TableCell className="py-3 align-middle font-medium">{row.name}</TableCell>
                        <TableCell className="py-3 align-middle text-muted-foreground">{row.slug}</TableCell>
                        <TableCell className="py-3 text-center align-middle tabular-nums">
                          {productCounts[row.name] ?? 0}
                        </TableCell>
                        <TableCell className="py-3 text-center align-middle">
                          <FeaturedToggle
                            featured={row.featured}
                            onToggle={() => toggleFeatured(row.id)}
                          />
                        </TableCell>
                        <TableCell className="py-3 align-middle">
                          <StatusBadge active={row.active} />
                        </TableCell>
                        <TableCell className="py-3 align-middle text-muted-foreground">
                          {row.createdAt?.slice?.(0, 10) ?? '—'}
                        </TableCell>
                        <TableCell className="w-[140px] py-3 pr-6 text-right align-middle">
                          <div className="flex items-center justify-end">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  type="button"
                                  className="h-9 w-[120px] justify-between rounded-lg border border-[#89512920] bg-white px-3 text-xs text-[#895129] hover:bg-[#faf7f3]"
                                >
                                  Actions
                                  <ChevronDown className="h-3.5 w-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="min-w-[10rem]">
                                <DropdownMenuItem onClick={() => openEdit(row)}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => toggleFeatured(row.id)}>
                                  <Star className="mr-2 h-4 w-4" />
                                  {row.featured ? 'Unfeature' : 'Feature'}
                                </DropdownMenuItem>
                                {row.active ? (
                                  <DropdownMenuItem onClick={() => setHidden(row.id)}>
                                    Hide
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem onClick={() => setActive(row.id)}>
                                    Activate
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600 focus:text-red-600"
                                  onClick={() => setDeleteTarget(row)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </MotionTableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 px-3"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Prev
                </Button>
                {pageNumbers.map((pNum) => (
                  <Button
                    key={pNum}
                    variant={pNum === page ? 'default' : 'outline'}
                    size="sm"
                    className="h-9 w-9 px-0"
                    onClick={() => setPage(pNum)}
                  >
                    {pNum}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 px-3"
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

      <Dialog
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open)
          if (!open) {
            setImageDropActive(false)
            if (modalFileInputRef.current) modalFileInputRef.current.value = ''
          }
        }}
      >
        <DialogContent className="max-w-[400px] gap-0 p-4 sm:max-w-[420px] sm:p-5">
          <DialogHeader className="space-y-1 pb-3">
            <DialogTitle className="text-base">{draft.id ? 'Edit category' : 'Add category'}</DialogTitle>
            <DialogDescription className="text-xs leading-snug">
              Name, image, and visibility for catalog and storefront.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-2.5">
            <div className="grid gap-1">
              <label htmlFor="cat-name" className="text-xs font-medium text-muted-foreground">
                Category name
              </label>
              <Input
                id="cat-name"
                className="h-9 text-sm"
                value={draft.name}
                onChange={(e) =>
                  setDraft((d) => {
                    const name = e.target.value
                    const auto = slugify(d.name)
                    const nextSlug =
                      d.slug.trim() === '' || d.slug === auto ? slugify(name) : d.slug
                    return { ...d, name, slug: nextSlug }
                  })
                }
              />
            </div>
            <div className="grid gap-1">
              <label htmlFor="cat-slug" className="text-xs font-medium text-muted-foreground">
                Slug
              </label>
              <Input
                id="cat-slug"
                className="h-9 text-sm"
                value={draft.slug}
                onChange={(e) => setDraft((d) => ({ ...d, slug: e.target.value }))}
              />
            </div>

            <div className="grid gap-1">
              <span className="text-xs font-medium text-muted-foreground">Category image</span>
              <input
                ref={modalFileInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                aria-label="Upload category image"
                onChange={(e) => {
                  readImageFiles(e.target.files)
                  e.target.value = ''
                }}
              />
              <div
                onDragEnter={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setImageDropActive(true)
                }}
                onDragOver={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setImageDropActive(true)
                }}
                onDragLeave={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) setImageDropActive(false)
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setImageDropActive(false)
                  readImageFiles(e.dataTransfer.files)
                }}
                className={
                  imageDropActive
                    ? 'flex items-center gap-3 rounded-xl border border-dashed border-primary bg-primary/5 px-2.5 py-2 outline-none ring-2 ring-primary/25 transition-colors'
                    : 'flex items-center gap-3 rounded-xl border border-dashed border-[#89512930] bg-[#faf9f7] px-2.5 py-2 outline-none transition-colors'
                }
              >
                <div className="relative h-[52px] w-[52px] shrink-0 overflow-hidden rounded-xl border border-[#EEE7DF] bg-white">
                  {draft.imageUrl.trim() ? (
                    <CategoryImageFill url={draft.imageUrl} />
                  ) : (
                    <div className="grid h-full w-full place-items-center">
                      <ImageIcon className="h-7 w-7 text-muted-foreground/55" aria-hidden />
                    </div>
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 w-fit gap-1.5 rounded-lg border-[#89512920] px-3 text-xs text-[#895129] hover:bg-[#faf7f3]"
                    onClick={() => modalFileInputRef.current?.click()}
                  >
                    <Upload className="h-3.5 w-3.5" aria-hidden />
                    Upload image
                  </Button>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    JPG, PNG · drop file here
                  </p>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-[#EEE7DF]">
              <div className="flex h-10 items-center justify-between gap-3 border-b border-[#EEE7DF] px-3 last:border-b-0">
                <label htmlFor="switch-featured" className="text-sm font-medium text-foreground">
                  Featured
                </label>
                <CompactSwitch
                  id="switch-featured"
                  checked={draft.featured}
                  onCheckedChange={() => setDraft((d) => ({ ...d, featured: !d.featured }))}
                />
              </div>
              <div className="flex h-10 items-center justify-between gap-3 px-3">
                <label htmlFor="switch-active" className="text-sm font-medium text-foreground">
                  Active
                </label>
                <CompactSwitch
                  id="switch-active"
                  checked={draft.active}
                  onCheckedChange={() => setDraft((d) => ({ ...d, active: !d.active }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="mt-3 gap-1.5 pt-0 sm:justify-end">
            <Button
              variant="outline"
              type="button"
              size="sm"
              className="h-9 rounded-lg border-[#89512920] px-4 text-sm"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-9 rounded-lg bg-primary px-4 text-sm text-primary-foreground hover:bg-primary/90"
              onClick={upsertDraft}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete category?</DialogTitle>
            <DialogDescription>
              {deleteTarget
                ? `This will permanently remove "${deleteTarget.name}". Products still assigned keep the label until reassigned on the Products page.`
                : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              type="button"
              onClick={() => deleteTarget && removeRow(deleteTarget.id)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  )
}
