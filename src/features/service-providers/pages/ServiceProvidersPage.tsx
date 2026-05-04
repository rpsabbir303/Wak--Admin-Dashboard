import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, Search } from 'lucide-react'

import { PageShell } from '@/components/PageShell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type ProviderStatus = 'pending' | 'active' | 'suspended'

type ServiceProviderRow = {
  id: string
  displayName: string
  specialty: string
  email: string
  phone: string
  city: string
  status: ProviderStatus
  jobsCompleted: number
  rating: number
  joinedAt: string
}

const mockProviders: ServiceProviderRow[] = [
  {
    id: 'SP-2001',
    displayName: 'Northside Repairs',
    specialty: 'Plumbing & HVAC',
    email: 'dispatch@northside.example',
    phone: '+1 (206) 555-0142',
    city: 'Seattle',
    status: 'active',
    jobsCompleted: 186,
    rating: 4.8,
    joinedAt: '2024-08-12',
  },
  {
    id: 'SP-2002',
    displayName: 'BrightClean Co.',
    specialty: 'Commercial cleaning',
    email: 'ops@brightclean.example',
    phone: '+1 (312) 555-0190',
    city: 'Chicago',
    status: 'pending',
    jobsCompleted: 0,
    rating: 0,
    joinedAt: '2026-04-28',
  },
  {
    id: 'SP-2003',
    displayName: 'Urban Electric',
    specialty: 'Electrical installs',
    email: 'jobs@urbanelectric.example',
    phone: '+1 (415) 555-0177',
    city: 'San Francisco',
    status: 'active',
    jobsCompleted: 92,
    rating: 4.6,
    joinedAt: '2025-01-04',
  },
  {
    id: 'SP-2004',
    displayName: 'GreenThumb Landscaping',
    specialty: 'Landscaping',
    email: 'hello@greenthumb.example',
    phone: '+1 (512) 555-0108',
    city: 'Austin',
    status: 'suspended',
    jobsCompleted: 41,
    rating: 3.9,
    joinedAt: '2024-11-20',
  },
]

const MotionTableRow = motion(TableRow)

function StatusBadge({ status }: { status: ProviderStatus }) {
  if (status === 'pending') return <Badge variant="warning">pending</Badge>
  if (status === 'suspended') return <Badge variant="danger">suspended</Badge>
  return <Badge variant="success">active</Badge>
}

export default function ServiceProvidersPage() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return mockProviders
    return mockProviders.filter(
      (p) =>
        p.id.toLowerCase().includes(s) ||
        p.displayName.toLowerCase().includes(s) ||
        p.specialty.toLowerCase().includes(s) ||
        p.email.toLowerCase().includes(s) ||
        p.city.toLowerCase().includes(s),
    )
  }, [q])

  const stats = useMemo(() => {
    const total = mockProviders.length
    const active = mockProviders.filter((p) => p.status === 'active').length
    const pending = mockProviders.filter((p) => p.status === 'pending').length
    const suspended = mockProviders.filter((p) => p.status === 'suspended').length
    return { total, active, pending, suspended }
  }, [])

  return (
    <PageShell
      title="Service Providers"
      description="Onboard providers, review credentials, and monitor job performance."
      right={
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
          Invite provider
        </Button>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total', value: stats.total },
          { label: 'Active', value: stats.active },
          { label: 'Pending review', value: stats.pending },
          { label: 'Suspended', value: stats.suspended },
        ].map((c) => (
          <Card key={c.label} className="border-black/10 shadow-soft">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">{c.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold tabular-nums text-foreground">{c.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-black/10 shadow-soft">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between space-y-0">
          <CardTitle className="text-base">Directory</CardTitle>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name, specialty, city…"
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provider</TableHead>
                  <TableHead>Specialty</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Jobs</TableHead>
                  <TableHead className="text-right">Rating</TableHead>
                  <TableHead className="w-[100px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <MotionTableRow
                    key={p.id}
                    layout
                    initial={false}
                    className="border-black/5"
                  >
                    <TableCell>
                      <div className="font-medium text-foreground">{p.displayName}</div>
                      <div className="text-xs text-muted-foreground">{p.id}</div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{p.specialty}</TableCell>
                    <TableCell className="text-sm">{p.city}</TableCell>
                    <TableCell>
                      <StatusBadge status={p.status} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm">{p.jobsCompleted}</TableCell>
                    <TableCell className="text-right text-sm tabular-nums">
                      {p.rating > 0 ? p.rating.toFixed(1) : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        onClick={() =>
                          navigate(`/admin/service-providers/${encodeURIComponent(p.id)}`)
                        }
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </Button>
                    </TableCell>
                  </MotionTableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {filtered.length === 0 && (
            <div className="px-6 py-10 text-center text-sm text-muted-foreground">
              No providers match your search.
            </div>
          )}
        </CardContent>
      </Card>
    </PageShell>
  )
}
