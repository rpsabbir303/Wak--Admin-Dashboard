import { useEffect, useState, type PropsWithChildren } from 'react'
import { io, type Socket } from 'socket.io-client'

import { pushNotification } from '@/app/notifications/notificationsSlice'
import { AdminSocketContext } from '@/app/socket/AdminSocketContext'
import { useAppDispatch } from '@/hooks/redux'
import { baseApi } from '@/app/api/baseApi'

type OrderNewPayload = {
  orderId: string
  amount?: number
}

type MessageNewPayload = {
  from: string
  ticketId?: string
}

type DeliveryUpdatePayload = {
  deliveryId: string
  status: string
}

type DriverSignupPayload = {
  driverId?: string
  name?: string
}

type DriverApprovalPayload = {
  driverId: string
  status: string
}

const socketUrl = import.meta.env.VITE_SOCKET_URL ?? import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000'

export function AdminSocketProvider({ children }: PropsWithChildren) {
  const dispatch = useAppDispatch()
  const [socket, setSocket] = useState<Socket | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      queueMicrotask(() => setSocket(null))
      return
    }

    const s: Socket = io(socketUrl, {
      transports: ['websocket'],
      auth: { token },
    })
    queueMicrotask(() => setSocket(s))

    const invalidateDrivers = () => {
      dispatch(baseApi.util.invalidateTags(['DeliveryDrivers']))
    }

    s.on('connect', () => {
      dispatch(
        pushNotification({
          kind: 'system',
          title: 'Socket connected',
          description: 'Real-time updates enabled.',
        }),
      )
    })

    s.on('order:new', (payload: OrderNewPayload) => {
      dispatch(
        pushNotification({
          kind: 'order',
          title: 'New order received',
          description: `Order #${payload.orderId}`,
        }),
      )
      dispatch(baseApi.util.invalidateTags(['Dashboard', 'Orders']))
    })

    s.on('message:new', (payload: MessageNewPayload) => {
      dispatch(
        pushNotification({
          kind: 'message',
          title: 'New message',
          description: payload.ticketId ? `Ticket #${payload.ticketId}` : `From ${payload.from}`,
        }),
      )
      dispatch(baseApi.util.invalidateTags(['Dashboard']))
    })

    s.on('delivery:update', (payload: DeliveryUpdatePayload) => {
      dispatch(
        pushNotification({
          kind: 'delivery',
          title: 'Delivery update',
          description: `${payload.deliveryId} • ${payload.status}`,
        }),
      )
      dispatch(baseApi.util.invalidateTags(['Dashboard', 'DeliveryDrivers']))
    })

    s.on('driver:status', () => {
      invalidateDrivers()
    })

    s.on('driver:delivery', (payload: { driverId?: string; orderId?: string }) => {
      dispatch(
        pushNotification({
          kind: 'delivery',
          title: 'Live delivery',
          description:
            payload.driverId && payload.orderId
              ? `Driver ${payload.driverId} • Order ${payload.orderId}`
              : 'Driver location or assignment updated.',
        }),
      )
      invalidateDrivers()
    })

    s.on('driver:signup', (payload: DriverSignupPayload) => {
      dispatch(
        pushNotification({
          kind: 'system',
          title: 'New driver signup',
          description: payload.name ? `${payload.name} submitted documents.` : 'A new driver applied.',
        }),
      )
      invalidateDrivers()
    })

    s.on('driver:approval', (payload: DriverApprovalPayload) => {
      dispatch(
        pushNotification({
          kind: 'system',
          title: 'Driver approval update',
          description: `${payload.driverId} • ${payload.status}`,
        }),
      )
      invalidateDrivers()
    })

    s.on('disconnect', () => {
      dispatch(
        pushNotification({
          kind: 'system',
          title: 'Socket disconnected',
          description: 'Trying to reconnect…',
        }),
      )
    })

    return () => {
      s.disconnect()
      queueMicrotask(() => setSocket(null))
    }
  }, [dispatch])

  return <AdminSocketContext.Provider value={socket}>{children}</AdminSocketContext.Provider>
}
