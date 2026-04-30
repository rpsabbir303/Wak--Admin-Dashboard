import { baseApi } from '@/app/api/baseApi'

export type UserRole = 'customer' | 'vendor' | 'driver'
export type UserStatus = 'active' | 'blocked'

export type UserRow = {
  id: string
  name: string
  email: string
  role: UserRole
  country: string
  status: UserStatus
}

export type UsersListResponse = {
  items: UserRow[]
  page: number
  pageSize: number
  total: number
}

export type GetUsersParams = {
  q?: string
  role?: UserRole | 'all'
  status?: UserStatus | 'all'
  page?: number
  pageSize?: number
}

export const usersApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getUsers: build.query<UsersListResponse, GetUsersParams>({
      query: (params) => ({ url: '/admin/users', method: 'GET', params }),
      providesTags: ['Users'],
    }),
    blockUser: build.mutation<void, { id: string; block: boolean }>({
      query: ({ id, block }) => ({
        url: `/admin/users/${id}/${block ? 'block' : 'unblock'}`,
        method: 'POST',
      }),
      invalidatesTags: ['Users', 'Dashboard'],
    }),
    changeUserRole: build.mutation<void, { id: string; role: UserRole }>({
      query: ({ id, role }) => ({
        url: `/admin/users/${id}/role`,
        method: 'PATCH',
        body: { role },
      }),
      invalidatesTags: ['Users'],
    }),
  }),
})

export const { useGetUsersQuery, useBlockUserMutation, useChangeUserRoleMutation } =
  usersApi

