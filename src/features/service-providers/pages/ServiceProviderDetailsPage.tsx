import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Mail, MapPin, Phone } from 'lucide-react'

import { PageShell } from '@/components/PageShell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const mock = {
  'SP-2001': {
    id: 'SP-2001',
    displayName: 'Northside Repairs',
    specialty: 'Plumbing & HVAC',
    email: 'dispatch@northside.example',
    phone: '+1 (206) 555-0142',
    city: 'Seattle, WA',
    status: 'active' as const,
    jobsCompleted: 186,
    rating: 4.8,
    joinedAt: '2024-08-12',
    notes: 'Preferred partner for emergency calls in metro north.',
  },
  'SP-2002': {
    id: 'SP-2002',
    displayName: 'BrightClean Co.',
    specialty: 'Commercial cleaning',
    email: 'ops@brightclean.example',
    phone: '+1 (312) 555-0190',
    city: 'Chicago, IL',
    status: 'pending' as const,
    jobsCompleted: 0,
    rating: 0,
    joinedAt: '2026-04-28',
    notes: 'Background check pending; insurance cert uploaded.',
  },
  'SP-2003': {
    id: 'SP-2003',
    displayName: 'Urban Electric',
    specialty: 'Electrical installs',
    email: 'jobs@urbanelectric.example',
    phone: '+1 (415) 555-0177',
    city: 'San Francisco, CA',
    status: 'active' as const,
    jobsCompleted: 92,
    rating: 4.6,
    joinedAt: '2025-01-04',
    notes: '',
  },
  'SP-2004': {
    id: 'SP-2004',
    displayName: 'GreenThumb Landscaping',
    specialty: 'Landscaping',
    email: 'hello@greenthumb.example',
    phone: '+1 (512) 555-0108',
    city: 'Austin, TX',
    status: 'suspended' as const,
    jobsCompleted: 41,
    rating: 3.9,
    joinedAt: '2024-11-20',
    notes: 'Suspended after repeated SLA breaches.',
  },
}

function StatusBadge({ status }: { status: 'pending' | 'active' | 'suspended' }) {
  if (status === 'pending') return <Badge variant="warning">pending</Badge>
  if (status === 'suspended') return <Badge variant="danger">suspended</Badge>
  return <Badge variant="success">active</Badge>
}

export default function ServiceProviderDetailsPage() {
  const { id } = useParams()
  const decoded = id ? decodeURIComponent(id) : ''
  const row = decoded ? mock[decoded as keyof typeof mock] : undefined

  if (!row) {
    return (
      <PageShell title="Provider not found" description="This service provider ID is not in the demo directory.">
        <Button asChild variant="outline">
          <Link to="/admin/service-providers">Back to Service Providers</Link>
        </Button>
      </PageShell>
    )
  }

  return (
    <PageShell
      title={row.displayName}
      description={`${row.specialty} · ${row.id}`}
      right={<StatusBadge status={row.status} />}
    >
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm" className="gap-2">
          <Link to="/admin/service-providers">
            <ArrowLeft className="h-4 w-4" />
            Back to list
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-black/10 shadow-soft lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-start gap-2 text-muted-foreground">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <a href={`mailto:${row.email}`} className="text-foreground hover:underline">
                {row.email}
              </a>
            </div>
            <div className="flex items-start gap-2 text-muted-foreground">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span className="text-foreground">{row.phone}</span>
            </div>
            <div className="flex items-start gap-2 text-muted-foreground">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span className="text-foreground">{row.city}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-black/10 shadow-soft">
          <CardHeader>
            <CardTitle className="text-base">Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Jobs completed</span>
              <span className="font-medium tabular-nums">{row.jobsCompleted}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rating</span>
              <span className="font-medium tabular-nums">
                {row.rating > 0 ? row.rating.toFixed(1) : '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Joined</span>
              <span className="font-medium">{row.joinedAt}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {row.notes ? (
        <Card className="border-black/10 shadow-soft">
          <CardHeader>
            <CardTitle className="text-base">Admin notes</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">{row.notes}</CardContent>
        </Card>
      ) : null}
    </PageShell>
  )
}
