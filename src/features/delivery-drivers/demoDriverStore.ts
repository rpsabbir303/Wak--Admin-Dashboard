import {
  DEMO_DRIVERS_SEED,
  computeOverviewStats,
  deliveriesTemplate,
  growthSeries,
  monthSeries,
  weekSeries,
} from '@/features/delivery-drivers/demoData'
import type { DeliveryDriver, DriverAccountStatus, DriverLiveStatus } from '@/features/delivery-drivers/types'

function deepClone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T
}

let drivers: DeliveryDriver[] = deepClone(DEMO_DRIVERS_SEED)

export function resetDemoDrivers() {
  drivers = deepClone(DEMO_DRIVERS_SEED)
}

export function snapshotDrivers(): DeliveryDriver[] {
  return deepClone(drivers)
}

export function getDriverSnapshot(id: string): DeliveryDriver | undefined {
  const d = drivers.find((x) => x.id === id)
  return d ? deepClone(d) : undefined
}

export function patchDriver(id: string, patch: Partial<DeliveryDriver>): DeliveryDriver | null {
  const idx = drivers.findIndex((x) => x.id === id)
  if (idx === -1) return null
  drivers[idx] = { ...drivers[idx], ...patch }
  return deepClone(drivers[idx])
}

export function setDriverLiveStatus(id: string, liveStatus: DriverLiveStatus) {
  return patchDriver(id, { liveStatus })
}

/** Random small presence update for demo “live” feel (optional hook). */
export function demoRandomLiveTick() {
  const pool = drivers.filter((d) => d.accountStatus === 'active')
  if (pool.length === 0) return null
  const pick = pool[Math.floor(Math.random() * pool.length)]!
  const next: DriverLiveStatus[] = ['online', 'offline', 'delivering', 'idle']
  const liveStatus = next[Math.floor(Math.random() * next.length)]!
  return patchDriver(pick.id, { liveStatus })
}

export function approveDriverRecord(id: string) {
  const idx = drivers.findIndex((x) => x.id === id)
  if (idx === -1) return null
  const prev = drivers[idx]!
  const wasPending = prev.accountStatus === 'pending'
  const seed = parseInt(prev.id.replace(/\D/g, ''), 10) % 14 || 3
  return patchDriver(id, {
    accountStatus: 'active' as DriverAccountStatus,
    verified: true,
    documents: undefined,
    liveStatus: 'offline',
    ...(wasPending
      ? {
          deliveries: deliveriesTemplate(id.replace('DRV-', '')),
          weeklyEarningsSeries: weekSeries(seed),
          monthlyEarningsSeries: monthSeries(seed),
          deliveryGrowthSeries: growthSeries(seed),
        }
      : {}),
  })
}

export function rejectDriverRecord(id: string, reason?: string) {
  return patchDriver(id, {
    accountStatus: 'rejected',
    verified: false,
    liveStatus: 'offline',
    lastAdminNote: reason,
  })
}

export function suspendDriverRecord(id: string) {
  return patchDriver(id, {
    accountStatus: 'suspended',
    liveStatus: 'offline',
    weeklyEarnings: 0,
  })
}

export function blockDriverRecord(id: string) {
  return patchDriver(id, {
    accountStatus: 'blocked',
    liveStatus: 'offline',
    weeklyEarnings: 0,
  })
}

export function overviewFrom(list: DeliveryDriver[]) {
  return {
    drivers: deepClone(list),
    stats: computeOverviewStats(list),
  }
}

export function getOverviewSnapshot() {
  return overviewFrom(drivers)
}
