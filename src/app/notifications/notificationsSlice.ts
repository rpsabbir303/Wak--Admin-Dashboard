import { createSlice, nanoid, type PayloadAction } from '@reduxjs/toolkit'

export type NotificationKind = 'order' | 'message' | 'delivery' | 'system'

export type AppNotification = {
  id: string
  kind: NotificationKind
  title: string
  description?: string
  createdAt: number
  read: boolean
}

type NotificationsState = {
  items: AppNotification[]
}

const initialState: NotificationsState = {
  items: [],
}

export const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    pushNotification: {
      reducer(state, action: PayloadAction<AppNotification>) {
        state.items.unshift(action.payload)
        state.items = state.items.slice(0, 50)
      },
      prepare(input: Omit<AppNotification, 'id' | 'createdAt' | 'read'> & Partial<Pick<AppNotification, 'createdAt'>>) {
        return {
          payload: {
            id: nanoid(),
            createdAt: input.createdAt ?? Date.now(),
            read: false,
            ...input,
          } satisfies AppNotification,
        }
      },
    },
    markAllRead(state) {
      state.items.forEach((n) => {
        n.read = true
      })
    },
    markRead(state, action: PayloadAction<string>) {
      const item = state.items.find((n) => n.id === action.payload)
      if (item) item.read = true
    },
    clearNotifications(state) {
      state.items = []
    },
  },
})

export const { pushNotification, markAllRead, markRead, clearNotifications } =
  notificationsSlice.actions

export default notificationsSlice.reducer

