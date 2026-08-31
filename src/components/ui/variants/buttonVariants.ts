import { cva } from 'class-variance-authority';

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all focus-ring disabled:pointer-events-none disabled:opacity-40 select-none cursor-pointer active:scale-[0.98]',
  {
    variants: {
      variant: {
        primary:
          'bg-brand-500 text-white shadow-sm hover:bg-brand-400 active:bg-brand-600 font-semibold',
        secondary:
          'bg-surface-800 text-surface-50 border border-surface-700 hover:bg-surface-750 hover:border-surface-600 active:bg-surface-850',
        ghost:
          'text-surface-200 hover:bg-surface-800 hover:text-surface-50 active:bg-surface-750',
        danger:
          'bg-accent-rose text-white hover:bg-accent-rose/90 active:bg-accent-rose/80 font-semibold',
        outline:
          'border border-surface-700 text-surface-100 hover:bg-surface-800 hover:text-surface-50',
        cinematic:
          'bg-surface-900/80 backdrop-blur-md border border-surface-700/60 text-surface-50 hover:bg-surface-800/90 hover:border-brand-500/50 shadow-md',
      },
      size: {
        xs: 'h-7 px-2 text-xs rounded-sm',
        sm: 'h-8.5 px-3 text-xs',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base font-semibold',
        icon: 'h-10 w-10 p-0',
        'icon-sm': 'h-8 w-8 p-0',
        'icon-lg': 'h-12 w-12 p-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);
