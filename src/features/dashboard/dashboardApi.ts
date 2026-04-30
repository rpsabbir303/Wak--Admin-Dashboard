import { baseApi } from '@/app/api/baseApi'

export type DashboardStatsResponse = {
  totals: {
    users: number
    vendors: number
    orders: number
    revenue: number
  }
  ordersTrend: { date: string; orders: number }[]
  revenueTrend: { date: string; revenue: number }[]
  pendingVendors: { id: string; businessName: string; owner: string; country: string }[]
  recentOrders: { id: string; customer: string; vendor: string; amount: number; status: string }[]
  activeDeliveries: { id: string; orderId: string; driver: string; eta: string; status: string }[]
}

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getDashboardStats: build.query<DashboardStatsResponse, void>({
      query: () => ({ url: '/admin/dashboard/stats', method: 'GET' }),
      providesTags: ['Dashboard'],
    }),
  }),
})

export const { useGetDashboardStatsQuery } = dashboardApi

