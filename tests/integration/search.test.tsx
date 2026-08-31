import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { AppProviders } from '../../src/app/providers';
import { useSearchMedia, useSearchDebounce } from '../../src/hooks/useSearchQueries';
import { useAuthStore } from '../../src/state/stores/useAuthStore';
import { queryClient } from '../../src/state/query/queryClient';
import { queryKeys } from '../../src/state/query/queryKeys';

describe('Search & Filtering Queries Integration (MSW + TanStack Query)', () => {
  beforeEach(() => {
    localStorage.clear();
    queryClient.clear();

    useAuthStore.setState({
      status: 'authenticated',
      session: {
        accessToken: 'test-valid-access-token-xyz',
        serverId: 'server-guid-12345',
        serverUrl: 'http://127.0.0.1:8096',
        user: { id: 'user-guid-67890', name: 'TestCinematicUser', isAdmin: true, isDisabled: false },
        lastConnected: Date.now(),
      },
      serverInfo: {
        id: 'server-guid-12345',
        name: 'CineTheme-Test-Server',
        version: '10.9.11',
        url: 'http://127.0.0.1:8096',
        isUsable: true,
      },
    });
  });

  it('performs full-text search with useSearchMedia', async () => {
    const { result } = renderHook(
      () => useSearchMedia({ query: 'Inception', page: 1, pageSize: 10 }),
      { wrapper: AppProviders }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.items).toHaveLength(1);
    expect(result.current.data?.items[0]?.name).toBe('Inception');
  });

  it('filters search results by media type (Series)', async () => {
    const { result } = renderHook(
      () => useSearchMedia({ query: 'Cinematic Film', mediaType: 'Series', page: 1, pageSize: 20 }),
      { wrapper: AppProviders }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.items.length).toBeGreaterThan(0);
    result.current.data?.items.forEach((item) => {
      expect(item.type).toBe('Series');
    });
  });

  it('filters search results by genre (Action)', async () => {
    const { result } = renderHook(
      () => useSearchMedia({ query: '', genre: 'Action', page: 1, pageSize: 20 }),
      { wrapper: AppProviders }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.items.length).toBeGreaterThan(0);
    result.current.data?.items.forEach((item) => {
      expect(item.genres).toContain('Action');
    });
  });

  it('sorts search results by rating descending', async () => {
    const { result } = renderHook(
      () =>
        useSearchMedia({
          query: '',
          genre: 'Action',
          sortBy: 'CommunityRating',
          sortOrder: 'Descending',
          page: 1,
          pageSize: 10,
        }),
      { wrapper: AppProviders }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const ratings = result.current.data?.items.map((i) => i.communityRating || 0) || [];
    for (let i = 0; i < ratings.length - 1; i++) {
      expect(ratings[i]).toBeGreaterThanOrEqual(ratings[i + 1]!);
    }
  });

  it('debounces input values accurately using useSearchDebounce', async () => {
    const { result, rerender } = renderHook(
      ({ val, delay }) => useSearchDebounce(val, delay),
      { initialProps: { val: 'inter', delay: 100 } }
    );

    expect(result.current).toBe('inter');

    rerender({ val: 'interstellar', delay: 100 });
    expect(result.current).toBe('inter'); // Should not update immediately

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 150));
    });

    expect(result.current).toBe('interstellar');
  });

  it('verifies search query keys isolate servers and users', () => {
    const keyA = queryKeys.server('server-1').user('user-1').search({ query: 'test' });
    const keyB = queryKeys.server('server-2').user('user-1').search({ query: 'test' });
    const keyC = queryKeys.server('server-1').user('user-2').search({ query: 'test' });

    expect(keyA).not.toEqual(keyB);
    expect(keyA).not.toEqual(keyC);
  });
});
