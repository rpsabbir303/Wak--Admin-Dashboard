import { Button } from '@/components/ui/button'

type Props = {
  selectedCount: number
  categories: string[]
  onDeleteSelected: () => void
  onDisableSelected: () => void
  onChangeCategory: (category: string) => void
  onClearSelection: () => void
}

export function ProductBulkActions({
  selectedCount,
  categories,
  onDeleteSelected,
  onDisableSelected,
  onChangeCategory,
  onClearSelection,
}: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={selectedCount === 0}
          onClick={onDeleteSelected}
        >
          Delete selected
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={selectedCount === 0}
          onClick={onDisableSelected}
        >
          Disable selected
        </Button>
        <select
          disabled={selectedCount === 0}
          defaultValue=""
          onChange={(e) => {
            const nextCategory = e.target.value
            if (!nextCategory) return
            onChangeCategory(nextCategory)
            e.currentTarget.value = ''
          }}
          className="h-9 rounded-lg border border-[#EEE7DF] bg-white px-3 text-sm disabled:opacity-50"
        >
          <option value="">Change category…</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <Button
        size="sm"
        variant="ghost"
        disabled={selectedCount === 0}
        onClick={onClearSelection}
      >
        Clear selection
      </Button>
    </div>
  )
}

