import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { EllipsisVertical, Paperclip, Search, Send, UserRound } from 'lucide-react'

import { PageShell } from '@/components/PageShell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { AppNotification } from '@/app/notifications/notificationsSlice'
import { markRead } from '@/app/notifications/notificationsSlice'
import { useAppDispatch, useAppSelector } from '@/hooks/redux'
import { cn } from '@/lib/utils'

type SupportRole = 'Customer' | 'Vendor' | 'Driver'
type Presence = 'online' | 'offline'
type ReadState = 'sent' | 'delivered' | 'read'

type Attachment =
  | { type: 'image'; name: string; previewUrl: string }
  | { type: 'file'; name: string; sizeLabel: string }

type Conversation = {
  id: string
  name: string
  role: SupportRole
  presence: Presence
  lastActive: string
  country: string
  accountStatus: 'active' | 'blocked'
  avatarSeed: string
  unreadCount: number
  lastMessagePreview: string
  lastMessageAt: string
  stats: {
    totalOrders: number
    totalSpent: number
    recentDeliveries: number
    registeredAt: string
    supportHistory: number
  }
}

type ChatMessage = {
  id: string
  conversationId: string
  sender: 'user' | 'admin'
  text?: string
  createdAt: string
  readState?: ReadState
  attachments?: Attachment[]
}

function formatMoney(value: number) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(value)
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2)
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('')
}

function roleVariant(role: SupportRole): 'default' | 'secondary' | 'warning' {
  if (role === 'Vendor') return 'secondary'
  if (role === 'Driver') return 'warning'
  return 'default'
}

const demoConversations: Conversation[] = [
  {
    id: 'c_1',
    name: 'John Doe',
    role: 'Customer',
    presence: 'online',
    lastActive: 'Active now',
    country: 'US',
    accountStatus: 'active',
    avatarSeed: 'jd',
    unreadCount: 2,
    lastMessagePreview: 'Where is my order? I can’t track it.',
    lastMessageAt: '2m',
    stats: { totalOrders: 5, totalSpent: 320, recentDeliveries: 2, registeredAt: '2025-01-10', supportHistory: 3 },
  },
  {
    id: 'c_2',
    name: 'Cedar & Co',
    role: 'Vendor',
    presence: 'offline',
    lastActive: 'Last active 12m ago',
    country: 'US',
    accountStatus: 'active',
    avatarSeed: 'cc',
    unreadCount: 0,
    lastMessagePreview: 'Payout delay — can you check the batch?',
    lastMessageAt: '12m',
    stats: { totalOrders: 34, totalSpent: 1200, recentDeliveries: 0, registeredAt: '2025-02-10', supportHistory: 6 },
  },
  {
    id: 'c_3',
    name: 'Driver Karim',
    role: 'Driver',
    presence: 'online',
    lastActive: 'Active now',
    country: 'BD',
    accountStatus: 'active',
    avatarSeed: 'dk',
    unreadCount: 1,
    lastMessagePreview: 'Need help: customer not answering phone.',
    lastMessageAt: '1h',
    stats: { totalOrders: 98, totalSpent: 0, recentDeliveries: 5, registeredAt: '2024-11-02', supportHistory: 2 },
  },
  {
    id: 'c_4',
    name: 'Amina Rahman',
    role: 'Customer',
    presence: 'offline',
    lastActive: 'Last active 3h ago',
    country: 'BD',
    accountStatus: 'blocked',
    avatarSeed: 'ar',
    unreadCount: 0,
    lastMessagePreview: 'Thanks, issue resolved.',
    lastMessageAt: '3h',
    stats: { totalOrders: 12, totalSpent: 820, recentDeliveries: 1, registeredAt: '2025-02-14', supportHistory: 4 },
  },
]

const demoMessages: ChatMessage[] = [
  {
    id: 'm_1',
    conversationId: 'c_1',
    sender: 'user',
    text: 'Hi, where is my order? I can’t track it.',
    createdAt: '2:14 PM',
    attachments: [{ type: 'image', name: 'tracking.png', previewUrl: 'https://via.placeholder.com/360x220' }],
  },
  {
    id: 'm_2',
    conversationId: 'c_1',
    sender: 'admin',
    text: 'Thanks for reaching out. I’m checking the delivery timeline now.',
    createdAt: '2:15 PM',
    readState: 'read',
  },
  {
    id: 'm_3',
    conversationId: 'c_1',
    sender: 'admin',
    text: 'Looks like the driver is en route. ETA ~25 minutes. I’ll keep you posted.',
    createdAt: '2:16 PM',
    readState: 'delivered',
  },
  {
    id: 'm_4',
    conversationId: 'c_2',
    sender: 'user',
    text: 'Payout delay — can you check the batch?',
    createdAt: '2:01 PM',
    attachments: [{ type: 'file', name: 'invoice.pdf', sizeLabel: '184 KB' }],
  },
  {
    id: 'm_5',
    conversationId: 'c_2',
    sender: 'admin',
    text: 'Got it. We’ll verify and update you shortly.',
    createdAt: '2:03 PM',
    readState: 'read',
  },
  {
    id: 'm_6',
    conversationId: 'c_3',
    sender: 'user',
    text: 'Need help: customer not answering phone.',
    createdAt: '1:05 PM',
  },
  {
    id: 'm_7',
    conversationId: 'c_3',
    sender: 'admin',
    text: 'Try message + call again. If no response in 5 minutes, mark as “Unable to reach”.',
    createdAt: '1:07 PM',
    readState: 'read',
  },
]

const MotionConversationItem = motion.div
const MotionBubble = motion.div

function PresenceDot({ presence }: { presence: Presence }) {
  return (
    <span
      className={cn(
        'h-2.5 w-2.5 rounded-full',
        presence === 'online' ? 'bg-emerald-500' : 'bg-muted-foreground/40',
      )}
      aria-label={presence === 'online' ? 'Online' : 'Offline'}
      title={presence === 'online' ? 'Online' : 'Offline'}
    />
  )
}

function MessageAttachment({ a }: { a: Attachment }) {
  if (a.type === 'image') {
    return (
      <div className="mt-2 overflow-hidden rounded-xl border border-[#EEE7DF] bg-white">
        <img src={a.previewUrl} alt={a.name} className="h-auto w-full" />
        <div className="px-3 py-2 text-xs text-muted-foreground">{a.name}</div>
      </div>
    )
  }

  return (
    <div className="mt-2 flex items-center justify-between gap-3 rounded-xl border border-[#EEE7DF] bg-white px-3 py-2">
      <div className="min-w-0">
        <div className="truncate text-xs font-medium text-foreground">{a.name}</div>
        <div className="text-[11px] text-muted-foreground">{a.sizeLabel}</div>
      </div>
      <Button size="sm" variant="outline" className="h-8 px-3">
        Download
      </Button>
    </div>
  )
}

export default function SupportPage() {
  const dispatch = useAppDispatch()
  const notifications = useAppSelector((s) => s.notifications.items)

  const [conversations, setConversations] = useState<Conversation[]>(demoConversations)
  const [messages, setMessages] = useState<ChatMessage[]>(demoMessages)

  const [activeId, setActiveId] = useState<string>(() => demoConversations[0]?.id ?? '')
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<'all' | 'unread' | 'vendors' | 'customers' | 'drivers'>('all')
  const [composer, setComposer] = useState('')
  const [typing, setTyping] = useState(false)
  const [showInfo, setShowInfo] = useState(true)

  const lastMessageNotifId = useRef<string | null>(null)
  const endRef = useRef<HTMLDivElement | null>(null)

  const active = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? null,
    [activeId, conversations],
  )

  const filteredConversations = useMemo(() => {
    const q = search.trim().toLowerCase()
    const byQuery = (c: Conversation) =>
      q.length === 0 ||
      c.name.toLowerCase().includes(q) ||
      c.role.toLowerCase().includes(q) ||
      c.country.toLowerCase().includes(q)

    const byTab = (c: Conversation) => {
      if (tab === 'all') return true
      if (tab === 'unread') return c.unreadCount > 0
      if (tab === 'vendors') return c.role === 'Vendor'
      if (tab === 'customers') return c.role === 'Customer'
      return c.role === 'Driver'
    }

    return conversations.filter((c) => byQuery(c) && byTab(c))
  }, [conversations, search, tab])

  const activeMessages = useMemo(() => {
    if (!activeId) return []
    return messages.filter((m) => m.conversationId === activeId)
  }, [messages, activeId])

  const latestMessageNotification = useMemo(() => {
    return notifications.find((n) => n.kind === 'message')
  }, [notifications])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [activeId, activeMessages.length])

  useEffect(() => {
    const latest: AppNotification | undefined = latestMessageNotification
    if (!latest) return
    if (latest.id === lastMessageNotifId.current) return
    lastMessageNotifId.current = latest.id

    const t0 = window.setTimeout(() => {
      setConversations((prev) => {
        if (prev.length === 0) return prev
        const pick = prev.find((p) => p.id !== activeId) ?? prev[0]
        return prev.map((c) =>
          c.id === pick.id
            ? {
                ...c,
                unreadCount: Math.min(9, c.unreadCount + 1),
                lastMessagePreview: 'New message received…',
                lastMessageAt: 'Just now',
              }
            : c,
        )
      })
    }, 0)

    const t1 = window.setTimeout(() => {
      dispatch(markRead(latest.id))
    }, 1800)

    return () => {
      window.clearTimeout(t0)
      window.clearTimeout(t1)
    }
  }, [activeId, dispatch, latestMessageNotification])

  function setActiveConversation(id: string) {
    setActiveId(id)
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c)))
    setTyping(false)
  }

  function toggleBlock() {
    if (!active) return
    setConversations((prev) =>
      prev.map((c) =>
        c.id === active.id ? { ...c, accountStatus: c.accountStatus === 'active' ? 'blocked' : 'active' } : c,
      ),
    )
  }

  function sendMessage() {
    if (!active) return
    const text = composer.trim()
    if (!text) return

    const msg: ChatMessage = {
      id: `m_${Date.now()}`,
      conversationId: active.id,
      sender: 'admin',
      text,
      createdAt: 'Just now',
      readState: 'sent',
    }

    setMessages((prev) => [...prev, msg])
    setComposer('')
    setConversations((prev) =>
      prev.map((c) =>
        c.id === active.id ? { ...c, lastMessagePreview: text, lastMessageAt: 'Now' } : c,
      ),
    )

    setTyping(true)
    window.setTimeout(() => setTyping(false), 1100)
  }

  return (
    <PageShell title="Support" description="Real-time support inbox for customers, vendors, and drivers.">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
        className="h-[calc(100vh-120px)] overflow-hidden"
      >
        <div className="grid h-full grid-cols-1 gap-6 lg:grid-cols-[420px_minmax(0,1fr)]">
          {/* LEFT: Conversation list */}
          <Card className="h-full overflow-hidden">
            <CardContent className="h-full p-0">
              <div className="h-full border-b border-[#EEE7DF] bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-foreground">Inbox</div>
                    <div className="text-xs text-muted-foreground">{conversations.length} conversations</div>
                  </div>
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    Live
                  </Badge>
                </div>

                <div className="mt-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search conversations…"
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="mt-3 min-h-0 flex-1">
                  <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="flex h-full min-h-0 flex-col">
                    <TabsList className="w-full justify-start">
                      <TabsTrigger value="all">All</TabsTrigger>
                      <TabsTrigger value="unread">Unread</TabsTrigger>
                      <TabsTrigger value="vendors">Vendors</TabsTrigger>
                      <TabsTrigger value="customers">Customers</TabsTrigger>
                      <TabsTrigger value="drivers">Drivers</TabsTrigger>
                    </TabsList>
                    <TabsContent value={tab} className="mt-3 min-h-0 flex-1">
                      <motion.div
                        initial="hidden"
                        animate="show"
                        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
                        className="h-full space-y-2 overflow-auto px-1 pb-3"
                      >
                        {filteredConversations.length === 0 ? (
                          <div className="py-10 text-center text-sm text-muted-foreground">
                            No conversations found.
                          </div>
                        ) : (
                          filteredConversations.map((c) => {
                            const activeItem = c.id === activeId
                            return (
                              <MotionConversationItem
                                key={c.id}
                                variants={{
                                  hidden: { opacity: 0, y: 8 },
                                  show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
                                }}
                                whileHover={{ scale: 1.01, y: -2 }}
                                onClick={() => setActiveConversation(c.id)}
                                className={cn(
                                  'cursor-pointer rounded-2xl border border-[#8951291f] bg-white p-3 shadow-[0_2px_10px_rgba(137,81,41,0.06)] transition-all duration-200 ease-out',
                                  'hover:bg-[#faf7f3] hover:shadow-[0_6px_18px_rgba(137,81,41,0.12)]',
                                  activeItem && 'border-[#89512930] bg-[#faf7f3]',
                                )}
                              >
                                <div className="flex items-start gap-3">
                                  <div className="relative">
                                    <Avatar className="h-10 w-10">
                                      <AvatarFallback>{getInitials(c.name)}</AvatarFallback>
                                    </Avatar>
                                    <span className="absolute -bottom-0.5 -right-0.5 rounded-full bg-white p-0.5">
                                      <PresenceDot presence={c.presence} />
                                    </span>
                                  </div>

                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                          <div className={cn('truncate text-sm font-semibold', activeItem && 'text-primary')}>
                                            {c.name}
                                          </div>
                                          <Badge variant={roleVariant(c.role)} className="h-5 px-2 text-[11px]">
                                            {c.role}
                                          </Badge>
                                        </div>
                                        <div className="mt-0.5 truncate text-xs text-muted-foreground">
                                          {c.lastMessagePreview}
                                        </div>
                                      </div>
                                      <div className="shrink-0 text-right">
                                        <div className="text-[11px] text-muted-foreground">{c.lastMessageAt}</div>
                                        <AnimatePresence>
                                          {c.unreadCount > 0 && (
                                            <motion.div
                                              initial={{ opacity: 0, scale: 0.8 }}
                                              animate={{ opacity: 1, scale: 1 }}
                                              exit={{ opacity: 0, scale: 0.85 }}
                                              className="mt-1 flex justify-end"
                                            >
                                              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-white shadow-sm">
                                                {c.unreadCount}
                                              </span>
                                            </motion.div>
                                          )}
                                        </AnimatePresence>
                                      </div>
                                    </div>
                                    <div className="mt-2 flex items-center justify-between gap-2">
                                      <div className="text-[11px] text-muted-foreground">{c.lastActive}</div>
                                      <div className={cn('text-[11px]', c.accountStatus === 'active' ? 'text-muted-foreground' : 'text-red-600')}>
                                        {c.accountStatus === 'active' ? c.country : 'Blocked'}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </MotionConversationItem>
                            )
                          })
                        )}
                      </motion.div>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* RIGHT: Chat area */}
          <Card className="h-full overflow-hidden">
            <CardContent className="h-full p-0">
              {!active ? (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  Select a conversation to start.
                </div>
              ) : (
                <div className="grid h-full grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px]">
                  <div className="flex h-full min-w-0 flex-1 flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between gap-3 border-b border-[#8951291f] bg-white px-6 py-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>{getInitials(active.name)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="truncate text-sm font-semibold text-foreground">{active.name}</div>
                            <Badge variant={roleVariant(active.role)} className="h-5 px-2 text-[11px]">
                              {active.role}
                            </Badge>
                            <PresenceDot presence={active.presence} />
                          </div>
                          <div className="truncate text-[11px] text-muted-foreground">{active.lastActive}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                          <Button variant="outline" size="sm" className="h-9 gap-2">
                            <UserRound className="h-4 w-4" />
                            View profile
                          </Button>
                        </motion.div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                              <Button variant="outline" size="sm" className="h-9 w-9 p-0" aria-label="More options">
                                <EllipsisVertical className="h-4 w-4" />
                              </Button>
                            </motion.div>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setShowInfo((v) => !v)}>
                              {showInfo ? 'Hide details panel' : 'Show details panel'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={toggleBlock}>
                              {active.accountStatus === 'active' ? 'Block user' : 'Unblock user'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* Messages */}
                    <div className="min-h-0 flex-1 overflow-y-auto bg-[#f8f6f3] px-6 py-3">
                      <motion.div
                        initial="hidden"
                        animate="show"
                        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.03 } } }}
                        className="mx-auto flex min-h-full max-w-3xl flex-col justify-end gap-1.5"
                      >
                        {activeMessages.map((m, idx) => {
                          const isAdmin = m.sender === 'admin'
                          return (
                            <MotionBubble
                              key={m.id}
                              variants={{
                                hidden: { opacity: 0, x: isAdmin ? 16 : -16 },
                                show: { opacity: 1, x: 0, transition: { duration: 0.22, delay: idx * 0.001 } },
                              }}
                              className={cn('flex', isAdmin ? 'justify-end' : 'justify-start')}
                            >
                              <div
                                className={cn(
                                  'max-w-[88%] rounded-2xl border px-4 py-2.5 shadow-[0_2px_10px_rgba(137,81,41,0.06)] transition-all duration-200 ease-out',
                                  isAdmin
                                    ? 'border-[#89512930] bg-[#89512914] text-foreground'
                                    : 'border-[#8951291f] bg-white',
                                )}
                              >
                                {m.text && <div className="text-sm leading-relaxed">{m.text}</div>}
                                {(m.attachments ?? []).map((a, i) => (
                                  <MessageAttachment key={`${m.id}_a_${i}`} a={a} />
                                ))}

                                <div className={cn('mt-2 flex items-center gap-3 text-[11px]', 'text-[#7c6a58]')}>
                                  <span>{m.createdAt}</span>
                                </div>
                              </div>
                            </MotionBubble>
                          )
                        })}

                        <AnimatePresence>
                          {typing && (
                            <motion.div
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 6 }}
                              className="flex justify-start"
                            >
                              <div className="rounded-2xl border border-[#EEE7DF] bg-white px-3 py-2 text-xs text-muted-foreground">
                                Typing…
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <div ref={endRef} />
                      </motion.div>
                    </div>

                    {/* Composer */}
                    <div className="border-t border-[#8951291f] bg-white px-6 py-3">
                      <div className="mx-auto flex max-w-3xl items-center gap-2.5">
                        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-11 w-11 rounded-full border-[#89512924] bg-white p-0 text-[#895129] hover:bg-[#faf7f3]"
                            aria-label="Attachment"
                          >
                            <Paperclip className="h-4 w-4" />
                          </Button>
                        </motion.div>
                        <div className="flex-1">
                          <textarea
                            value={composer}
                            onChange={(e) => setComposer(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                sendMessage()
                              }
                            }}
                            placeholder="Write a message..."
                            rows={1}
                            className="h-11 min-h-11 w-full resize-none rounded-full border border-[#89512924] bg-white px-4 py-2.5 text-sm leading-5 focus-visible:outline-none focus-visible:border-[#895129] focus-visible:ring-2 focus-visible:ring-[#89512920]"
                          />
                        </div>

                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} className="self-center">
                          <Button onClick={sendMessage} className="flex h-11 items-center justify-center self-center rounded-full bg-[#895129] px-5 text-white hover:bg-[#77411f]">
                            <Send className="h-4 w-4" />
                            Send
                          </Button>
                        </motion.div>
                      </div>
                    </div>
                  </div>

                  {/* Optional drawer */}
                  <AnimatePresence initial={false}>
                    {showInfo && (
                      <motion.aside
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 340, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.24, ease: 'easeOut' }}
                        className="hidden h-full overflow-y-auto border-l border-[#EEE7DF] bg-white lg:block"
                      >
                        <div className="h-full p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-foreground">User details</div>
                              <div className="text-xs text-muted-foreground">{active.country} • {active.stats.registeredAt}</div>
                            </div>
                            <Button variant="outline" size="sm" className="h-8 px-3" onClick={() => setShowInfo(false)}>
                              Hide
                            </Button>
                          </div>

                          <div className="mt-4 grid grid-cols-2 gap-2">
                            {[
                              { label: 'Total orders', value: active.stats.totalOrders },
                              { label: 'Total spent', value: formatMoney(active.stats.totalSpent) },
                              { label: 'Recent deliveries', value: active.stats.recentDeliveries },
                              { label: 'Support history', value: active.stats.supportHistory },
                            ].map((s) => (
                              <div key={s.label} className="rounded-xl border border-[#EEE7DF] bg-white p-3 shadow-sm">
                                <div className="text-[11px] text-muted-foreground">{s.label}</div>
                                <div className="mt-0.5 text-sm font-semibold text-foreground">{s.value}</div>
                              </div>
                            ))}
                          </div>

                          <div className="mt-3 rounded-xl border border-[#EEE7DF] bg-white p-3 shadow-sm">
                            <div className="text-[11px] text-muted-foreground">Account status</div>
                            <div className="mt-1 flex items-center justify-between gap-3">
                              <Badge
                                variant={active.accountStatus === 'active' ? 'success' : 'danger'}
                                className={cn(active.accountStatus === 'active' ? 'bg-emerald-500/10 text-emerald-700' : '')}
                              >
                                {active.accountStatus}
                              </Badge>
                              <Button size="sm" variant="outline" className="h-8 px-3" onClick={toggleBlock}>
                                {active.accountStatus === 'active' ? 'Block' : 'Unblock'}
                              </Button>
                            </div>
                            <div className="mt-2 text-xs text-muted-foreground">
                              Quick actions are demo-only. Connect to API/Socket events later.
                            </div>
                          </div>

                          <div className="mt-3 rounded-xl border border-[#EEE7DF] bg-white p-3 shadow-sm">
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-semibold text-foreground">Context</div>
                              <Badge variant="secondary" className="bg-primary/10 text-primary">Insights</Badge>
                            </div>
                            <div className="mt-2 space-y-2 text-sm">
                              <div className="rounded-xl bg-black/[0.02] p-3">
                                <div className="text-[11px] text-muted-foreground">Country</div>
                                <div className="font-medium text-foreground">{active.country}</div>
                              </div>
                              <div className="rounded-xl bg-black/[0.02] p-3">
                                <div className="text-[11px] text-muted-foreground">Registered</div>
                                <div className="font-medium text-foreground">{active.stats.registeredAt}</div>
                              </div>
                              <div className="rounded-xl bg-black/[0.02] p-3">
                                <div className="text-[11px] text-muted-foreground">Notes</div>
                                <div className="text-sm text-muted-foreground">
                                  Fast replies improve satisfaction. Use emojis/attachments UI to simulate real inbox.
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex h-2 w-2 rounded-full bg-primary" />
                              Real-time ready
                            </div>
                            <div className="flex items-center gap-1">
                              <UserRound className="h-3.5 w-3.5" />
                              Admin inbox
                            </div>
                          </div>
                        </div>
                      </motion.aside>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </PageShell>
  )
}

