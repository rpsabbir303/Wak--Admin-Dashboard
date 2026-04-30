import {
  BarChart3,
  Boxes,
  Building2,
  ClipboardList,
  FileText,
  Headphones,
  LayoutDashboard,
  Lock,
  Package,
  Settings,
  Truck,
  User,
  Users,
  Wallet,
} from 'lucide-react'

export type AdminMenuLink = {
  key: string
  label: string
  to: string
  icon: React.ComponentType<{ className?: string }>
}

export type AdminMenuGroup = {
  key: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  children: AdminMenuLink[]
}

export type AdminMenuItem = AdminMenuLink | AdminMenuGroup

export const adminMenu: AdminMenuItem[] = [
  { key: 'dashboard', label: 'Dashboard', to: '/', icon: LayoutDashboard },
  { key: 'users', label: 'Users', to: '/users', icon: Users },
  { key: 'vendors', label: 'Vendors', to: '/vendors', icon: Building2 },
  { key: 'products', label: 'Products', to: '/products', icon: Package },
  { key: 'services', label: 'Services', to: '/services', icon: Boxes },
  { key: 'orders', label: 'Orders', to: '/orders', icon: ClipboardList },
  { key: 'delivery', label: 'Delivery', to: '/delivery', icon: Truck },
  { key: 'payouts', label: 'Payouts', to: '/payouts', icon: Wallet },
  { key: 'support', label: 'Support', to: '/support', icon: Headphones },
  { key: 'analytics', label: 'Analytics', to: '/analytics', icon: BarChart3 },
  {
    key: 'settings',
    label: 'Settings',
    icon: Settings,
    children: [
      { key: 'settings_profile', label: 'Profile', to: '/settings/profile', icon: User },
      { key: 'settings_security', label: 'Security', to: '/settings/security', icon: Lock },
      { key: 'settings_legal', label: 'Legal', to: '/settings/legal', icon: FileText },
    ],
  },
]

