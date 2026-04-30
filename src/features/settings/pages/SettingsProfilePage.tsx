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

export default function SettingsProfilePage() {
  const [toast, setToast] = useState<Toast | null>(null)
  const [profile, setProfile] = useState({
    name: 'Admin User',
    email: 'admin@wak.com',
    phone: '',
  })

  function showToast(message: string) {
    const id = String(Date.now())
    setToast({ id, message })
    window.setTimeout(() => setToast((t) => (t?.id === id ? null : t)), 2500)
  }

  return (
    <PageShell title="Settings" description="Profile settings.">
      <div className="space-y-4">
        <AnimatePresence>
          <ToastBar toast={toast} onClose={() => setToast(null)} />
        </AnimatePresence>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <div className="text-sm font-medium">Admin name</div>
                  <Input value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium">Email</div>
                  <Input value={profile.email} onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))} />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <div className="text-sm font-medium">Phone</div>
                  <Input value={profile.phone} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} placeholder="+880…" />
                </div>
              </div>

              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="inline-block">
                <Button onClick={() => showToast('Profile updated')}>Save</Button>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </PageShell>
  )
}

