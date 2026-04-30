import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

import { PageShell } from '@/components/PageShell'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

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

export default function SettingsSupportPage() {
  const [toast, setToast] = useState<Toast | null>(null)
  const [supportEmail, setSupportEmail] = useState('support@wak.com')
  const [contactNumber, setContactNumber] = useState('+880 1700-000000')
  const [faqLink, setFaqLink] = useState('https://example.com/faq')

  function showToast(message: string) {
    const id = String(Date.now())
    setToast({ id, message })
    window.setTimeout(() => setToast((t) => (t?.id === id ? null : t)), 2500)
  }

  return (
    <PageShell title="Settings" description="Support contact settings.">
      <div className="space-y-4">
        <AnimatePresence>
          <ToastBar toast={toast} onClose={() => setToast(null)} />
        </AnimatePresence>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          <Card>
            <CardHeader>
              <CardTitle>Support</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <div className="text-sm font-medium">Admin support email</div>
                  <Input value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium">Contact number</div>
                  <Input value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <div className="text-sm font-medium">FAQ link</div>
                  <Input value={faqLink} onChange={(e) => setFaqLink(e.target.value)} />
                  <div className="text-xs text-muted-foreground">
                    Optional. This is demo content.
                  </div>
                </div>
              </div>

              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="inline-block">
                <Button
                  onClick={() => {
                    void supportEmail
                    void contactNumber
                    void faqLink
                    showToast('Support settings saved')
                  }}
                >
                  Save
                </Button>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </PageShell>
  )
}

