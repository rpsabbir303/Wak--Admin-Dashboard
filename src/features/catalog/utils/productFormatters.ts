import type { ProductRow } from '@/features/catalog/lib/mockProductsData'

export type ProductStatus = ProductRow['status']

export function formatMoney(value: number) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(value)
}

export function statusLabel(status: ProductStatus) {
  if (status === 'out_of_stock') return 'Out of Stock'
  return status[0].toUpperCase() + status.slice(1)
}

export function productCardColor(product: ProductRow) {
  if (product.status === 'inactive') return 'bg-black/[0.02]'
  if (product.status === 'out_of_stock') return 'bg-amber-500/10'
  return 'bg-primary/10'
}

