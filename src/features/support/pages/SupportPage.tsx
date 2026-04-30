import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'

import { PageShell } from '@/components/PageShell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { AppNotification } from '@/app/notifications/notificationsSlice'
import { markRead } from '@/app/notifications/notificationsSlice'
import { useAppDispatch, useAppSelector } from '@/hooks/redux'

type TicketStatus = 'open' | 'pending' | 'resolved'
type TicketPriority = 'high' | 'medium' | 'low'
type TicketRole = 'Customer' | 'Vendor' | 'Driver'

type TicketRow = {
  id: string
  user: string
  type: TicketRole
  subject: string
  priority: TicketPriority
  status: TicketStatus
  lastMessage: string
  time: string
  related?: {
    orderId?: string
    item?: string
    attachments?: string[]
    userHistory?: string[]
  }
  unread: boolean
}

type ChatMessage = {
  id: string
  ticketId: string
  sender: 'user' | 'admin'
  text: string
  time: string
}

const mockTickets: TicketRow[] = [
  {
    id: 'TCK-1001',
    user: 'John Doe',
    type: 'Customer',
    subject: 'Order not delivered',
    priority: 'high',
    status: 'open',
    lastMessage: 'Where is my order?',
    time: '2 min ago',
    unread: true,
    related: {
      orderId: '#28901',
      item: 'Wireless Headphones',
      attachments: ['screenshot.png'],
      userHistory: ['3 orders in last 30 days', '2 previous tickets resolved'],
    },
  },
  {
    id: 'TCK-1002',
    user: 'Cedar & Co',
    type: 'Vendor',
    subject: 'Payout delay',
    priority: 'medium',
    status: 'pending',
    lastMessage: 'Payment not received',
    time: '10 min ago',
    unread: false,
    related: {
      attachments: ['invoice.pdf'],
      userHistory: ['Vendor since 2025-02-10', 'Refund ratio: 6%'],
    },
  },
  {
    id: 'TCK-1003',
    user: 'Driver Karim',
    type: 'Driver',
    subject: 'Delivery issue',
    priority: 'low',
    status: 'resolved',
    lastMessage: 'Issue fixed',
    time: '1 hour ago',
    unread: false,
    related: {
      orderId: '#28902',
      userHistory: ['98 deliveries completed', 'Avg rating: 4.7'],
    },
  },
]

const mockMessages: ChatMessage[] = [
  { id: 'm1', ticketId: 'TCK-1001', sender: 'user', text: 'Where is my order?', time: '2 min ago' },
  { id: 'm2', ticketId: 'TCK-1001', sender: 'admin', text: 'Thanks for reaching out. Let me check the delivery status.', time: '1 min ago' },
  { id: 'm3', ticketId: 'TCK-1002', sender: 'user', text: 'Payment not received', time: '10 min ago' },
  { id: 'm4', ticketId: 'TCK-1002', sender: 'admin', text: 'We are reviewing the payout batch and will update you shortly.', time: '8 min ago' },
  { id: 'm5', ticketId: 'TCK-1003', sender: 'user', text: 'Delivery issue', time: '1 hour ago' },
  { id: 'm6', ticketId: 'TCK-1003', sender: 'admin', text: 'Noted. Please share the pickup location details.', time: '55 min ago' },
  { id: 'm7', ticketId: 'TCK-1003', sender: 'user', text: 'Issue fixed', time: '1 hour ago' },
]

function PriorityBadge({ priority }: { priority: TicketPriority }) {
  const variant = priority === 'high' ? 'danger' : priority === 'medium' ? 'warning' : 'secondary'
  return <Badge variant={variant}>{priority}</Badge>
}

function StatusBadge({ status }: { status: TicketStatus }) {
  const variant = status === 'open' ? 'success' : status === 'pending' ? 'warning' : 'secondary'
  return <Badge variant={variant}>{status}</Badge>
}

function RoleBadge({ role }: { role: TicketRole }) {
  const variant = role === 'Vendor' ? 'secondary' : role === 'Driver' ? 'warning' : 'default'
  return <Badge variant={variant}>{role}</Badge>
}

const MotionTicketItem = motion.div
const MotionMsg = motion.div

export default function SupportPage() {
  const dispatch = useAppDispatch()
  const notifications = useAppSelector((s) => s.notifications.items)

  const [tickets, setTickets] = useState<TicketRow[]>(mockTickets)
  const [messages, setMessages] = useState<ChatMessage[]>(mockMessages)
  const [selectedId, setSelectedId] = useState<string | null>(mockTickets[0]?.id ?? null)

  const [tab, setTab] = useState<'all' | TicketStatus>('all')
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<TicketStatus | 'all'>('all')
  const [priority, setPriority] = useState<TicketPriority | 'all'>('all')
  const [role, setRole] = useState<TicketRole | 'all'>('all')

  const [reply, setReply] = useState('')
  const [typing, setTyping] = useState(false)
  const [dismissedToastId, setDismissedToastId] = useState<string | null>(null)
  const lastMessageNotifId = useRef<string | null>(null)

  const selected = useMemo(() => tickets.find((t) => t.id === selectedId) ?? null, [tickets, selectedId])

  const insights = useMemo(() => {
    const open = tickets.filter((t) => t.status === 'open').length
    const high = tickets.filter((t) => t.priority === 'high' && t.status !== 'resolved').length
    const avgResponse = '6 min'
    return { open, high, avgResponse }
  }, [tickets])

  const filteredTickets = useMemo(() => {
    const query = q.trim().toLowerCase()
    return tickets.filter((t) => {
      const matchesTab = tab === 'all' || t.status === tab
      const matchesQuery =
        query.length === 0 ||
        t.user.toLowerCase().includes(query) ||
        t.subject.toLowerCase().includes(query) ||
        t.id.toLowerCase().includes(query)
      const matchesStatus = status === 'all' || t.status === status
      const matchesPriority = priority === 'all' || t.priority === priority
      const matchesRole = role === 'all' || t.type === role
      return matchesTab && matchesQuery && matchesStatus && matchesPriority && matchesRole
    })
  }, [tickets, tab, q, status, priority, role])

  const selectedMessages = useMemo(() => {
    if (!selectedId) return []
    return messages.filter((m) => m.ticketId === selectedId)
  }, [messages, selectedId])

  const latestMessageNotification = useMemo(() => {
    return notifications.find((n) => n.kind === 'message')
  }, [notifications])

  const toastVisible =
    !!latestMessageNotification &&
    latestMessageNotification.id !== dismissedToastId &&
    !latestMessageNotification.read

  useEffect(() => {
    const latest: AppNotification | undefined = latestMessageNotification
    if (!latest) return
    if (latest.id === lastMessageNotifId.current) return
    lastMessageNotifId.current = latest.id

    // mark some ticket unread (demo) + auto dismiss toast
    const t0 = window.setTimeout(() => {
      setTickets((prev) => {
        if (prev.length === 0) return prev
        const copy = [...prev]
        copy[0] = { ...copy[0], unread: true, lastMessage: 'New message received…', time: 'Just now' }
        return copy
      })
    }, 0)

    const t1 = window.setTimeout(() => {
      setDismissedToastId(latest.id)
      dispatch(markRead(latest.id))
    }, 3000)

    return () => {
      window.clearTimeout(t0)
      window.clearTimeout(t1)
    }
  }, [dispatch, latestMessageNotification])

  function selectTicket(id: string) {
    setSelectedId(id)
    setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, unread: false } : t)))
    setTyping(false)
  }

  function updateTicket(id: string, patch: Partial<TicketRow>) {
    setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)))
  }

  function sendReply() {
    if (!selectedId) return
    const text = reply.trim()
    if (!text) return
    const msg: ChatMessage = {
      id: `a_${Date.now()}`,
      ticketId: selectedId,
      sender: 'admin',
      text,
      time: 'Just now',
    }
    setMessages((prev) => [...prev, msg])
    setReply('')
    updateTicket(selectedId, { lastMessage: text, time: 'Just now' })
    setTyping(true)
    window.setTimeout(() => setTyping(false), 1600)
  }

  function closeTicket() {
    if (!selectedId) return
    updateTicket(selectedId, { status: 'resolved' })
  }

  function escalateTicket() {
    if (!selectedId) return
    updateTicket(selectedId, { priority: 'high', status: 'open' })
  }

  function markResolved() {
    if (!selectedId) return
    updateTicket(selectedId, { status: 'resolved' })
  }

  return (
    <PageShell
      title="Support"
      description="Ticket system and chat monitoring for users/vendors."
    >
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-4">
        {toastVisible && latestMessageNotification && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg border border-black/10 bg-white p-3 shadow-soft"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-medium text-foreground">{latestMessageNotification.title}</div>
                {latestMessageNotification.description && (
                  <div className="text-sm text-muted-foreground">{latestMessageNotification.description}</div>
                )}
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setDismissedToastId(latestMessageNotification.id)
                  dispatch(markRead(latestMessageNotification.id))
                }}
              >
                Close
              </Button>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          {[
            { label: 'Open tickets', value: insights.open },
            { label: 'High priority', value: insights.high },
            { label: 'Avg response time', value: insights.avgResponse },
          ].map((s, idx) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: idx * 0.05 }}
              whileHover={{ y: -4 }}
              className="xl:col-span-1"
            >
              <Card className="transition-shadow hover:shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">{s.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold text-foreground">{s.value}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          {/* LEFT: Ticket list */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Tickets</CardTitle>
              <div className="text-sm text-muted-foreground">{filteredTickets.length}</div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search tickets…"
              />

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TicketStatus | 'all')}
                  className="h-10 rounded-lg border border-black/10 bg-white px-3 text-sm"
                >
                  <option value="all">Status</option>
                  <option value="open">Open</option>
                  <option value="pending">Pending</option>
                  <option value="resolved">Resolved</option>
                </select>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TicketPriority | 'all')}
                  className="h-10 rounded-lg border border-black/10 bg-white px-3 text-sm"
                >
                  <option value="all">Priority</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as TicketRole | 'all')}
                  className="h-10 rounded-lg border border-black/10 bg-white px-3 text-sm"
                >
                  <option value="all">Role</option>
                  <option value="Customer">Customer</option>
                  <option value="Vendor">Vendor</option>
                  <option value="Driver">Driver</option>
                </select>
              </div>

              <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
                <TabsList className="w-full justify-start">
                  <TabsTrigger value="all">All tickets</TabsTrigger>
                  <TabsTrigger value="open">Open</TabsTrigger>
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                  <TabsTrigger value="resolved">Resolved</TabsTrigger>
                </TabsList>
                <TabsContent value={tab} className="mt-3">
                  {filteredTickets.length === 0 ? (
                    <div className="py-10 text-center text-sm text-muted-foreground">
                      No support tickets
                    </div>
                  ) : (
                    <motion.div
                      initial="hidden"
                      animate="show"
                      variants={{
                        hidden: {},
                        show: { transition: { staggerChildren: 0.06 } },
                      }}
                      className="space-y-2"
                    >
                      {filteredTickets.map((t) => (
                        <MotionTicketItem
                          key={t.id}
                          variants={{
                            hidden: { opacity: 0, y: 8 },
                            show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
                          }}
                          onClick={() => selectTicket(t.id)}
                          className={`cursor-pointer rounded-lg border border-black/10 p-3 transition-colors hover:bg-black/[0.02] ${
                            selectedId === t.id ? 'bg-primary/10' : 'bg-white'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <div className="truncate text-sm font-medium text-foreground">
                                  {t.user}
                                </div>
                                {t.unread && <span className="h-2 w-2 rounded-full bg-primary" />}
                              </div>
                              <div className="truncate text-xs text-muted-foreground">
                                {t.subject}
                              </div>
                            </div>
                            <div className="shrink-0 text-xs text-muted-foreground">{t.time}</div>
                          </div>

                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <RoleBadge role={t.type} />
                            <PriorityBadge priority={t.priority} />
                            <motion.div
                              key={`${t.id}-${t.status}`}
                              initial={{ opacity: 0.6, scale: 0.98 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.18 }}
                              className="inline-block"
                            >
                              <StatusBadge status={t.status} />
                            </motion.div>
                          </div>

                          <div className="mt-2 truncate text-xs text-muted-foreground">
                            {t.lastMessage}
                          </div>
                        </MotionTicketItem>
                      ))}
                    </motion.div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* RIGHT: Ticket details / chat */}
          <Card className="lg:col-span-3">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Conversation</CardTitle>
              <div className="text-sm text-muted-foreground">{selected ? selected.id : '—'}</div>
            </CardHeader>
            <CardContent className="space-y-3">
              {!selected ? (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  Select a ticket to view details.
                </div>
              ) : (
                <>
                  {selected.priority === 'high' && selected.status !== 'resolved' && (
                    <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
                      <div className="font-medium text-amber-800">
                        ⚠ High priority ticket — requires immediate action
                      </div>
                      <div className="text-xs text-amber-800/80">
                        Keep response fast and escalate if needed.
                      </div>
                    </div>
                  )}

                  {/* TOP SECTION: metadata + controls */}
                  <div className="rounded-lg border border-black/10 p-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium">{selected.user}</div>
                        <div className="text-xs text-muted-foreground">{selected.subject}</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <RoleBadge role={selected.type} />
                          <PriorityBadge priority={selected.priority} />
                          <StatusBadge status={selected.status} />
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <select
                          value={selected.status}
                          onChange={(e) =>
                            updateTicket(selected.id, { status: e.target.value as TicketStatus })
                          }
                          className="h-9 rounded-lg border border-black/10 bg-white px-3 text-sm"
                        >
                          <option value="open">Open</option>
                          <option value="pending">Pending</option>
                          <option value="resolved">Resolved</option>
                        </select>
                        <select
                          value={selected.priority}
                          onChange={(e) =>
                            updateTicket(selected.id, { priority: e.target.value as TicketPriority })
                          }
                          className="h-9 rounded-lg border border-black/10 bg-white px-3 text-sm"
                        >
                          <option value="high">High</option>
                          <option value="medium">Medium</option>
                          <option value="low">Low</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Chat messages */}
                  <div className="rounded-lg border border-black/10 p-3">
                    <div className="max-h-[420px] space-y-2 overflow-auto pr-1">
                      {selectedMessages.map((m, idx) => (
                        <MotionMsg
                          key={m.id}
                          initial={{ opacity: 0, x: m.sender === 'admin' ? 20 : -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.22, delay: idx * 0.01 }}
                          className={`flex ${m.sender === 'admin' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[85%] rounded-lg border border-black/10 px-3 py-2 text-sm ${
                              m.sender === 'admin' ? 'bg-primary text-white' : 'bg-white'
                            }`}
                          >
                            <div>{m.text}</div>
                            <div
                              className={`mt-1 text-[11px] ${
                                m.sender === 'admin' ? 'text-white/70' : 'text-muted-foreground'
                              }`}
                            >
                              {m.sender === 'admin' ? 'Admin' : 'User'} • {m.time}
                            </div>
                          </div>
                        </MotionMsg>
                      ))}

                      {typing && (
                        <div className="text-xs text-muted-foreground">Typing…</div>
                      )}
                    </div>
                  </div>

                  {/* Admin actions */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" onClick={() => sendReply()}>
                        Reply
                      </Button>
                      <Button variant="outline" onClick={closeTicket}>
                        Close ticket
                      </Button>
                      <Button variant="outline" onClick={escalateTicket}>
                        Escalate
                      </Button>
                      <Button onClick={markResolved}>Mark as resolved</Button>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Live updates: ready (socket placeholder)
                    </div>
                  </div>

                  {/* Reply system */}
                  <div className="flex gap-2">
                    <Input
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      placeholder="Write a reply…"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') sendReply()
                      }}
                    />
                    <Button onClick={sendReply}>Send</Button>
                  </div>

                  {/* Ticket details drawer-ish extra info */}
                  <div className="rounded-lg border border-black/10 p-3">
                    <div className="text-sm font-medium">Ticket details</div>
                    <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm">
                      <div className="rounded-lg bg-black/[0.02] p-3">
                        <div className="text-xs text-muted-foreground">Order ID</div>
                        <div className="font-medium">{selected.related?.orderId ?? '—'}</div>
                      </div>
                      <div className="rounded-lg bg-black/[0.02] p-3">
                        <div className="text-xs text-muted-foreground">Service / Product</div>
                        <div className="font-medium">{selected.related?.item ?? '—'}</div>
                      </div>
                      <div className="rounded-lg bg-black/[0.02] p-3">
                        <div className="text-xs text-muted-foreground">Attachments</div>
                        <div className="font-medium">
                          {(selected.related?.attachments ?? []).length === 0
                            ? '—'
                            : (selected.related?.attachments ?? []).join(', ')}
                        </div>
                      </div>
                      <div className="rounded-lg bg-black/[0.02] p-3">
                        <div className="text-xs text-muted-foreground">User history</div>
                        <div className="font-medium">
                          {(selected.related?.userHistory ?? []).length === 0
                            ? '—'
                            : (selected.related?.userHistory ?? []).slice(0, 2).join(' • ')}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </PageShell>
  )
}

