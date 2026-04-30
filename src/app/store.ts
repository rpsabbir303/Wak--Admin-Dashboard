import { configureStore } from '@reduxjs/toolkit'

import { baseApi } from '@/app/api/baseApi'
import notificationsReducer from '@/app/notifications/notificationsSlice'

export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    notifications: notificationsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

