import type { ComponentType } from 'react'
import {
  BarChart3,
  Bike,
  Boxes,
  Briefcase,
  Building2,
  ClipboardList,
  FileText,
  Headphones,
  LayoutDashboard,
  Lock,
  Package,
  Settings,
  Store,
  Truck,
  User,
  Users,
  Wallet,
} from 'lucide-react'

export type AdminMenuLink = {
  key: string
  label: string
  to: string
  icon: ComponentType<{ className?: string }>
}

export type AdminMenuGroup = {
  key: string
  label: string
  icon: ComponentType<{ className?: string }>
  children: AdminMenuLink[]
}

export type AdminMenuItem = AdminMenuLink | AdminMenuGroup

export const adminMenu: AdminMenuItem[] = [
  { key: 'dashboard', label: 'Dashboard', to: '/', icon: LayoutDashboard },
  { key: 'users', label: 'Users', to: '/users', icon: Users },
  {
    key: 'vendors',
    label: 'Vendors',
    icon: Building2,
    children: [
      { key: 'vendors_all', label: 'All Vendors', to: '/admin/vendors', icon: Store },
      {
        key: 'vendors_delivery_drivers',
        label: 'Delivery Drivers',
        to: '/admin/vendors/delivery-drivers',
        icon: Bike,
      },
    ],
  },
  { key: 'service_providers', label: 'Service Providers', to: '/admin/service-providers', icon: Briefcase },
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
