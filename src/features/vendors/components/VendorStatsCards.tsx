import { motion } from 'framer-motion'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type Counts = {
  total: number
  pending: number
  active: number
  blocked: number
}

export function VendorStatsCards({ counts }: { counts: Counts }) {
  return (
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
  )
}

