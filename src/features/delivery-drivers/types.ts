export type DriverAccountStatus = 'active' | 'pending' | 'suspended' | 'blocked' | 'rejected'

export type DriverLiveStatus = 'online' | 'offline' | 'delivering' | 'idle'

export type VehicleType = 'Motorcycle' | 'Bicycle' | 'Car' | 'Van'

export type DeliveryRowStatus = 'completed' | 'cancelled' | 'in_transit' | 'failed'

export type DriverDocument = {
  label: string
  fileName: string
  uploadedAt: string
  previewUrl: string
}

export type DriverReview = {
  id: string
  customerName: string
  customerAvatar: string
  rating: number
  text: string
  deliveryDate: string
  orderId: string
}

export type DriverDelivery = {
  id: string
  customer: string
  vendor: string
  deliveryFee: number
  distanceKm: number
  status: DeliveryRowStatus
  completedAt: string | null
  date: string
}

export type DriverDeliveryDetail = DriverDelivery & {
  pickup: string
  dropoff: string
  durationMinutes: number | null
}

export type DocumentVerificationStatus = 'approved' | 'pending' | 'rejected'

export type DocumentVerificationKind = 'nid' | 'passport' | 'license' | 'vehicle' | 'insurance' | 'profile'

export type DocumentVerification = {
  id: string
  kind: DocumentVerificationKind
  label: string
  fileName: string
  uploadedAt: string
  previewUrl: string
  status: DocumentVerificationStatus
}

export type ActivityLogCategory = 'auth' | 'delivery' | 'support' | 'admin' | 'account'

export type ActivityLogEntry = {
  id: string
  at: string
  category: ActivityLogCategory
  title: string
  detail: string
}

export type PayoutRow = {
  id: string
  date: string
  amount: number
  status: 'paid' | 'pending' | 'failed'
  method: string
}

export type CommissionRow = {
  id: string
  period: string
  amount: number
  rate: string
}

export type SupportReport = {
  id: string
  subject: string
  status: 'open' | 'resolved'
  openedAt: string
}

export type ActivityHeatPoint = { label: string; deliveries: number; hoursOnline: number }

export type CurrentDeliveryInfo = {
  orderId: string
  customer: string
  vendor: string
  pickup: string
  dropoff: string
  eta: string
}

/** Driver record for full-page profile (extends list driver + demo analytics). */
export type DeliveryDriverDetail = Omit<DeliveryDriver, 'deliveries'> & {
  deliveries: DriverDeliveryDetail[]
  yearlyEarningsSeries: EarningsPoint[]
  monthlyEarningsFull: EarningsPoint[]
  payouts: PayoutRow[]
  commissions: CommissionRow[]
  activityLogs: ActivityLogEntry[]
  documentsDetail: DocumentVerification[]
  profileCompletion: number
  verificationSummary: { identity: boolean; vehicle: boolean; insurance: boolean }
  emergencyContact: { name: string; phone: string; relation: string }
  walletBalance: number
  assignedRegion: string
  deviceInfo: { model: string; os: string; app: string; lastSync: string }
  currentDelivery: CurrentDeliveryInfo | null
  mapCoords: { lat: number; lng: number; label: string }
  routePreview: Array<{ lat: number; lng: number }>
  supportReports: SupportReport[]
  activityHeatmap: ActivityHeatPoint[]
  satisfactionSeries: { label: string; score: number }[]
  monthlyEarningsTotal: number
  activeDeliveries: number
}

export type EarningsPoint = { label: string; amount: number }

export type GrowthPoint = { label: string; count: number }

export type DeliveryDriver = {
  id: string
  name: string
  email: string
  phone: string
  country: string
  vehicleType: VehicleType
  accountStatus: DriverAccountStatus
  verified: boolean
  liveStatus: DriverLiveStatus
  rating: number
  ratingCount: number
  completedOrders: number
  cancelledOrders: number
  totalEarnings: number
  weeklyEarnings: number
  joinDate: string
  avgDeliveryMinutes: number
  avatarUrl: string
  completedToday: number
  documents?: DriverDocument[]
  reviews: DriverReview[]
  deliveries: DriverDelivery[]
  weeklyEarningsSeries: EarningsPoint[]
  monthlyEarningsSeries: EarningsPoint[]
  deliveryGrowthSeries: GrowthPoint[]
  /** Last note from admin (reject reason, internal memo). */
  lastAdminNote?: string
}

export type DeliveryDriversOverview = {
  drivers: DeliveryDriver[]
  stats: {
    totalDrivers: number
    activeDrivers: number
    pendingApprovals: number
    onlineDrivers: number
    completedDeliveriesToday: number
    totalDriverEarnings: number
  }
}
