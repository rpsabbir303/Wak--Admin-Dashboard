import { Input } from '@/components/ui/input'
import type { ProductRow } from '@/features/catalog/lib/mockProductsData'

type ProductStatus = ProductRow['status']
type ProductOwnerType = ProductRow['productOwnerType']

type Props = {
  category: string | 'all'
  setCategory: (value: string | 'all') => void
  ownerType: 'all' | ProductOwnerType
  setOwnerType: (value: 'all' | ProductOwnerType) => void
  status: ProductStatus | 'all'
  setStatus: (value: ProductStatus | 'all') => void
  country: string | 'all'
  setCountry: (value: string | 'all') => void
  minPrice: string
  setMinPrice: (value: string) => void
  maxPrice: string
  setMaxPrice: (value: string) => void
  categories: string[]
  countries: string[]
  onResetPage: () => void
}

export function ProductFiltersBar(props: Props) {
  const {
    category,
    setCategory,
    ownerType,
    setOwnerType,
    status,
    setStatus,
    country,
    setCountry,
    minPrice,
    setMinPrice,
    maxPrice,
    setMaxPrice,
    categories,
    countries,
    onResetPage,
  } = props

  return (
    <div className="grid grid-cols-1 gap-2 md:grid-cols-5">
      <select
        value={category}
        onChange={(e) => {
          setCategory(e.target.value)
          onResetPage()
        }}
        className="h-10 rounded-lg border border-[#EEE7DF] bg-white px-3 text-sm"
      >
        <option value="all">All categories</option>
        {categories.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <select
        value={ownerType}
        onChange={(e) => {
          setOwnerType(e.target.value as 'all' | ProductOwnerType)
          onResetPage()
        }}
        className="h-10 rounded-lg border border-[#EEE7DF] bg-white px-3 text-sm"
      >
        <option value="all">All Products</option>
        <option value="vendor">Vendor Products</option>
        <option value="admin">Admin Products</option>
      </select>

      <select
        value={status}
        onChange={(e) => {
          setStatus(e.target.value as ProductStatus | 'all')
          onResetPage()
        }}
        className="h-10 rounded-lg border border-[#EEE7DF] bg-white px-3 text-sm"
      >
        <option value="all">All status</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
        <option value="out_of_stock">Out of Stock</option>
      </select>

      <select
        value={country}
        onChange={(e) => {
          setCountry(e.target.value)
          onResetPage()
        }}
        className="h-10 rounded-lg border border-[#EEE7DF] bg-white px-3 text-sm"
      >
        <option value="all">All countries</option>
        {countries.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <div className="grid grid-cols-2 gap-2">
        <Input
          inputMode="numeric"
          value={minPrice}
          onChange={(e) => {
            setMinPrice(e.target.value)
            onResetPage()
          }}
          placeholder="Min $"
        />
        <Input
          inputMode="numeric"
          value={maxPrice}
          onChange={(e) => {
            setMaxPrice(e.target.value)
            onResetPage()
          }}
          placeholder="Max $"
        />
      </div>
    </div>
  )
}

