import { motion } from 'framer-motion'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatMoney } from '@/features/catalog/utils/productFormatters'

type Stats = {
  total: number
  active: number
  outOfStock: number
  revenue: number
}

export function ProductStatsCards({ stats }: { stats: Stats }) {
  return (
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
  )
}

