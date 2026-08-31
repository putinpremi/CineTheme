import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { AppProviders } from '../../src/app/providers';
import {
  useUserLibraries,
  useLibraryItems,
  useItemDetails,
  useResumeItems,
  useRecentlyAdded,
  useGenres,
  useCollections,
} from '../../src/hooks/useMediaQueries';
import { useAuthStore } from '../../src/state/stores/useAuthStore';
import { queryClient } from '../../src/state/query/queryClient';
import { queryKeys } from '../../src/state/query/queryKeys';

describe('Media & Library Queries Integration (MSW + TanStack Query)', () => {
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

  it('fetches user libraries using useUserLibraries', async () => {
    const { result } = renderHook(() => useUserLibraries(), {
      wrapper: AppProviders,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(3);
    expect(result.current.data?.[0]?.name).toBe('Movies');
    expect(result.current.data?.[1]?.name).toBe('TV Shows');
  });

  it('fetches library media items with pagination using useLibraryItems', async () => {
    const { result } = renderHook(() => useLibraryItems('lib-movies-1', 1, 20), {
      wrapper: AppProviders,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.items).toHaveLength(20);
    expect(result.current.data?.totalCount).toBe(60);
    expect(result.current.data?.currentPage).toBe(1);
    expect(result.current.data?.totalPages).toBe(3);
  });

  it('fetches single item metadata using useItemDetails', async () => {
    const { result } = renderHook(() => useItemDetails('movie-item-1'), {
      wrapper: AppProviders,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.name).toBe('Inception');
    expect(result.current.data?.productionYear).toBe(2010);
    expect(result.current.data?.runTimeSeconds).toBe(8880);
    expect(result.current.data?.genres).toContain('Sci-Fi');
  });

  it('fetches resume items and recently added media', async () => {
    const { result: resumeHook } = renderHook(() => useResumeItems(5), {
      wrapper: AppProviders,
    });
    const { result: latestHook } = renderHook(() => useRecentlyAdded(undefined, 10), {
      wrapper: AppProviders,
    });

    await waitFor(() => expect(resumeHook.current.isSuccess).toBe(true));
    await waitFor(() => expect(latestHook.current.isSuccess).toBe(true));

    expect(resumeHook.current.data).toHaveLength(1);
    expect(resumeHook.current.data?.[0]?.playbackPositionSeconds).toBe(2400);

    expect(latestHook.current.data).toHaveLength(10);
  });

  it('fetches genres and collections', async () => {
    const { result: genreHook } = renderHook(() => useGenres(), {
      wrapper: AppProviders,
    });
    const { result: colHook } = renderHook(() => useCollections(), {
      wrapper: AppProviders,
    });

    await waitFor(() => expect(genreHook.current.isSuccess).toBe(true));
    await waitFor(() => expect(colHook.current.isSuccess).toBe(true));

    expect(genreHook.current.data).toHaveLength(3);
    expect(colHook.current.data).toHaveLength(1);
    expect(colHook.current.data?.[0]?.name).toBe('Dark Knight Trilogy');
  });

  it('verifies structured query keys isolate servers and users', () => {
    const keyA = queryKeys.server('server-A').user('user-1').libraries();
    const keyB = queryKeys.server('server-B').user('user-1').libraries();
    const keyC = queryKeys.server('server-A').user('user-2').libraries();

    expect(keyA).not.toEqual(keyB);
    expect(keyA).not.toEqual(keyC);
    expect(keyA[2]).toBe('server-A');
    expect(keyB[2]).toBe('server-B');
  });

  it('handles 404 on non-existent item query gracefully', async () => {
    const { result } = renderHook(() => useItemDetails('non-existent-item'), {
      wrapper: AppProviders,
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toContain('not found');
  });
});
