import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate, RouterProvider, useParams } from 'react-router-dom'

import { AdminLayout } from '@/layout/AdminLayout'
import { DeliveryDriverDetailsSkeleton } from '@/features/delivery-drivers/pages/DeliveryDriverDetailsSkeleton'

const DashboardPage = lazy(() => import('@/features/dashboard/pages/DashboardPage'))
const UsersPage = lazy(() => import('@/features/users/pages/UsersPage'))
const VendorsPage = lazy(() => import('@/features/vendors/pages/VendorsPage'))
const ProductsPage = lazy(() => import('@/features/catalog/pages/ProductsPage'))
const ServicesPage = lazy(() => import('@/features/catalog/pages/ServicesPage'))
const OrdersPage = lazy(() => import('@/features/orders/pages/OrdersPage'))
const DeliveryPage = lazy(() => import('@/features/delivery/pages/DeliveryPage'))
const DeliveryDriversPage = lazy(() => import('@/features/delivery-drivers/pages/DeliveryDriversPage'))
const DeliveryDriverDetailsPage = lazy(() => import('@/features/delivery-drivers/pages/DeliveryDriverDetailsPage'))
const ServiceProvidersPage = lazy(() => import('@/features/service-providers/pages/ServiceProvidersPage'))
const ServiceProviderDetailsPage = lazy(() => import('@/features/service-providers/pages/ServiceProviderDetailsPage'))
const PayoutsPage = lazy(() => import('@/features/payouts/pages/PayoutsPage'))
const SupportPage = lazy(() => import('@/features/support/pages/SupportPage'))
const AnalyticsPage = lazy(() => import('@/features/analytics/pages/AnalyticsPage'))
const SettingsPage = lazy(() => import('@/features/settings/pages/SettingsPage'))
const SettingsProfilePage = lazy(() => import('@/features/settings/pages/SettingsProfilePage'))
const SettingsSecurityPage = lazy(() => import('@/features/settings/pages/SettingsSecurityPage'))
const SettingsLegalPage = lazy(() => import('@/features/settings/pages/SettingsLegalPage'))
const NotFoundPage = lazy(() => import('@/routes/NotFoundPage'))

function Loading() {
  return (
    <div className="rounded-xl border border-[#EEE7DF] bg-white p-6 text-sm text-muted-foreground shadow-soft">
      Loading…
    </div>
  )
}

function LegacyDeliveryDriverDetailRedirect() {
  const { id } = useParams()
  if (!id) return <Navigate to="/admin/vendors/delivery-drivers" replace />
  return <Navigate to={`/admin/vendors/delivery-drivers/${encodeURIComponent(id)}`} replace />
}

const router = createBrowserRouter([
  {
    element: <AdminLayout />,
    children: [
      { path: '/', element: <DashboardPage /> },
      { path: '/users', element: <UsersPage /> },
      { path: '/vendors', element: <Navigate to="/admin/vendors" replace /> },
      { path: '/admin/vendors', element: <VendorsPage /> },
      { path: '/admin/vendors/delivery-drivers', element: <DeliveryDriversPage /> },
      {
        path: '/admin/vendors/delivery-drivers/:id',
        element: (
          <Suspense fallback={<DeliveryDriverDetailsSkeleton />}>
            <DeliveryDriverDetailsPage />
          </Suspense>
        ),
      },
      { path: '/admin/delivery-drivers', element: <Navigate to="/admin/vendors/delivery-drivers" replace /> },
      { path: '/admin/delivery-drivers/:id', element: <LegacyDeliveryDriverDetailRedirect /> },
      { path: '/admin/service-providers', element: <ServiceProvidersPage /> },
      { path: '/admin/service-providers/:id', element: <ServiceProviderDetailsPage /> },
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
      { path: '/settings/support', element: <Navigate to="/support" replace /> },
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

