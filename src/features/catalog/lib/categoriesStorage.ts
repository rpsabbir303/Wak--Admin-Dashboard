import { MOCK_PRODUCTS_SEED, type ProductRow } from '@/features/catalog/lib/mockProductsData'

export const CATEGORIES_UPDATED_EVENT = 'wak2018:categories-updated'
export const CATALOG_PRODUCTS_UPDATED_EVENT = 'wak2018:catalog-products-updated'
export const CATEGORY_RENAMED_EVENT = 'wak2018:category-renamed'

const STORAGE_KEY = 'wak2018_admin_categories_v1'

export type AdminCategory = {
  id: string
  name: string
  slug: string
  description: string
  imageUrl: string
  featured: boolean
  active: boolean
  parentId: string | null
  createdAt: string
}

export function slugify(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

function seedCategories(): AdminCategory[] {
  const palette = ['#895129', '#111827', '#f1f5f9']
  const names = ['Electronics', 'Accessories', 'Home']
  return names.map((name, i) => ({
    id: `cat-${i + 1}`,
    name,
    slug: slugify(name),
    description: `${name} products for storefront collections.`,
    imageUrl: palette[i] ?? '#895129',
    featured: i === 0,
    active: true,
    parentId: null,
    createdAt: `2025-01-${String(11 + i).padStart(2, '0')}`,
  }))
}

export function loadCategories(): AdminCategory[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      const seed = seedCategories()
      saveCategories(seed)
      return seed
    }
    const parsed = JSON.parse(raw) as AdminCategory[]
    if (!Array.isArray(parsed) || parsed.length === 0) {
      const seed = seedCategories()
      saveCategories(seed)
      return seed
    }
    return parsed.map((row) => ({
      ...row,
      parentId: row.parentId ?? null,
      description: typeof row.description === 'string' ? row.description : '',
      imageUrl: typeof row.imageUrl === 'string' ? row.imageUrl : '',
      slug: typeof row.slug === 'string' && row.slug ? row.slug : slugify(String(row.name ?? '')),
      featured: Boolean(row.featured),
      active: Boolean(row.active),
    }))
  } catch {
    const seed = seedCategories()
    saveCategories(seed)
    return seed
  }
}

export function saveCategories(next: AdminCategory[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  window.dispatchEvent(new CustomEvent(CATEGORIES_UPDATED_EVENT))
}

export function countProductsByCategoryName(products: Pick<ProductRow, 'category'>[]): Record<string, number> {
  const m: Record<string, number> = {}
  for (const p of products) {
    m[p.category] = (m[p.category] ?? 0) + 1
  }
  return m
}

export function mergedCategoryNamesForProducts(
  products: Pick<ProductRow, 'category'>[],
  adminRows: AdminCategory[],
): string[] {
  const fromAdmin = adminRows.filter((c) => c.active).map((c) => c.name)
  const fromProducts = [...new Set(products.map((p) => p.category).filter(Boolean))]
  return [...new Set([...fromAdmin, ...fromProducts])].sort((a, b) => a.localeCompare(b))
}

/** Featured + active categories for storefront preview (homepage section). */
export function getFeaturedStorefrontCategories(all: AdminCategory[]) {
  return all
    .filter((c) => c.featured && c.active)
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
}

export function previewCountsFromSeed(): Record<string, number> {
  return countProductsByCategoryName(MOCK_PRODUCTS_SEED)
}
