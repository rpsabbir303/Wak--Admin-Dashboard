import { motion } from 'framer-motion'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { StatusBadge } from '@/components/shared/StatusBadge'
import type { ProductRow } from '@/features/catalog/lib/mockProductsData'
import { formatMoney, productCardColor } from '@/features/catalog/utils/productFormatters'
import { ProductRowActions } from '@/features/catalog/components/products/ProductRowActions'

const MotionTableRow = motion(TableRow)

type Props = {
  paged: ProductRow[]
  selectedIds: Set<string>
  allVisibleSelected: boolean
  onToggleSelectAllVisible: (checked: boolean) => void
  onToggleSelected: (id: string, checked: boolean) => void
  onView: (product: ProductRow) => void
  onEdit: (product: ProductRow) => void
  onDelete: (product: ProductRow) => void
  onToggleActive: (productId: string) => void
}

export function ProductTable({
  paged,
  selectedIds,
  allVisibleSelected,
  onToggleSelectAllVisible,
  onToggleSelected,
  onView,
  onEdit,
  onDelete,
  onToggleActive,
}: Props) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10">
            <input
              type="checkbox"
              checked={allVisibleSelected}
              onChange={(e) => onToggleSelectAllVisible(e.target.checked)}
              aria-label="Select all"
            />
          </TableHead>
          <TableHead className="w-[220px]">Product</TableHead>
          <TableHead className="w-[150px]">Vendor</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Price</TableHead>
          <TableHead>Stock</TableHead>
          <TableHead>Country</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Created</TableHead>
          <TableHead className="w-[220px] pr-4 text-right whitespace-nowrap">Actions</TableHead>
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
              <TableCell className="align-middle py-3">
                <input
                  type="checkbox"
                  checked={selectedIds.has(p.id)}
                  onChange={(e) => onToggleSelected(p.id, e.target.checked)}
                  aria-label={`Select ${p.id}`}
                />
              </TableCell>
              <TableCell className="align-middle py-3">
                <div className="flex items-center gap-3">
                  <div className={`grid h-8 w-8 place-items-center rounded-lg ${productCardColor(p)}`}>
                    <span className="text-xs font-semibold text-foreground">
                      {p.name
                        .split(' ')
                        .slice(0, 2)
                        .map((w) => w[0]?.toUpperCase())
                        .join('')}
                    </span>
                  </div>
                  <div className="min-w-0 truncate font-medium leading-tight">{p.name}</div>
                </div>
              </TableCell>
              <TableCell className="align-middle py-3">
                <span className="truncate text-foreground">{p.vendor}</span>
              </TableCell>
              <TableCell className="align-middle py-3">{p.category}</TableCell>
              <TableCell className="align-middle py-3">{formatMoney(p.price)}</TableCell>
              <TableCell className="align-middle py-3">{p.stock}</TableCell>
              <TableCell className="align-middle py-3">{p.country}</TableCell>
              <TableCell className="align-middle py-3">
                <StatusBadge status={p.status} />
              </TableCell>
              <TableCell className="align-middle py-3 text-muted-foreground">{p.createdAt}</TableCell>
              <TableCell className="w-[220px] align-middle py-3 pr-4 text-right">
                <ProductRowActions
                  product={p}
                  onView={onView}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onToggleActive={onToggleActive}
                />
              </TableCell>
            </MotionTableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}

