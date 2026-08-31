import * as React from 'react';
import type { VariantProps } from 'class-variance-authority';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';
import { cn } from '../../utils/cn';
import { alertVariants } from './variants/alertVariants';

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  title?: string;
}

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'default', title, children, ...props }, ref) => {
    const icons = {
      default: <Info className="h-5 w-5 text-surface-400 shrink-0 mt-0.5" />,
      info: <Info className="h-5 w-5 text-brand-400 shrink-0 mt-0.5" />,
      success: <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />,
      warning: <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />,
      error: <AlertCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />,
    };

    return (
      <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props}>
        {icons[variant ?? 'default']}
        <div className="flex-1 space-y-1">
          {title && <h5 className="font-semibold leading-none tracking-tight">{title}</h5>}
          <div className="text-sm opacity-90 leading-relaxed">{children}</div>
        </div>
      </div>
    );
  }
);
Alert.displayName = 'Alert';
