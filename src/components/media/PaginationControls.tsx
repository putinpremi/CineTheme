import { Button } from '../ui/Button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
  className?: string;
}

export function PaginationControls({
  currentPage,
  totalPages,
  totalCount,
  pageSize,
  onPageChange,
  isLoading = false,
  className,
}: PaginationControlsProps) {
  if (totalPages <= 1 && totalCount <= pageSize) {
    return null;
  }

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalCount);

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row items-center justify-between gap-4 py-6 border-t border-surface-800/60 text-sm text-surface-400',
        className
      )}
      aria-label="Pagination Navigation"
    >
      <div className="text-xs">
        Showing <span className="font-semibold text-surface-200">{startItem}</span> to{' '}
        <span className="font-semibold text-surface-200">{endItem}</span> of{' '}
        <span className="font-semibold text-surface-200">{totalCount}</span> items
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1 || isLoading}
          className="gap-1 px-3"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Previous</span>
        </Button>

        <span className="px-3 py-1.5 rounded-md bg-surface-900 border border-surface-800 text-xs font-medium text-surface-200">
          Page {currentPage} of {totalPages}
        </span>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages || isLoading}
          className="gap-1 px-3"
          aria-label="Next page"
        >
          <span>Next</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
