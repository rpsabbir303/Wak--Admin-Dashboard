import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

type ConfirmState = {
  kind: 'delete_one' | 'delete_bulk' | 'disable_bulk'
  productId?: string
} | null

type Props = {
  confirm: ConfirmState
  selectedCount: number
  onClose: () => void
  onDeleteOne: (productId: string) => void
  onDeleteBulk: () => void
  onDisableBulk: () => void
}

export function ProductConfirmDialog({
  confirm,
  selectedCount,
  onClose,
  onDeleteOne,
  onDeleteBulk,
  onDisableBulk,
}: Props) {
  return (
    <Dialog open={!!confirm} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {confirm?.kind === 'delete_one'
              ? 'Delete product?'
              : confirm?.kind === 'delete_bulk'
                ? 'Delete selected products?'
                : 'Disable selected products?'}
          </DialogTitle>
          <DialogDescription>
            {confirm?.kind === 'delete_one'
              ? 'This will remove the product from the list.'
              : confirm?.kind === 'delete_bulk'
                ? `This will remove ${selectedCount} products from the list.`
                : `This will mark ${selectedCount} products as inactive.`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {confirm?.kind === 'delete_one' ? (
            <Button
              variant="destructive"
              onClick={() => {
                if (confirm.productId) onDeleteOne(confirm.productId)
                onClose()
              }}
            >
              Delete
            </Button>
          ) : confirm?.kind === 'delete_bulk' ? (
            <Button
              variant="destructive"
              onClick={() => {
                onDeleteBulk()
                onClose()
              }}
            >
              Delete selected
            </Button>
          ) : (
            <Button
              onClick={() => {
                onDisableBulk()
                onClose()
              }}
            >
              Disable selected
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

