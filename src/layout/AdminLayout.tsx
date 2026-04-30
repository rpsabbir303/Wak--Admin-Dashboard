import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  Bell,
  ChevronDown,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
} from 'lucide-react'

import { adminMenu } from '@/layout/adminMenu'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAppDispatch, useAppSelector } from '@/hooks/redux'
import { markAllRead } from '@/app/notifications/notificationsSlice'

const COLLAPSE_KEY = 'admin_sidebar_collapsed'
const SETTINGS_OPEN_KEY = 'admin_sidebar_settings_open'

function SidebarTooltip({ label, collapsed }: { label: string; collapsed: boolean }) {
  if (!collapsed) return null
  return (
    <span className="pointer-events-none absolute left-full top-1/2 z-50 -translate-y-1/2 whitespace-nowrap rounded-lg border border-black/10 bg-white px-2.5 py-1 text-xs text-foreground shadow-soft opacity-0 transition-opacity group-hover:opacity-100 ml-2">
      {label}
    </span>
  )
}

export function AdminLayout() {
  const location = useLocation()
  const dispatch = useAppDispatch()
  const notifications = useAppSelector((s) => s.notifications.items)
  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  )

  const unreadByKind = useMemo(() => {
    return {
      support: notifications.some((n) => !n.read && n.kind === 'message'),
      orders: notifications.some((n) => !n.read && n.kind === 'order'),
      delivery: notifications.some((n) => !n.read && n.kind === 'delivery'),
    }
  }, [notifications])

  const [collapsed, setCollapsed] = useState(() => {
    const raw = localStorage.getItem(COLLAPSE_KEY)
    return raw === '1'
  })

  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 767px)').matches)
  const [mobileOpen, setMobileOpen] = useState(false)

  const [settingsOpen, setSettingsOpen] = useState(() => {
    const inSettings = location.pathname.startsWith('/settings')
    if (inSettings) return true
    const raw = localStorage.getItem(SETTINGS_OPEN_KEY)
    return raw !== '0'
  })

  useEffect(() => {
    const inSettings = location.pathname.startsWith('/settings')
    if (!inSettings) return
    const t = window.setTimeout(() => setSettingsOpen(true), 0)
    return () => window.clearTimeout(t)
  }, [location.pathname])

  useEffect(() => {
    // collapse settings menu by default on small screens (unless currently in settings)
    const mql = window.matchMedia('(max-width: 767px)')
    const handle = () => {
      setIsMobile(mql.matches)
      if (!location.pathname.startsWith('/settings') && mql.matches) setSettingsOpen(false)
    }
    handle()
    mql.addEventListener('change', handle)
    return () => mql.removeEventListener('change', handle)
  }, [location.pathname])

  const sidebarWidth = isMobile ? 300 : collapsed ? 88 : 292

  const sectionedMenu = useMemo(() => {
    const isLink = (i: (typeof adminMenu)[number]): i is Extract<(typeof adminMenu)[number], { to: string }> =>
      !('children' in i)

    const links = adminMenu.filter(isLink)
    const group = adminMenu.find((i) => 'children' in i && i.key === 'settings')
    const mainKeys = new Set(['dashboard', 'users', 'vendors'])
    const mgmtKeys = new Set(['products', 'services', 'orders', 'delivery', 'payouts', 'support'])
    const sysKeys = new Set(['analytics'])

    const main = links.filter((l) => mainKeys.has(l.key))
    const management = links.filter((l) => mgmtKeys.has(l.key))
    const system = links.filter((l) => sysKeys.has(l.key))
    return { main, management, system, settings: group && 'children' in group ? group : null }
  }, [])

  useEffect(() => {
    // close mobile drawer on navigation
    if (!isMobile) return
    const t = window.setTimeout(() => setMobileOpen(false), 0)
    return () => window.clearTimeout(t)
  }, [isMobile, location.pathname])

  return (
    <div className="min-h-screen bg-background">
      <AnimatePresence>
        {isMobile && mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      <motion.aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 h-screen border-r border-black/10 bg-[#faf9f7] shadow-sm flex flex-col overflow-hidden',
          'supports-[backdrop-filter]:bg-[#faf9f7]/90 supports-[backdrop-filter]:backdrop-blur',
        )}
        animate={{
          width: sidebarWidth,
          x: isMobile ? (mobileOpen ? 0 : -sidebarWidth - 12) : 0,
        }}
        transition={{ type: 'spring', stiffness: 260, damping: 30 }}
      >
        <div className="flex h-16 flex-shrink-0 items-center justify-between px-4">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className={cn('flex items-center gap-3', collapsed && !isMobile && 'justify-center')}
          >
            <motion.div
              whileHover={{ scale: 1.04 }}
              className="relative grid h-10 w-10 place-items-center rounded-xl bg-primary text-white font-semibold shadow-sm"
            >
              <span className="absolute inset-0 rounded-xl bg-primary blur-md opacity-25" />
              W
            </motion.div>
            {(!collapsed || isMobile) && (
              <div className="leading-tight">
                <div className="text-sm font-semibold tracking-tight text-foreground">wak2018</div>
                <div className="text-xs text-muted-foreground">Admin Panel</div>
              </div>
            )}
          </motion.div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (isMobile) {
                setMobileOpen(false)
                return
              }
              const next = !collapsed
              setCollapsed(next)
              localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0')
            }}
            aria-label="Toggle sidebar"
          >
            {collapsed ? (
              <PanelLeftOpen className="h-5 w-5" />
            ) : (
              <PanelLeftClose className="h-5 w-5" />
            )}
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden sidebar-scroll">
          <nav className="px-3 py-2">
            <div className="space-y-5">
              {(
                [
                  { label: 'MAIN', items: sectionedMenu.main },
                  { label: 'MANAGEMENT', items: sectionedMenu.management },
                  { label: 'SYSTEM', items: sectionedMenu.system },
                ] as const
              ).map((section) => (
                <div key={section.label} className="space-y-2">
                  {(!collapsed || isMobile) && (
                    <div className="px-3 text-[11px] font-medium tracking-wider text-muted-foreground">
                      {section.label}
                    </div>
                  )}
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      const Icon = item.icon
                      const showDot =
                        (item.key === 'support' && unreadByKind.support) ||
                        (item.key === 'orders' && unreadByKind.orders) ||
                        (item.key === 'delivery' && unreadByKind.delivery)
                      return (
                        <NavLink
                          key={item.key}
                          to={item.to}
                          onClick={() => isMobile && setMobileOpen(false)}
                          className={({ isActive }) =>
                            cn(
                              'group relative flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-sm font-medium tracking-tight text-muted-foreground transition-colors',
                              'hover:bg-[#895129]/5 hover:text-[#895129]',
                              isActive &&
                                'bg-[#895129]/10 text-[#895129] border-[#895129]/20 shadow-[0_4px_12px_rgba(137,81,41,0.12)] font-semibold',
                              collapsed && !isMobile && 'justify-center px-2',
                            )
                          }
                          title={collapsed && !isMobile ? item.label : undefined}
                        >
                          {({ isActive }) => (
                            <>
                              {isActive && (
                                <motion.span
                                  layoutId="sidebar-active-indicator"
                                  className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-[#895129]"
                                />
                              )}
                              <motion.span whileHover={{ x: 4, scale: 1.01 }} className="flex items-center gap-3 group-hover:translate-x-1">
                                <motion.span
                                  whileHover={{ scale: 1.05 }}
                                  className={cn(
                                    'relative',
                                    isActive ? 'text-[#895129]' : 'text-muted-foreground group-hover:text-[#895129]',
                                  )}
                                >
                                  <Icon className="h-4 w-4" />
                                  {showDot && (
                                    <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                                  )}
                                </motion.span>
                                {(!collapsed || isMobile) && <span>{item.label}</span>}
                              </motion.span>
                              <SidebarTooltip label={item.label} collapsed={collapsed && !isMobile} />
                            </>
                          )}
                        </NavLink>
                      )
                    })}
                  </div>
                </div>
              ))}

              {/* Settings accordion */}
              {sectionedMenu.settings && (
                <div className="space-y-2">
                  {(!collapsed || isMobile) && (
                    <div className="px-3 text-[11px] font-medium tracking-wider text-muted-foreground">
                      SETTINGS
                    </div>
                  )}
                  <div className="space-y-1">
                    {(() => {
                      const item = sectionedMenu.settings
                      const Icon = item.icon
                      const isActive = location.pathname.startsWith('/settings')
                      const open = settingsOpen && (!collapsed || isMobile)
                      return (
                        <div className="space-y-1">
                          <button
                            type="button"
                            onClick={() => {
                              const next = !settingsOpen
                              setSettingsOpen(next)
                              localStorage.setItem(SETTINGS_OPEN_KEY, next ? '1' : '0')
                            }}
                            className={cn(
                              'group relative w-full flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-sm font-medium tracking-tight text-muted-foreground transition-colors',
                              'hover:bg-[#895129]/5 hover:text-[#895129]',
                              isActive &&
                                'bg-[#895129]/10 text-[#895129] border-[#895129]/20 shadow-[0_4px_12px_rgba(137,81,41,0.12)] font-semibold',
                              collapsed && !isMobile && 'justify-center px-2',
                            )}
                            title={collapsed && !isMobile ? item.label : undefined}
                            aria-expanded={open}
                          >
                            {isActive && (
                              <motion.span
                                layoutId="sidebar-active-indicator"
                                className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-[#895129]"
                              />
                            )}
                          <motion.span whileHover={{ x: 4, scale: 1.01 }} className="flex items-center gap-3">
                            <span
                              className={cn(
                                isActive ? 'text-[#895129]' : 'text-muted-foreground group-hover:text-[#895129]',
                              )}
                            >
                              <Icon className="h-4 w-4" />
                            </span>
                              {(!collapsed || isMobile) && (
                                <>
                                  <span className="flex-1 text-left">{item.label}</span>
                                <ChevronDown
                                  className={cn(
                                    'h-4 w-4 transition-transform',
                                    open && 'rotate-180',
                                    isActive && 'text-[#895129]',
                                  )}
                                />
                                </>
                              )}
                            </motion.span>
                            <SidebarTooltip label={item.label} collapsed={collapsed && !isMobile} />
                          </button>

                          <AnimatePresence initial={false}>
                            {open && (!collapsed || isMobile) && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.22, ease: 'easeOut' }}
                                className="overflow-hidden"
                              >
                                <div className="space-y-1">
                                  {item.children.map((child) => {
                                    const ChildIcon = child.icon
                                    const childActive = location.pathname === child.to
                                    return (
                                      <NavLink
                                        key={child.key}
                                        to={child.to}
                                        onClick={() => isMobile && setMobileOpen(false)}
                                        className={cn(
                                          'group relative flex items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-medium text-muted-foreground transition-colors pl-10',
                                          'hover:bg-[#895129]/5 hover:text-[#895129]',
                                          childActive && 'bg-[#895129]/10 text-[#895129] font-semibold',
                                        )}
                                      >
                                        <span
                                          className={cn(
                                            'absolute left-6 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full',
                                            childActive ? 'bg-[#895129]' : 'bg-black/20 group-hover:bg-[#895129]',
                                          )}
                                        />
                                        <span
                                          className={cn(
                                            childActive ? 'text-[#895129]' : 'text-muted-foreground group-hover:text-[#895129]',
                                          )}
                                        >
                                          <ChildIcon className="h-4 w-4" />
                                        </span>
                                        <span>{child.label}</span>
                                      </NavLink>
                                    )
                                  })}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )
                    })()}
                  </div>
                </div>
              )}
            </div>
          </nav>
        </div>

        {/* Bottom user card */}
        <div className="flex-shrink-0 px-3 pb-3 pt-3 border-t border-black/10">
          <motion.div
            whileHover={{ y: -1 }}
            className="rounded-2xl border border-black/10 bg-white/60 p-3 shadow-soft"
          >
            <div
              className={cn(
                'flex items-center justify-between gap-3',
                collapsed && !isMobile && 'justify-center',
              )}
            >
              <div className={cn('flex items-center gap-3', collapsed && !isMobile && 'justify-center')}>
                <Avatar className="h-9 w-9">
                  <AvatarFallback>AD</AvatarFallback>
                </Avatar>
                {(!collapsed || isMobile) && (
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold tracking-tight text-foreground">Admin</div>
                    <div className="text-xs text-muted-foreground">Administrator</div>
                  </div>
                )}
              </div>

              {(!collapsed || isMobile) && (
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="h-9 px-3"
                    onClick={() => {
                      localStorage.removeItem('admin_token')
                      window.location.reload()
                    }}
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </Button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </motion.aside>

      <div style={{ marginLeft: isMobile ? 0 : sidebarWidth }}>
        <header className="sticky top-0 z-30 border-b border-black/10 bg-white/80 backdrop-blur">
          <div className="flex h-16 items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileOpen(true)}
                aria-label="Open sidebar"
              >
                <PanelLeftOpen className="h-5 w-5" />
              </Button>
              <div className="hidden md:flex items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-muted-foreground w-[360px]">
                <Search className="h-4 w-4" />
                <Input
                  className="h-auto border-0 p-0 shadow-none focus-visible:ring-0"
                  placeholder="Search users, orders, vendors…"
                />
              </div>
              <div className="text-sm text-muted-foreground">
                {location.pathname === '/' ? 'Dashboard' : location.pathname}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="relative">
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold text-white">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[340px]">
                  <div className="flex items-center justify-between px-2 py-1.5">
                    <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => dispatch(markAllRead())}
                    >
                      Mark all read
                    </Button>
                  </div>
                  <DropdownMenuSeparator />
                  <div className="max-h-[360px] overflow-auto">
                    {notifications.length === 0 ? (
                      <div className="px-3 py-6 text-sm text-muted-foreground">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.slice(0, 12).map((n) => (
                        <DropdownMenuItem key={n.id} className="items-start gap-2">
                          <span
                            className={cn(
                              'mt-1 h-2 w-2 rounded-full',
                              n.read ? 'bg-black/10' : 'bg-primary',
                            )}
                          />
                          <div className="flex flex-col gap-0.5">
                            <div className="text-sm font-medium text-foreground">
                              {n.title}
                            </div>
                            {n.description && (
                              <div className="text-xs text-muted-foreground">
                                {n.description}
                              </div>
                            )}
                          </div>
                        </DropdownMenuItem>
                      ))
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback>AD</AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline text-sm">Admin</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuLabel>Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Profile</DropdownMenuItem>
                  <DropdownMenuItem>Settings</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      localStorage.removeItem('admin_token')
                      window.location.reload()
                    }}
                  >
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

