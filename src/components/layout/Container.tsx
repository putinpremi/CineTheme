import * as React from 'react';
import { cn } from '../../utils/cn';

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, size = 'xl', ...props }, ref) => {
    const sizeClasses = {
      sm: 'max-w-3xl',
      md: 'max-w-5xl',
      lg: 'max-w-7xl',
      xl: 'max-w-[1920px]',
      full: 'max-w-full',
    };

    return (
      <div
        ref={ref}
        className={cn('w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12', sizeClasses[size], className)}
        {...props}
      />
    );
  }
);
Container.displayName = 'Container';
