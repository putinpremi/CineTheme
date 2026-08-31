import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button, IconButton } from '../../src/components/ui/Button';
import { TextInput } from '../../src/components/ui/Input';
import { Alert } from '../../src/components/ui/Alert';
import { Card, CardHeader, CardTitle, CardContent } from '../../src/components/ui/Card';
import { EmptyState, ErrorState } from '../../src/components/ui/EmptyState';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../src/components/ui/Tabs';
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription } from '../../src/components/ui/Dialog';

describe('Design System UI Components', () => {
  describe('Button & IconButton', () => {
    it('renders with different variants and fires click handlers', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(
        <Button variant="primary" onClick={handleClick}>
          Stream Now
        </Button>
      );

      const btn = screen.getByRole('button', { name: /Stream Now/i });
      expect(btn).toBeInTheDocument();
      await user.click(btn);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('shows loading spinner when isLoading is true and disables interactions', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(
        <Button isLoading onClick={handleClick}>
          Connecting
        </Button>
      );

      const btn = screen.getByRole('button');
      expect(btn).toBeDisabled();
      expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
      await user.click(btn);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('renders IconButton with accessible name', () => {
      render(<IconButton aria-label="Play Track" />);
      expect(screen.getByRole('button', { name: /Play Track/i })).toBeInTheDocument();
    });
  });

  describe('TextInput', () => {
    it('handles user typing and displays error messages', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(
        <TextInput
          label="Server Address"
          placeholder="https://..."
          error="Invalid URL"
          onChange={handleChange}
        />
      );

      expect(screen.getByLabelText(/Server Address/i)).toBeInTheDocument();
      expect(screen.getByText(/Invalid URL/i)).toBeInTheDocument();

      const input = screen.getByPlaceholderText('https://...');
      await user.type(input, 'https://jellyfin.local');
      expect(handleChange).toHaveBeenCalled();
    });
  });

  describe('Alert', () => {
    it('renders alert message and title', () => {
      render(
        <Alert variant="warning" title="Network Advisory">
          Slow connection detected.
        </Alert>
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/Network Advisory/i)).toBeInTheDocument();
      expect(screen.getByText(/Slow connection detected./i)).toBeInTheDocument();
    });
  });

  describe('Card', () => {
    it('renders Card with header and content', () => {
      render(
        <Card variant="cinematic">
          <CardHeader>
            <CardTitle>Featured Movie</CardTitle>
          </CardHeader>
          <CardContent>Movie synopsis details.</CardContent>
        </Card>
      );

      expect(screen.getByRole('heading', { name: /Featured Movie/i })).toBeInTheDocument();
      expect(screen.getByText(/Movie synopsis details./i)).toBeInTheDocument();
    });
  });

  describe('EmptyState & ErrorState', () => {
    it('renders EmptyState with action button', async () => {
      const user = userEvent.setup();
      const handleAction = vi.fn();

      render(
        <EmptyState
          title="No Media Found"
          description="Try a different search term"
          actionLabel="Clear Filter"
          onAction={handleAction}
        />
      );

      expect(screen.getByText(/No Media Found/i)).toBeInTheDocument();
      const btn = screen.getByRole('button', { name: /Clear Filter/i });
      await user.click(btn);
      expect(handleAction).toHaveBeenCalledTimes(1);
    });

    it('renders ErrorState with retry trigger', async () => {
      const user = userEvent.setup();
      const handleRetry = vi.fn();

      render(
        <ErrorState
          title="Server Unreachable"
          message="Check your network connection"
          onRetry={handleRetry}
        />
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/Server Unreachable/i)).toBeInTheDocument();
      const retryBtn = screen.getByRole('button', { name: /Retry/i });
      await user.click(retryBtn);
      expect(handleRetry).toHaveBeenCalledTimes(1);
    });
  });

  describe('Tabs', () => {
    it('switches tab content when clicked', async () => {
      const user = userEvent.setup();

      render(
        <Tabs defaultValue="episodes">
          <TabsList>
            <TabsTrigger value="episodes">Episodes</TabsTrigger>
            <TabsTrigger value="specials">Specials</TabsTrigger>
          </TabsList>
          <TabsContent value="episodes">Episodes List Content</TabsContent>
          <TabsContent value="specials">Specials Content</TabsContent>
        </Tabs>
      );

      expect(screen.getByText(/Episodes List Content/i)).toBeInTheDocument();

      const specialsTab = screen.getByRole('tab', { name: /Specials/i });
      await user.click(specialsTab);

      expect(screen.getByText(/Specials Content/i)).toBeInTheDocument();
    });
  });

  describe('Dialog / Modal', () => {
    it('opens and displays accessible modal content when triggered', async () => {
      const user = userEvent.setup();

      render(
        <Dialog>
          <DialogTrigger asChild>
            <Button>Open Modal</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle>Server Details</DialogTitle>
            <DialogDescription>Jellyfin server connection properties.</DialogDescription>
          </DialogContent>
        </Dialog>
      );

      const trigger = screen.getByRole('button', { name: /Open Modal/i });
      await user.click(trigger);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /Server Details/i })).toBeInTheDocument();
      expect(screen.getByText(/Jellyfin server connection properties./i)).toBeInTheDocument();
    });
  });
});
