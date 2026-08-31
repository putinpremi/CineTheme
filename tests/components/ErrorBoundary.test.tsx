import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '../../src/components/ui/ErrorBoundary';

function ProblemComponent(): React.ReactElement {
  throw new Error('Test rendering crash');
}

describe('ErrorBoundary', () => {
  it('catches render errors and renders fallback recovery UI', () => {
    // Suppress console.error during expected crash test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ProblemComponent />
      </ErrorBoundary>
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Something went wrong/i })).toBeInTheDocument();
    expect(screen.getByText(/Test rendering crash/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reload Application/i })).toBeInTheDocument();

    consoleSpy.mockRestore();
  });
});
