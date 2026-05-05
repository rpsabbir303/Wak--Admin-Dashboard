import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ImagePlus, Plus, Upload } from 'lucide-react'

import { PageShell } from '@/components/PageShell'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { loadCategories } from '@/features/catalog/lib/categoriesStorage'

type CountryMode = 'single' | 'multi'

type HighlightRow = {
  id: string
  key: string
  value: string
}

export default function AddProductPage() {
  const navigate = useNavigate()
  const categories = useMemo(() => loadCategories().map((c) => c.name), [])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState('')
  const [category, setCategory] = useState(categories[0] ?? 'General')
  const [countryMode, setCountryMode] = useState<CountryMode>('single')
  const [countryInput, setCountryInput] = useState('')
  const [countries, setCountries] = useState<string[]>([])
  const [price, setPrice] = useState('')
  const [discount, setDiscount] = useState('')
  const [stock, setStock] = useState('')
  const [active, setActive] = useState(true)
  const [images, setImages] = useState<string[]>([])
  const [highlights, setHighlights] = useState<HighlightRow[]>([
    { id: 'hl-1', key: 'Color', value: 'Green' },
    { id: 'hl-2', key: 'Material', value: 'Leather' },
  ])
  const [description, setDescription] = useState('')
  const [details, setDetails] = useState('')

  function addCountry() {
    const value = countryInput.trim()
    if (!value) return
    setCountries((prev) => {
      if (countryMode === 'single') return [value]
      if (prev.includes(value)) return prev
      return [...prev, value]
    })
    setCountryInput('')
  }

  function removeCountry(value: string) {
    setCountries((prev) => prev.filter((c) => c !== value))
  }

  function addImages(files: FileList | null) {
    if (!files?.length) return
    const entries = Array.from(files).filter((f) => f.type.startsWith('image/'))
    entries.forEach((file) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = typeof reader.result === 'string' ? reader.result : ''
        if (!result) return
        setImages((prev) => [...prev, result])
      }
      reader.readAsDataURL(file)
    })
  }

  function updateHighlight(id: string, patch: Partial<HighlightRow>) {
    setHighlights((prev) => prev.map((h) => (h.id === id ? { ...h, ...patch } : h)))
  }

  function addHighlight() {
    const id = `hl-${Math.random().toString(36).slice(2, 8)}`
    setHighlights((prev) => [...prev, { id, key: '', value: '' }])
  }

  function removeHighlight(id: string) {
    setHighlights((prev) => prev.filter((h) => h.id !== id))
  }

  function saveProduct() {
    // Layout-focused page: keeping action lightweight for now.
    navigate('/products')
  }

  return (
    <PageShell
      title="Add product"
      description="Create and publish a new product with pricing, media, and highlights."
      right={
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => navigate('/products')}>
            Cancel
          </Button>
          <Button onClick={saveProduct}>Save product</Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Card className="border-[#EEE7DF] shadow-soft">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Basic Info</CardTitle>
              <p className="text-sm text-muted-foreground">Core details used across your store.</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Product Name" />
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="h-10 rounded-xl border border-[#89512930] bg-white px-3 text-sm"
                >
                  {categories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Product Country</div>
                <div className="inline-flex rounded-xl border border-[#EEE7DF] bg-[#faf7f3] p-1">
                  <Button
                    type="button"
                    size="sm"
                    variant={countryMode === 'single' ? 'default' : 'ghost'}
                    className="h-8 rounded-lg px-3"
                    onClick={() => setCountryMode('single')}
                  >
                    Single
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={countryMode === 'multi' ? 'default' : 'ghost'}
                    className="h-8 rounded-lg px-3"
                    onClick={() => setCountryMode('multi')}
                  >
                    Multi
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Input
                    value={countryInput}
                    onChange={(e) => setCountryInput(e.target.value)}
                    placeholder="Country"
                  />
                  <Button type="button" variant="outline" onClick={addCountry}>
                    Add
                  </Button>
                </div>

                {countries.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No countries selected yet.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {countries.map((item) => (
                      <button
                        type="button"
                        key={item}
                        className="rounded-full border border-[#EEE7DF] bg-white px-2.5 py-1 text-xs"
                        onClick={() => removeCountry(item)}
                        title="Remove"
                      >
                        {item} ×
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="numeric" placeholder="Price" />
                <Input
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  inputMode="numeric"
                  placeholder="Discount (optional)"
                />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Input
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  inputMode="numeric"
                  placeholder="Stock"
                  className="sm:max-w-[220px]"
                />
                <div className="flex items-center gap-3">
                  <span className="text-sm text-foreground">Active</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={active}
                    onClick={() => setActive((v) => !v)}
                    className={cn(
                      'inline-flex h-6 w-11 items-center rounded-full p-0.5 transition-colors',
                      active ? 'justify-end bg-primary' : 'justify-start bg-[#e7e5e4]',
                    )}
                  >
                    <span className="h-5 w-5 rounded-full bg-white shadow-sm" />
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#EEE7DF] shadow-soft">
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
              <div>
                <CardTitle className="text-base">Product Images</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">Upload multiple images. Pick a main image.</p>
              </div>
              <Button variant="outline" size="sm" className="h-9" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4" />
                Upload
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                onChange={(e) => {
                  addImages(e.target.files)
                  e.currentTarget.value = ''
                }}
              />
              <div
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click()
                }}
                onClick={() => fileInputRef.current?.click()}
                className="grid min-h-[210px] place-items-center rounded-xl border border-dashed border-[#DCCBBC] bg-[#faf9f7] p-5 text-center"
              >
                {images.length === 0 ? (
                  <div className="space-y-2">
                    <div className="mx-auto grid h-11 w-11 place-items-center rounded-xl border border-[#EEE7DF] bg-white">
                      <ImagePlus className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-foreground">No images yet</p>
                    <p className="text-xs text-muted-foreground">Upload at least one image for best results.</p>
                  </div>
                ) : (
                  <div className="grid w-full grid-cols-3 gap-2">
                    {images.map((image, idx) => (
                      <div key={`${image}-${idx}`} className="overflow-hidden rounded-lg border border-[#EEE7DF]">
                        <img src={image} alt="" className="h-20 w-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {images.length === 0 && (
                <p className="text-xs font-medium text-red-600">At least 1 image is required.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="border-[#EEE7DF] shadow-soft">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Description</CardTitle>
            <p className="text-sm text-muted-foreground">Write a short overview and optional bullet points.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short description for your product..."
                className="h-28 w-full resize-none rounded-xl border border-[#89512930] bg-white p-3 text-sm placeholder:text-[#7c6a58] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#89512920]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Product Details (bullets)</label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder={'• Genuine leather\n• RFID blocking\n• Slim profile'}
                className="h-24 w-full resize-none rounded-xl border border-[#89512930] bg-white p-3 text-sm placeholder:text-[#7c6a58] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#89512920]"
              />
            </div>
            <p className="text-xs text-muted-foreground">One bullet per line. You can include &quot;*&quot; or &quot;-&quot;.</p>
          </CardContent>
        </Card>

        <Card className="border-[#EEE7DF] shadow-soft">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
            <div>
              <CardTitle className="text-base">Top Highlights</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                Add key details like: Color → Green, Material → Leather
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" className="h-9" onClick={addHighlight}>
              <Plus className="h-4 w-4" />
              Add Highlight
            </Button>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {highlights.map((h) => (
              <div key={h.id} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto]">
                <Input
                  placeholder="Key"
                  value={h.key}
                  onChange={(e) => updateHighlight(h.id, { key: e.target.value })}
                />
                <Input
                  placeholder="Value"
                  value={h.value}
                  onChange={(e) => updateHighlight(h.id, { value: e.target.value })}
                />
                <Button type="button" variant="ghost" size="sm" onClick={() => removeHighlight(h.id)}>
                  Remove
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  )
}

