import type { Dispatch, SetStateAction } from 'react'
import { motion } from 'framer-motion'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { StatusBadge } from '@/components/shared/StatusBadge'
import type { ProductRow } from '@/features/catalog/lib/mockProductsData'
import { formatMoney, statusLabel } from '@/features/catalog/utils/productFormatters'

type Props = {
  selected: ProductRow | null
  setSelected: Dispatch<SetStateAction<ProductRow | null>>
  editMode: boolean
  setEditMode: (value: boolean) => void
  categories: string[]
  onToggleActive: (productId: string) => void
  onSaveEdited: (next: ProductRow) => void
}

export function ProductDetailsDialog({
  selected,
  setSelected,
  editMode,
  setEditMode,
  categories,
  onToggleActive,
  onSaveEdited,
}: Props) {
  return (
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
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
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
                            onToggleActive(selected.id)
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
                      onSaveEdited(selected)
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
  )
}

