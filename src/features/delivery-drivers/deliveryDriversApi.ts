import { baseApi } from '@/app/api/baseApi'
import { buildDriverDetail } from '@/features/delivery-drivers/buildDriverDetail'
import {
  approveDriverRecord,
  blockDriverRecord,
  getDriverSnapshot,
  getOverviewSnapshot,
  rejectDriverRecord,
  suspendDriverRecord,
} from '@/features/delivery-drivers/demoDriverStore'
import type {
  DeliveryDriver,
  DeliveryDriverDetail,
  DeliveryDriversOverview,
} from '@/features/delivery-drivers/types'

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

export const deliveryDriversApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getDeliveryDriversOverview: build.query<DeliveryDriversOverview, void>({
      async queryFn() {
        await wait(340)
        return { data: getOverviewSnapshot() }
      },
      providesTags: (result) =>
        result
          ? [
              { type: 'DeliveryDrivers', id: 'LIST' },
              ...result.drivers.map((d) => ({ type: 'DeliveryDrivers' as const, id: d.id })),
            ]
          : [{ type: 'DeliveryDrivers', id: 'LIST' }],
    }),

    getDeliveryDriver: build.query<DeliveryDriverDetail, string>({
      async queryFn(id) {
        await wait(220)
        const d = getDriverSnapshot(id)
        if (!d) return { error: { status: 404, data: 'Not found' } }
        return { data: buildDriverDetail(d) }
      },
      providesTags: (_result, _err, id) => [{ type: 'DeliveryDrivers', id }],
    }),

    approveDriver: build.mutation<DeliveryDriver, { id: string }>({
      async queryFn({ id }) {
        await wait(240)
        const d = approveDriverRecord(id)
        if (!d) return { error: { status: 404, data: 'Not found' } }
        return { data: d }
      },
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'DeliveryDrivers', id },
        { type: 'DeliveryDrivers', id: 'LIST' },
      ],
    }),

    rejectDriver: build.mutation<DeliveryDriver, { id: string; reason: string }>({
      async queryFn({ id, reason }) {
        await wait(260)
        const d = rejectDriverRecord(id, reason)
        if (!d) return { error: { status: 404, data: 'Not found' } }
        return { data: d }
      },
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'DeliveryDrivers', id },
        { type: 'DeliveryDrivers', id: 'LIST' },
      ],
    }),

    suspendDriver: build.mutation<DeliveryDriver, { id: string }>({
      async queryFn({ id }) {
        await wait(220)
        const d = suspendDriverRecord(id)
        if (!d) return { error: { status: 404, data: 'Not found' } }
        return { data: d }
      },
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'DeliveryDrivers', id },
        { type: 'DeliveryDrivers', id: 'LIST' },
      ],
    }),

    blockDriver: build.mutation<DeliveryDriver, { id: string }>({
      async queryFn({ id }) {
        await wait(220)
        const d = blockDriverRecord(id)
        if (!d) return { error: { status: 404, data: 'Not found' } }
        return { data: d }
      },
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'DeliveryDrivers', id },
        { type: 'DeliveryDrivers', id: 'LIST' },
      ],
    }),

    messageDriver: build.mutation<{ ok: true }, { id: string; name: string }>({
      async queryFn() {
        await wait(180)
        return { data: { ok: true } }
      },
    }),
  }),
})

export const {
  useGetDeliveryDriversOverviewQuery,
  useGetDeliveryDriverQuery,
  useApproveDriverMutation,
  useRejectDriverMutation,
  useSuspendDriverMutation,
  useBlockDriverMutation,
  useMessageDriverMutation,
} = deliveryDriversApi
