import { Button } from './ui/button';
import { CheckCheck, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { useState } from 'react';

interface BulkActionsProps {
  selectedCount: number;
  onMarkComplete: () => void;
  onDelete: () => void;
  onClearSelection: () => void;
}

export function BulkActions({
  selectedCount,
  onMarkComplete,
  onDelete,
  onClearSelection,
}: BulkActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  if (selectedCount === 0) return null;

  return (
    <>
      <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
        <span className="text-sm font-medium">
          {selectedCount} task{selectedCount !== 1 ? 's' : ''} selected
        </span>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onMarkComplete}
          >
            <CheckCheck className="mr-2 h-4 w-4" />
            Mark Complete
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onClearSelection}
          >
            Clear
          </Button>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Selected Tasks</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedCount} task{selectedCount !== 1 ? 's' : ''}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete();
                setShowDeleteDialog(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
