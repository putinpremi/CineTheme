import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Container } from '../../src/components/layout/Container';
import { Grid, Stack } from '../../src/components/layout/Grid';

describe('Responsive Layout Primitives', () => {
  it('renders Container with custom size classes', () => {
    const { container } = render(
      <Container size="sm" className="custom-test-container">
        <span>Container Content</span>
      </Container>
    );

    expect(screen.getByText('Container Content')).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('max-w-3xl');
    expect(container.firstChild).toHaveClass('custom-test-container');
  });

  it('renders Grid with media-poster columns and gap', () => {
    const { container } = render(
      <Grid cols="media-poster" gap="lg">
        <div>Item 1</div>
        <div>Item 2</div>
      </Grid>
    );

    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('grid');
    expect(container.firstChild).toHaveClass('grid-cols-2');
  });

  it('renders Stack with row or col direction', () => {
    const { container } = render(
      <Stack direction="row" gap="md" align="center" justify="between">
        <div>Left</div>
        <div>Right</div>
      </Stack>
    );

    expect(screen.getByText('Left')).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('flex-row');
    expect(container.firstChild).toHaveClass('items-center');
    expect(container.firstChild).toHaveClass('justify-between');
  });
});
