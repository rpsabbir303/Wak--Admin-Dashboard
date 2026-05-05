import { Button } from '@/components/ui/button'

type Props = {
  page: number
  totalPages: number
  pageNumbers: number[]
  onChangePage: (page: number) => void
}

export function SectionPagination({ page, totalPages, pageNumbers, onChangePage }: Props) {
  return (
    <div className="mt-4 flex items-center justify-between">
      <div className="text-sm text-muted-foreground">
        Page {page} of {totalPages}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          disabled={page <= 1}
          onClick={() => onChangePage(Math.max(1, page - 1))}
        >
          Prev
        </Button>
        {pageNumbers.map((p) => (
          <Button
            key={p}
            variant={p === page ? 'default' : 'outline'}
            size="sm"
            className="h-9 w-9 px-0"
            onClick={() => onChangePage(p)}
          >
            {p}
          </Button>
        ))}
        <Button
          variant="outline"
          disabled={page >= totalPages}
          onClick={() => onChangePage(Math.min(totalPages, page + 1))}
        >
          Next
        </Button>
      </div>
    </div>
  )
}

