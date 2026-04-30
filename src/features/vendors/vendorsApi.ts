import { baseApi } from '@/app/api/baseApi'

export type VendorStatus = 'pending' | 'active' | 'suspended' | 'rejected'

export type VendorRow = {
  id: string
  businessName: string
  owner: string
  status: VendorStatus
  earnings: number
}

export type VendorDetails = VendorRow & {
  country?: string
  phone?: string
  productsCount?: number
  servicesCount?: number
  performance?: {
    rating?: number
    completedOrders?: number
    cancellationRate?: number
  }
}

export const vendorsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getVendors: build.query<{ pending: VendorRow[]; active: VendorRow[] }, void>({
      query: () => ({ url: '/admin/vendors', method: 'GET' }),
      providesTags: ['Vendors'],
    }),
    getVendorDetails: build.query<VendorDetails, string>({
      query: (id) => ({ url: `/admin/vendors/${id}`, method: 'GET' }),
      providesTags: ['Vendors'],
    }),
    approveVendor: build.mutation<void, { id: string; approve: boolean }>({
      query: ({ id, approve }) => ({
        url: `/admin/vendors/${id}/${approve ? 'approve' : 'reject'}`,
        method: 'POST',
      }),
      invalidatesTags: ['Vendors', 'Dashboard'],
    }),
    suspendVendor: build.mutation<void, { id: string; suspend: boolean }>({
      query: ({ id, suspend }) => ({
        url: `/admin/vendors/${id}/${suspend ? 'suspend' : 'unsuspend'}`,
        method: 'POST',
      }),
      invalidatesTags: ['Vendors'],
    }),
  }),
})

export const {
  useGetVendorsQuery,
  useGetVendorDetailsQuery,
  useApproveVendorMutation,
  useSuspendVendorMutation,
} = vendorsApi

