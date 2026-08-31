import { cva } from 'class-variance-authority';

export const alertVariants = cva(
  'relative w-full rounded-lg border p-4 text-sm flex gap-3.5 items-start',
  {
    variants: {
      variant: {
        default: 'bg-surface-850 border-surface-700 text-surface-50',
        info: 'bg-brand-950/40 border-brand-500/40 text-brand-200',
        success: 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200',
        warning: 'bg-amber-950/40 border-amber-500/40 text-amber-200',
        error: 'bg-rose-950/40 border-rose-500/40 text-rose-200',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);
