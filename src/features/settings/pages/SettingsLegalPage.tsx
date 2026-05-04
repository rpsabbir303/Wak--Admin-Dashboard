import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Eye, Save, SendHorizonal } from 'lucide-react'

import { PageShell } from '@/components/PageShell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

type DocKey = 'terms' | 'privacy'
type PublishStatus = 'published' | 'draft'

type LegalDoc = {
  key: DocKey
  label: string
  status: PublishStatus
  version: string
  title: string
  content: string
  lastUpdated: string
  updatedBy: string
  visibility: 'public' | 'internal'
  countries: string[]
  language: string
}

type Toast = { id: string; message: string }

function ToastBar({ toast, onClose }: { toast: Toast | null; onClose: () => void }) {
  if (!toast) return null
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="rounded-xl border border-[#EEE7DF] bg-white p-3 shadow-soft"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="text-sm font-medium text-foreground">{toast.message}</div>
        <Button size="sm" variant="ghost" onClick={onClose}>
          Close
        </Button>
      </div>
    </motion.div>
  )
}

function statusPill(status: PublishStatus) {
  return status === 'published'
    ? { label: 'Published', className: 'bg-emerald-500/10 text-emerald-700' }
    : { label: 'Draft', className: 'bg-amber-500/10 text-amber-800' }
}

function demoContent(kind: DocKey) {
  if (kind === 'privacy') {
    return `# Privacy Policy

## What we collect
- Account details (name, email, phone)
- Usage data (pages visited, actions)
- Transaction data (orders, payouts)

## How we use data
We use your data to provide services, prevent fraud, and improve the platform.

## Data retention
We retain data as long as necessary for legal and operational purposes.
`
  }

  return `# Terms & Conditions

## Acceptance of Terms
By using this platform, you agree to these Terms and our Privacy Policy.

## Marketplace Rules
- No prohibited items or services
- Vendors must comply with local laws
- Abuse and fraud may lead to account suspension

## Payments & Refunds
Payments are processed securely. Refund eligibility depends on order status and dispute outcomes.
`
}

const initialDocs: Record<DocKey, LegalDoc> = {
  terms: {
    key: 'terms',
    label: 'Terms & Conditions',
    status: 'published',
    version: 'v2.3',
    title: 'Platform Terms & Conditions',
    content: demoContent('terms'),
    lastUpdated: '2026-04-18 11:20 AM',
    updatedBy: 'Admin User',
    visibility: 'public',
    countries: ['US', 'BD', 'AE', 'UK'],
    language: 'English (US)',
  },
  privacy: {
    key: 'privacy',
    label: 'Privacy Policy',
    status: 'published',
    version: 'v1.9',
    title: 'Privacy Policy — Data & Security',
    content: demoContent('privacy'),
    lastUpdated: '2026-04-21 09:05 PM',
    updatedBy: 'A. Rahman (Compliance)',
    visibility: 'public',
    countries: ['US', 'BD', 'AE', 'UK'],
    language: 'English (US)',
  },
}

export default function SettingsLegalPage() {
  const [toast, setToast] = useState<Toast | null>(null)
  const [tab, setTab] = useState<DocKey>('terms')
  const [docs, setDocs] = useState<Record<DocKey, LegalDoc>>(initialDocs)
  const [previewOpen, setPreviewOpen] = useState(false)

  const current = docs[tab]

  const summary = useMemo(() => {
    return (['terms', 'privacy'] as const).map((k) => docs[k])
  }, [docs])

  function showToast(message: string) {
    const id = String(Date.now())
    setToast({ id, message })
    window.setTimeout(() => setToast((t) => (t?.id === id ? null : t)), 2200)
  }

  function patchCurrent(patch: Partial<LegalDoc>) {
    setDocs((prev) => ({ ...prev, [tab]: { ...prev[tab], ...patch } }))
  }

  function saveChanges() {
    const now = new Date()
    const stamp = now.toLocaleString(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
    patchCurrent({ lastUpdated: stamp, updatedBy: 'Admin User' })
    showToast('Changes saved')
  }

  function publish() {
    patchCurrent({ status: 'published', visibility: 'public' })
    saveChanges()
    showToast('Document published')
  }

  return (
    <PageShell title="Legal Settings" description="Manage platform legal documents and compliance content.">
      <div className="space-y-4">
        <AnimatePresence>
          <ToastBar toast={toast} onClose={() => setToast(null)} />
        </AnimatePresence>

        {/* Top summary cards */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28 }}
          className="grid grid-cols-1 gap-4 md:grid-cols-2"
        >
          {summary.map((d, idx) => {
            const pill = statusPill(d.status)
            return (
              <motion.button
                key={d.key}
                type="button"
                onClick={() => setTab(d.key)}
                whileHover={{ y: -4, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                className="text-left"
              >
                <Card
                  className={cn(
                    'rounded-2xl border border-[#EEE7DF] bg-white shadow-sm transition-shadow hover:shadow-lg',
                    tab === d.key && 'border-primary/20 shadow-[0_12px_32px_rgba(137,81,41,0.12)]',
                  )}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">{d.label}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between gap-3">
                      <Badge className={cn('rounded-full', pill.className)} variant="secondary">
                        {pill.label}
                      </Badge>
                      <div className="text-xs text-muted-foreground">Updated {d.lastUpdated}</div>
                    </div>
                    <div className="mt-3 text-sm font-semibold text-foreground">{d.version}</div>
                  </CardContent>
                </Card>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2, delay: idx * 0.02 }}
                />
              </motion.button>
            )
          })}
        </motion.div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          {/* Main editor area */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            <Card className="overflow-hidden rounded-2xl">
              <CardContent className="p-0">
                <div className="border-b border-[#EEE7DF] bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-foreground">Legal Management</div>
                      <div className="text-xs text-muted-foreground">
                        Edit and publish legal documents with versioning and previews.
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                        <Button variant="outline" className="gap-2" onClick={saveChanges}>
                          <Save className="h-4 w-4" />
                          Save Changes
                        </Button>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                        <Button variant="outline" className="gap-2" onClick={() => setPreviewOpen(true)}>
                          <Eye className="h-4 w-4" />
                          Preview
                        </Button>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                        <Button className="gap-2" onClick={publish}>
                          <SendHorizonal className="h-4 w-4" />
                          Publish
                        </Button>
                      </motion.div>
                    </div>
                  </div>

                  <div className="mt-3">
                    <Tabs value={tab} onValueChange={(v) => setTab(v as DocKey)}>
                      <TabsList className="w-full justify-start">
                        <TabsTrigger value="terms">Terms & Conditions</TabsTrigger>
                        <TabsTrigger value="privacy">Privacy Policy</TabsTrigger>
                      </TabsList>

                      <TabsContent value={tab} className="mt-4">
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={tab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.22 }}
                            className="space-y-4"
                          >
                            <div className="rounded-xl border border-[#EEE7DF] bg-white p-4">
                              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                <div className="space-y-1">
                                  <div className="text-xs font-medium text-muted-foreground">Title</div>
                                  <Input
                                    value={current.title}
                                    onChange={(e) => patchCurrent({ title: e.target.value })}
                                    placeholder="Document title…"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <div className="text-xs font-medium text-muted-foreground">Version</div>
                                  <Input
                                    value={current.version}
                                    onChange={(e) => patchCurrent({ version: e.target.value })}
                                    placeholder="v1.0"
                                  />
                                </div>
                              </div>

                              <div className="mt-3 space-y-1">
                                <div className="text-xs font-medium text-muted-foreground">Content</div>
                                <textarea
                                  value={current.content}
                                  onChange={(e) => patchCurrent({ content: e.target.value })}
                                  className="min-h-[320px] w-full resize-none rounded-xl border border-[#EEE7DF] bg-white p-3 text-sm leading-relaxed focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
                                />
                              </div>

                              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                                <div className="text-xs text-muted-foreground">
                                  Last updated <span className="font-medium text-foreground">{current.lastUpdated}</span> by{' '}
                                  <span className="font-medium text-foreground">{current.updatedBy}</span>
                                </div>
                                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <input
                                    type="checkbox"
                                    checked={current.status === 'published'}
                                    onChange={(e) => patchCurrent({ status: e.target.checked ? 'published' : 'draft' })}
                                  />
                                  Publish toggle
                                </label>
                              </div>
                            </div>
                          </motion.div>
                        </AnimatePresence>
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Right sidebar */}
          <motion.aside
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.24 }}
            className="hidden lg:block"
          >
            <Card className="rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Document info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-xl border border-[#EEE7DF] bg-white p-3 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs text-muted-foreground">Publish status</div>
                      <div className="mt-0.5 text-sm font-semibold text-foreground">{statusPill(current.status).label}</div>
                    </div>
                    <Badge className={cn('rounded-full', statusPill(current.status).className)} variant="secondary">
                      {statusPill(current.status).label}
                    </Badge>
                  </div>
                </div>

                {[
                  { label: 'Version', value: current.version },
                  { label: 'Updated by', value: current.updatedBy },
                  { label: 'Visibility', value: current.visibility },
                  { label: 'Supported countries', value: current.countries.join(', ') },
                  { label: 'Language', value: current.language },
                ].map((row) => (
                  <div key={row.label} className="rounded-xl bg-black/[0.02] p-3">
                    <div className="text-xs text-muted-foreground">{row.label}</div>
                    <div className="mt-0.5 text-sm font-medium text-foreground">{row.value}</div>
                  </div>
                ))}

                <div className="text-xs text-muted-foreground">
                  Tip: keep versions consistent (e.g., v2.3) and update timestamps on publish.
                </div>
              </CardContent>
            </Card>
          </motion.aside>
        </div>

        {/* Preview dialog */}
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Preview</DialogTitle>
              <DialogDescription>
                This is a simplified preview (demo). Hook into a Markdown renderer later if needed.
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-auto rounded-xl border border-[#EEE7DF] bg-white p-4">
              <div className="text-sm font-semibold text-foreground">{current.title}</div>
              <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {current.content}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPreviewOpen(false)}>
                Close
              </Button>
              <Button onClick={publish}>Publish</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageShell>
  )
}

