import { motion } from 'framer-motion'
import { Eye, Pencil, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { ProductRow } from '@/features/catalog/lib/mockProductsData'

type Props = {
  product: ProductRow
  onView: (product: ProductRow) => void
  onEdit: (product: ProductRow) => void
  onDelete: (product: ProductRow) => void
  onToggleActive: (productId: string) => void
}

export function ProductRowActions({
  product,
  onView,
  onEdit,
  onDelete,
  onToggleActive,
}: Props) {
  return (
    <div className="flex flex-nowrap items-center justify-end gap-2 whitespace-nowrap">
      <motion.div
        className="inline-flex shrink-0 items-center leading-none"
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
      >
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 shrink-0 rounded-lg p-0"
          onClick={() => onView(product)}
          aria-label="View"
        >
          <Eye className="h-4 w-4" />
        </Button>
      </motion.div>
      <motion.div
        className="inline-flex shrink-0 items-center leading-none"
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
      >
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 shrink-0 rounded-lg p-0"
          onClick={() => onEdit(product)}
          aria-label="Edit"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </motion.div>
      <motion.div
        className="inline-flex shrink-0 items-center leading-none"
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
      >
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 shrink-0 rounded-lg p-0"
          onClick={() => onDelete(product)}
          aria-label="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </motion.div>
      <motion.div
        className="inline-flex shrink-0 items-center leading-none"
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
      >
        {product.status === 'active' ? (
          <Button
            size="sm"
            variant="outline"
            className="h-8 rounded-lg px-3 whitespace-nowrap"
            onClick={() => onToggleActive(product.id)}
          >
            Disable
          </Button>
        ) : (
          <Button
            size="sm"
            className="h-8 rounded-lg px-3 whitespace-nowrap bg-emerald-600 text-white hover:bg-emerald-600/90"
            onClick={() => onToggleActive(product.id)}
          >
            Enable
          </Button>
        )}
      </motion.div>
    </div>
  )
}

