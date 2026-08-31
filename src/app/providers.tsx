import * as React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../state/query/queryClient';
import { TooltipProvider } from '../components/ui/Tooltip';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';

export interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider delayDuration={300}>
          {children}
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
