import { motion } from 'framer-motion'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-black/5 ${className ?? ''}`} />
}

type Row = { day: string; revenue: number; orders: number; users: number }

export function AnalyticsChartsSection({
  dataset,
  isEmpty,
  formatMoney,
}: {
  dataset: Row[]
  isEmpty: boolean
  formatMoney: (value: number) => string
}) {
  return (
    <>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35 }}
        >
          <Card className="transition-shadow hover:shadow-lg">
            <CardHeader>
              <CardTitle>Revenue (last 7 days)</CardTitle>
            </CardHeader>
            <CardContent className="h-[280px]">
              {isEmpty ? (
                <Skeleton className="h-[240px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dataset}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                    <XAxis dataKey="day" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} />
                    <Tooltip formatter={(v) => formatMoney(Number(v))} />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#895129"
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive
                      animationDuration={450}
                      animationBegin={120}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, delay: 0.1 }}
        >
          <Card className="transition-shadow hover:shadow-lg">
            <CardHeader>
              <CardTitle>Orders</CardTitle>
            </CardHeader>
            <CardContent className="h-[280px]">
              {isEmpty ? (
                <Skeleton className="h-[240px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dataset}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                    <XAxis dataKey="day" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Bar
                      dataKey="orders"
                      fill="#895129"
                      radius={[6, 6, 0, 0]}
                      isAnimationActive
                      animationDuration={500}
                      animationBegin={200}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, delay: 0.15 }}
      >
        <Card className="transition-shadow hover:shadow-lg">
          <CardHeader>
            <CardTitle>Users growth</CardTitle>
          </CardHeader>
          <CardContent className="h-[260px]">
            {isEmpty ? (
              <Skeleton className="h-[220px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dataset}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="users"
                    stroke="#895129"
                    fill="rgba(137,81,41,0.18)"
                    isAnimationActive
                    animationDuration={550}
                    animationBegin={220}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </>
  )
}

