import { Badge } from '@/components/ui/badge'
import type { ProductStatus } from '@/features/catalog/utils/productFormatters'

type Props = {
  status: ProductStatus
}

export function StatusBadge({ status }: Props) {
  if (status === 'active') return <Badge variant="success">active</Badge>
  if (status === 'inactive') return <Badge variant="secondary">inactive</Badge>
  return <Badge variant="warning">out of stock</Badge>
}

