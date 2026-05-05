import { useEffect, useState } from 'react'
import { animate, motion, useMotionValue, type Variants } from 'framer-motion'
import { Link } from 'react-router-dom'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function CountUp({
  value,
  format,
  duration = 0.55,
}: {
  value: number
  format: (value: number) => string
  duration?: number
}) {
  const mv = useMotionValue(0)
  const [display, setDisplay] = useState(format(0))

  useEffect(() => {
    const controls = animate(mv, value, { duration, ease: 'easeOut' })
    const unsub = mv.on('change', (latest) => setDisplay(format(Math.round(latest))))
    return () => {
      controls.stop()
      unsub()
    }
  }, [duration, format, mv, value])

  return <span>{display}</span>
}

export type DashboardStatItem = {
  label: string
  value: number
  format: (value: number) => string
  href: string
}

export function DashboardStatsGrid({
  items,
  isLoading,
  variants,
}: {
  items: DashboardStatItem[]
  isLoading: boolean
  variants: {
    container: Variants
    statsItem: Variants
  }
}) {
  return (
    <motion.div
      variants={variants.container}
      className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4"
    >
      {items.map((item) => (
        <motion.div
          key={item.label}
          variants={variants.statsItem}
          whileHover={{ y: -3 }}
          transition={{ type: 'spring', stiffness: 280, damping: 24 }}
          className="min-w-0"
        >
          <Link to={item.href} className="block h-full">
            <Card className="group h-full transition-shadow hover:shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">{item.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold tracking-tight text-foreground">
                  {isLoading ? (
                    <div className="h-7 w-24 max-w-full animate-pulse rounded-md bg-black/5" />
                  ) : (
                    <CountUp value={item.value} format={item.format} />
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        </motion.div>
      ))}
    </motion.div>
  )
}

