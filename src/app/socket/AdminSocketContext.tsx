import { createContext, useContext } from 'react'
import type { Socket } from 'socket.io-client'

export const AdminSocketContext = createContext<Socket | null>(null)

export function useAdminSocket() {
  return useContext(AdminSocketContext)
}
