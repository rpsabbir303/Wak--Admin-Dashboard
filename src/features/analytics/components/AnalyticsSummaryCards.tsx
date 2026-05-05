import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type SummaryCard = {
  label: string
  value: string | number
  growth: string
  icon: LucideIcon
}

export function AnalyticsSummaryCards({ cards }: { cards: SummaryCard[] }) {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
      className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"
    >
      {cards.map((c) => {
        const Icon = c.icon
        return (
          <motion.div
            key={c.label}
            variants={{
              hidden: { opacity: 0, y: 12 },
              show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
            }}
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          >
            <Card className="transition-shadow hover:shadow-lg">
              <CardHeader className="flex-row items-start justify-between pb-2">
                <div>
                  <CardTitle className="text-sm text-muted-foreground">{c.label}</CardTitle>
                  <div className="mt-2 text-2xl font-semibold text-foreground">{c.value}</div>
                </div>
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  <Badge variant="secondary" className="mr-2">
                    {c.growth}
                  </Badge>
                  vs last week
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
    </motion.div>
  )
}

