import { lazy, Suspense } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

import { AdminLayout } from '@/layout/AdminLayout'

const DashboardPage = lazy(() => import('@/features/dashboard/pages/DashboardPage'))
const UsersPage = lazy(() => import('@/features/users/pages/UsersPage'))
const VendorsPage = lazy(() => import('@/features/vendors/pages/VendorsPage'))
const ProductsPage = lazy(() => import('@/features/catalog/pages/ProductsPage'))
const ServicesPage = lazy(() => import('@/features/catalog/pages/ServicesPage'))
const OrdersPage = lazy(() => import('@/features/orders/pages/OrdersPage'))
const DeliveryPage = lazy(() => import('@/features/delivery/pages/DeliveryPage'))
const PayoutsPage = lazy(() => import('@/features/payouts/pages/PayoutsPage'))
const SupportPage = lazy(() => import('@/features/support/pages/SupportPage'))
const AnalyticsPage = lazy(() => import('@/features/analytics/pages/AnalyticsPage'))
const SettingsPage = lazy(() => import('@/features/settings/pages/SettingsPage'))
const SettingsProfilePage = lazy(() => import('@/features/settings/pages/SettingsProfilePage'))
const SettingsSecurityPage = lazy(() => import('@/features/settings/pages/SettingsSecurityPage'))
const SettingsLegalPage = lazy(() => import('@/features/settings/pages/SettingsLegalPage'))
const SettingsSupportPage = lazy(() => import('@/features/settings/pages/SettingsSupportPage'))
const NotFoundPage = lazy(() => import('@/routes/NotFoundPage'))

function Loading() {
  return (
    <div className="rounded-lg border border-black/10 bg-white p-6 text-sm text-muted-foreground shadow-soft">
      Loading…
    </div>
  )
}

const router = createBrowserRouter([
  {
    element: <AdminLayout />,
    children: [
      { path: '/', element: <DashboardPage /> },
      { path: '/users', element: <UsersPage /> },
      { path: '/vendors', element: <VendorsPage /> },
      { path: '/products', element: <ProductsPage /> },
      { path: '/services', element: <ServicesPage /> },
      { path: '/orders', element: <OrdersPage /> },
      { path: '/delivery', element: <DeliveryPage /> },
      { path: '/payouts', element: <PayoutsPage /> },
      { path: '/support', element: <SupportPage /> },
      { path: '/analytics', element: <AnalyticsPage /> },
      { path: '/settings', element: <SettingsPage /> },
      { path: '/settings/profile', element: <SettingsProfilePage /> },
      { path: '/settings/security', element: <SettingsSecurityPage /> },
      { path: '/settings/legal', element: <SettingsLegalPage /> },
      { path: '/settings/support', element: <SettingsSupportPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])

export function AppRouter() {
  return (
    <Suspense fallback={<Loading />}>
      <RouterProvider router={router} />
    </Suspense>
  )
}

