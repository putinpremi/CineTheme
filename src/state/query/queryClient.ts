import { QueryClient } from '@tanstack/react-query';
import { AppError } from '../../core/errors/AppError';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      retry: (failureCount, error) => {
        // Do not retry 401, 403, 404, or non-recoverable AppErrors
        if (error instanceof AppError) {
          if (!error.isRecoverable || error.statusCode === 401 || error.statusCode === 403 || error.statusCode === 404) {
            return false;
          }
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});
