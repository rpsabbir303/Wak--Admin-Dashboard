import type {
  ActivityHeatPoint,
  ActivityLogEntry,
  CommissionRow,
  CurrentDeliveryInfo,
  DeliveryDriver,
  DeliveryDriverDetail,
  DocumentVerification,
  DriverDeliveryDetail,
  PayoutRow,
  SupportReport,
} from '@/features/delivery-drivers/types'
import type { EarningsPoint } from '@/features/delivery-drivers/types'

function hashId(id: string) {
  let h = 0
  for (let i = 0; i < id.length; i++) h = Math.imul(31, h) + id.charCodeAt(i)
  return Math.abs(h)
}

const pickups = [
  'Dhanmondi 32 — Spice Hub',
  'Gulshan 2 — North Kitchen',
  'Banani 11 — FreshMart',
  'Uttara 7 — Cafe Noir',
  'Mohakhali — Urban Bites',
]

const dropoffs = [
  'Bashundhara Tower B',
  'Niketon Lane 4',
  'Tejgaon Gate 3',
  'Khilgaon Eastern',
  'Farmgate Rapa Plaza',
]

function extendDeliveries(driver: DeliveryDriver, seed: number): DriverDeliveryDetail[] {
  return driver.deliveries.map((row, i) => ({
    ...row,
    pickup: pickups[(seed + i) % pickups.length]!,
    dropoff: dropoffs[(seed + i * 3) % dropoffs.length]!,
    durationMinutes:
      row.status === 'completed'
        ? Math.max(8, driver.avgDeliveryMinutes + ((seed + i) % 9) - 4)
        : null,
  }))
}

function yearlySeries(seed: number): EarningsPoint[] {
  return ['2022', '2023', '2024', '2025', '2026'].map((label, i) => ({
    label,
    amount: Math.round(8000 + seed * 120 + i * 4000),
  }))
}

function monthlyFull(seed: number): EarningsPoint[] {
  const m = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return m.map((label, i) => ({
    label,
    amount: Math.round(900 + seed * 11 + i * 85),
  }))
}

function payoutsFrom(seed: number): PayoutRow[] {
  return Array.from({ length: 5 }).map((_, i) => ({
    id: `P-${seed}-${880 + i}`,
    date: `2026-05-${String(10 + ((seed + i) % 18)).padStart(2, '0')}`,
    amount: Math.round(400 + seed * 2 + i * 100),
    status: (i % 6 === 0 ? 'pending' : 'paid') as PayoutRow['status'],
    method: i % 2 === 0 ? 'Bank transfer' : 'Wallet',
  }))
}

function commissionsFrom(seed: number): CommissionRow[] {
  return ['Q1 2026', 'Q4 2025', 'Q3 2025'].map((period, i) => ({
    id: `C-${seed}-${i}`,
    period,
    amount: Math.round(80 + seed + i * 20),
    rate: `8.${(seed + i) % 5}%`,
  }))
}

function activityLogs(driver: DeliveryDriver, seed: number): ActivityLogEntry[] {
  const rows: Omit<ActivityLogEntry, 'id'>[] = [
    { at: '2026-05-04 08:12', category: 'auth', title: 'App login', detail: 'Mobile session' },
    { at: '2026-05-04 07:55', category: 'delivery', title: 'Delivery accepted', detail: 'Order batch' },
    { at: '2026-05-03 18:02', category: 'admin', title: 'Admin review', detail: 'Fleet note' },
    { at: '2026-05-03 14:30', category: 'delivery', title: 'Completed run', detail: '24m trip' },
    { at: '2026-05-02 11:05', category: 'auth', title: 'Token refresh', detail: 'Security' },
  ]
  return rows.map((e, i) => ({ ...e, id: `${driver.id}-L-${seed + i}` }))
}

function documentsDetail(driver: DeliveryDriver): DocumentVerification[] {
  if (driver.documents?.length) {
    return driver.documents.map((d, i) => ({
      id: `${driver.id}-doc-${i}`,
      kind: (['nid', 'license', 'vehicle', 'profile'] as const)[i % 4]!,
      label: d.label,
      fileName: d.fileName,
      uploadedAt: d.uploadedAt,
      previewUrl: d.previewUrl,
      status:
        driver.accountStatus === 'pending'
          ? 'pending'
          : driver.verified
            ? 'approved'
            : 'pending',
    }))
  }
  const base: Omit<DocumentVerification, 'id' | 'status'>[] = [
    { kind: 'nid', label: 'National ID', fileName: `${driver.id}_nid.jpg`, uploadedAt: driver.joinDate, previewUrl: 'https://placehold.co/400x240/eadbc9/62371a?text=NID' },
    { kind: 'passport', label: 'Passport', fileName: `${driver.id}_pp.pdf`, uploadedAt: driver.joinDate, previewUrl: 'https://placehold.co/400x240/d8bb96/3d200e?text=Passport' },
    { kind: 'license', label: 'License', fileName: `${driver.id}_lic.pdf`, uploadedAt: driver.joinDate, previewUrl: 'https://placehold.co/400x240/c49b63/fff?text=License' },
    { kind: 'vehicle', label: 'Vehicle reg.', fileName: `${driver.id}_veh.jpg`, uploadedAt: driver.joinDate, previewUrl: 'https://placehold.co/400x240/aa7440/fff?text=Vehicle' },
    { kind: 'insurance', label: 'Insurance', fileName: `${driver.id}_ins.pdf`, uploadedAt: driver.joinDate, previewUrl: 'https://placehold.co/400x240/764421/fff?text=Insurance' },
    { kind: 'profile', label: 'Profile photo', fileName: `${driver.id}_pro.png`, uploadedAt: driver.joinDate, previewUrl: driver.avatarUrl },
  ]
  return base.map((d, i) => ({
    id: `${driver.id}-doc-${i}`,
    ...d,
    status: (driver.verified && driver.accountStatus === 'active' ? 'approved' : 'pending') as DocumentVerification['status'],
  }))
}

function supportReports(seed: number): SupportReport[] {
  return [
    { id: `S-${seed}-1`, subject: 'Late arrival', status: 'open', openedAt: '2026-05-02' },
    { id: `S-${seed}-2`, subject: 'Payout question', status: 'resolved', openedAt: '2026-04-12' },
  ]
}

function heatmap(seed: number): ActivityHeatPoint[] {
  return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((label, i) => ({
    label,
    deliveries: Math.max(0, Math.round(2 + (seed % 5) + i * 0.6)),
    hoursOnline: Math.round(2 + (seed % 3) + i * 0.4),
  }))
}

function satisfaction(seed: number) {
  return ['W1', 'W2', 'W3', 'W4'].map((label, i) => ({
    label,
    score: Math.min(5, 3.8 + ((seed + i) % 8) / 10),
  }))
}

function currentDeliveryFrom(rows: DriverDeliveryDetail[]): CurrentDeliveryInfo | null {
  const r = rows.find((x) => x.status === 'in_transit')
  if (!r) return null
  return {
    orderId: r.id.replace(/^D-/, 'O-'),
    customer: r.customer,
    vendor: r.vendor,
    pickup: r.pickup,
    dropoff: r.dropoff,
    eta: '14 min',
  }
}

export function buildDriverDetail(driver: DeliveryDriver): DeliveryDriverDetail {
  const seed = hashId(driver.id)
  const deliveries = extendDeliveries(driver, seed)
  const monthlyEarningsFull = monthlyFull(seed)
  const monthlyEarningsTotal = monthlyEarningsFull.reduce((s, p) => s + p.amount, 0)

  return {
    ...driver,
    deliveries,
    yearlyEarningsSeries: yearlySeries(seed),
    monthlyEarningsFull,
    payouts: payoutsFrom(seed),
    commissions: commissionsFrom(seed),
    activityLogs: activityLogs(driver, seed),
    documentsDetail: documentsDetail(driver),
    profileCompletion: Math.min(
      100,
      (driver.verified ? 42 : 12) + (driver.completedOrders > 0 ? 30 : 8) + (driver.ratingCount > 5 ? 18 : 10),
    ),
    verificationSummary: {
      identity: driver.verified,
      vehicle: driver.verified || seed % 4 === 0,
      insurance: driver.verified && driver.accountStatus === 'active',
    },
    emergencyContact: {
      name: seed % 2 === 0 ? 'Rashida Hassan' : 'Michael Torres',
      phone: seed % 2 === 0 ? '+880 1711 009922' : '+1 415 555 2210',
      relation: 'Spouse',
    },
    walletBalance: Math.round(driver.totalEarnings * 0.04 + seed),
    assignedRegion: `${driver.country} — Metro`,
    deviceInfo: {
      model: seed % 2 === 0 ? 'iPhone 15' : 'Galaxy S24',
      os: seed % 2 === 0 ? 'iOS 18' : 'Android 15',
      app: 'WakRider 4.12',
      lastSync: '2026-05-04 08:10',
    },
    currentDelivery: currentDeliveryFrom(deliveries),
    mapCoords: { lat: 23.78 + (seed % 80) / 5000, lng: 90.4 + (seed % 80) / 5000, label: 'Last GPS' },
    routePreview: [
      { lat: 23.78, lng: 90.405 },
      { lat: 23.784, lng: 90.41 },
      { lat: 23.788, lng: 90.417 },
    ],
    supportReports: supportReports(seed),
    activityHeatmap: heatmap(seed),
    satisfactionSeries: satisfaction(seed),
    monthlyEarningsTotal,
    activeDeliveries: deliveries.filter((d) => d.status === 'in_transit').length,
  }
}
