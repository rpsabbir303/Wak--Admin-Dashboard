import { motion, type Variants } from 'framer-motion'
import {
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

export function DashboardCharts({
  ordersTrend,
  revenueTrend,
  sectionItemVariant,
  formatMoney,
}: {
  ordersTrend: Array<{ date: string; orders: number }>
  revenueTrend: Array<{ date: string; revenue: number }>
  sectionItemVariant: Variants
  formatMoney: (value: number) => string
}) {
  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
      <motion.div variants={sectionItemVariant}>
        <Card className="h-full">
          <CardHeader className="pb-2">
            <CardTitle>Orders trend</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px] pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ordersTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(137,81,41,0.12)" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="orders"
                  stroke="#895129"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive
                  animationDuration={450}
                  animationBegin={120}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={sectionItemVariant}>
        <Card className="h-full">
          <CardHeader className="pb-2">
            <CardTitle>Revenue</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px] pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(137,81,41,0.12)" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip formatter={(v) => formatMoney(Number(v))} />
                <Bar
                  dataKey="revenue"
                  fill="#895129"
                  radius={[6, 6, 0, 0]}
                  isAnimationActive
                  animationDuration={500}
                  animationBegin={200}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

