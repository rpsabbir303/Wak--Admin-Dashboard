export type ProductRow = {
  id: string
  name: string
  productOwnerType: 'vendor' | 'admin'
  vendor: string
  category: string
  price: number
  stock: number
  status: 'active' | 'inactive' | 'out_of_stock'
  country: string
  createdAt: string
  description: string
  images: string[]
  totalSales: number
}

export const MOCK_PRODUCTS_SEED: ProductRow[] = [
  {
    id: 'P-1001',
    name: 'Wireless Headphones',
    productOwnerType: 'vendor',
    vendor: 'Cedar & Co',
    category: 'Electronics',
    price: 120,
    stock: 45,
    status: 'active',
    country: 'US',
    createdAt: '2025-03-10',
    description:
      'Premium wireless headphones with active noise cancellation, 30-hour battery life, and fast charge.',
    images: ['#895129', '#f1f5f9', '#111827'],
    totalSales: 92,
  },
  {
    id: 'P-1002',
    name: 'Leather Wallet',
    productOwnerType: 'admin',
    vendor: 'Admin Store',
    category: 'Accessories',
    price: 35,
    stock: 0,
    status: 'out_of_stock',
    country: 'BD',
    createdAt: '2025-02-20',
    description: 'Handcrafted leather wallet with 6 card slots and an RFID shield layer.',
    images: ['#111827', '#895129'],
    totalSales: 140,
  },
  {
    id: 'P-1003',
    name: 'Desk Lamp',
    productOwnerType: 'vendor',
    vendor: 'Golden Grain',
    category: 'Home',
    price: 45,
    stock: 20,
    status: 'inactive',
    country: 'AE',
    createdAt: '2025-01-15',
    description: 'Minimal desk lamp with warm LED, adjustable neck, and touch dimmer.',
    images: ['#f8f9fb', '#895129', '#0f172a'],
    totalSales: 28,
  },
]
