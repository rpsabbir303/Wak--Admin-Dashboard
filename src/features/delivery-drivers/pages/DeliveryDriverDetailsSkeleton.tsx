import { Card, CardContent, CardHeader } from '@/components/ui/card'

export function DeliveryDriverDetailsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-9 w-40 rounded-lg bg-muted" />
      <div className="h-40 rounded-2xl bg-muted" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <Card key={i} className="rounded-xl border-[#EEE7DF]">
            <CardHeader className="pb-2">
              <div className="h-3 w-24 rounded bg-muted" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-20 rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="h-12 rounded-xl bg-muted" />
      <div className="h-[420px] rounded-xl bg-muted" />
    </div>
  )
}
