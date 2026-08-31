import * as React from 'react';
import { Film, RefreshCw, AlertTriangle } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../../utils/cn';

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-dashed border-surface-700 p-8 text-center bg-surface-900/30',
        className
      )}
      {...props}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-800 text-surface-400 mb-4 border border-surface-700/60 shadow-inner">
        {icon ?? <Film className="h-7 w-7 text-surface-400" />}
      </div>
      <h3 className="text-base font-semibold text-surface-50 mb-1">{title}</h3>
      {description && <p className="text-sm text-surface-400 max-w-sm mb-5 leading-relaxed">{description}</p>}
      {actionLabel && onAction && (
        <Button variant="secondary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export interface ErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'An unexpected error occurred while loading content.',
  onRetry,
  className,
  ...props
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-rose-500/20 bg-rose-950/20 p-8 text-center',
        className
      )}
      {...props}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-900/40 text-rose-300 mb-4 border border-rose-500/30">
        <AlertTriangle className="h-7 w-7 text-rose-400" />
      </div>
      <h3 className="text-base font-semibold text-surface-50 mb-1">{title}</h3>
      <p className="text-sm text-surface-300 max-w-md mb-5 leading-relaxed">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          <span>Retry</span>
        </Button>
      )}
    </div>
  );
}
