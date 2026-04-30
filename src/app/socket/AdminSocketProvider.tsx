import { useEffect, type PropsWithChildren } from 'react'
import { io, type Socket } from 'socket.io-client'

import { pushNotification } from '@/app/notifications/notificationsSlice'
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

const socketUrl = import.meta.env.VITE_SOCKET_URL ?? import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000'

export function AdminSocketProvider({ children }: PropsWithChildren) {
  const dispatch = useAppDispatch()

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (!token) return

    const socket: Socket = io(socketUrl, {
      transports: ['websocket'],
      auth: { token },
    })

    socket.on('connect', () => {
      dispatch(
        pushNotification({
          kind: 'system',
          title: 'Socket connected',
          description: 'Real-time updates enabled.',
        }),
      )
    })

    socket.on('order:new', (payload: OrderNewPayload) => {
      dispatch(
        pushNotification({
          kind: 'order',
          title: 'New order received',
          description: `Order #${payload.orderId}`,
        }),
      )
      dispatch(baseApi.util.invalidateTags(['Dashboard', 'Orders']))
    })

    socket.on('message:new', (payload: MessageNewPayload) => {
      dispatch(
        pushNotification({
          kind: 'message',
          title: 'New message',
          description: payload.ticketId ? `Ticket #${payload.ticketId}` : `From ${payload.from}`,
        }),
      )
      dispatch(baseApi.util.invalidateTags(['Dashboard']))
    })

    socket.on('delivery:update', (payload: DeliveryUpdatePayload) => {
      dispatch(
        pushNotification({
          kind: 'delivery',
          title: 'Delivery update',
          description: `${payload.deliveryId} • ${payload.status}`,
        }),
      )
      dispatch(baseApi.util.invalidateTags(['Dashboard']))
    })

    socket.on('disconnect', () => {
      dispatch(
        pushNotification({
          kind: 'system',
          title: 'Socket disconnected',
          description: 'Trying to reconnect…',
        }),
      )
    })

    return () => {
      socket.disconnect()
    }
  }, [dispatch])

  return children
}

