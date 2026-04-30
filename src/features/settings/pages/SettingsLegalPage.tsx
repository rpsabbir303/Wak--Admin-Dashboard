import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

import { PageShell } from '@/components/PageShell'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type Toast = { id: string; message: string }

function ToastBar({ toast, onClose }: { toast: Toast | null; onClose: () => void }) {
  if (!toast) return null
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="rounded-lg border border-black/10 bg-white p-3 shadow-soft"
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

export default function SettingsLegalPage() {
  const [toast, setToast] = useState<Toast | null>(null)
  const [terms, setTerms] = useState('')
  const [policy, setPolicy] = useState('')

  function showToast(message: string) {
    const id = String(Date.now())
    setToast({ id, message })
    window.setTimeout(() => setToast((t) => (t?.id === id ? null : t)), 2500)
  }

  return (
    <PageShell title="Settings" description="Legal documents.">
      <div className="space-y-4">
        <AnimatePresence>
          <ToastBar toast={toast} onClose={() => setToast(null)} />
        </AnimatePresence>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          <Card>
            <CardHeader>
              <CardTitle>Legal Documents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="text-sm font-medium">Terms & Conditions</div>
                <textarea
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  placeholder="Write your platform terms and conditions..."
                  className="min-h-40 w-full rounded-lg border border-black/10 bg-white p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                />
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="inline-block">
                  <Button variant="outline" onClick={() => showToast('Terms saved')}>
                    Save Terms
                  </Button>
                </motion.div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Privacy Policy</div>
                <textarea
                  value={policy}
                  onChange={(e) => setPolicy(e.target.value)}
                  placeholder="Write your privacy policy..."
                  className="min-h-40 w-full rounded-lg border border-black/10 bg-white p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                />
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="inline-block">
                  <Button variant="outline" onClick={() => showToast('Policy saved')}>
                    Save Policy
                  </Button>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </PageShell>
  )
}

