import * as React from 'react';
import { cn } from '../../utils/cn';

export interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 'auto-fill' | 'media-poster';
  gap?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Grid = React.forwardRef<HTMLDivElement, GridProps>(
  ({ className, cols = 'media-poster', gap = 'md', ...props }, ref) => {
    const gapClasses = {
      sm: 'gap-2.5 sm:gap-3',
      md: 'gap-4 sm:gap-5 lg:gap-6',
      lg: 'gap-6 sm:gap-8',
      xl: 'gap-8 sm:gap-10',
    };

    const colClasses = {
      1: 'grid-cols-1',
      2: 'grid-cols-1 sm:grid-cols-2',
      3: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3',
      4: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
      5: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5',
      6: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6',
      7: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7',
      8: 'grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8',
      'auto-fill': 'grid-cols-[repeat(auto-fill,minmax(220px,1fr))]',
      'media-poster': 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7',
    };

    return (
      <div
        ref={ref}
        className={cn('grid w-full', colClasses[cols], gapClasses[gap], className)}
        {...props}
      />
    );
  }
);
Grid.displayName = 'Grid';

export interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: 'row' | 'col';
  gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between';
}

export const Stack = React.forwardRef<HTMLDivElement, StackProps>(
  ({ className, direction = 'col', gap = 'md', align = 'stretch', justify = 'start', ...props }, ref) => {
    const dirClasses = direction === 'row' ? 'flex-row' : 'flex-col';
    const gapClasses = {
      xs: 'gap-1.5',
      sm: 'gap-3',
      md: 'gap-5',
      lg: 'gap-8',
      xl: 'gap-12',
    };
    const alignClasses = {
      start: 'items-start',
      center: 'items-center',
      end: 'items-end',
      stretch: 'items-stretch',
    };
    const justifyClasses = {
      start: 'justify-start',
      center: 'justify-center',
      end: 'justify-end',
      between: 'justify-between',
    };

    return (
      <div
        ref={ref}
        className={cn('flex', dirClasses, gapClasses[gap], alignClasses[align], justifyClasses[justify], className)}
        {...props}
      />
    );
  }
);
Stack.displayName = 'Stack';
