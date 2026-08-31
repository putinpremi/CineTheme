import { describe, it, expect } from 'vitest';
import { buildItemImageUrl, buildUserAvatarUrl } from '../../src/api/client/imageUtils';

describe('Jellyfin Image URL Builder', () => {
  const serverUrl = 'https://jellyfin.example.com';
  const itemId = 'item-guid-12345';

  it('constructs basic Primary image URL with default webp format and quality', () => {
    const url = buildItemImageUrl(serverUrl, itemId, 'Primary');
    expect(url).toBe('https://jellyfin.example.com/Items/item-guid-12345/Images/Primary?quality=90&format=webp');
  });

  it('includes image cache-busting tag and sizing parameters when provided', () => {
    const url = buildItemImageUrl(serverUrl, itemId, 'Backdrop', {
      tag: 'tag-backdrop-abc',
      maxWidth: 1920,
      quality: 80,
      format: 'jpg',
    });

    expect(url).toBe(
      'https://jellyfin.example.com/Items/item-guid-12345/Images/Backdrop?tag=tag-backdrop-abc&quality=80&maxWidth=1920&format=jpg'
    );
  });

  it('appends api_key parameter only when token option is explicitly passed', () => {
    const urlWithToken = buildItemImageUrl(serverUrl, itemId, 'Primary', {
      tag: 'tag-1',
      token: 'session-token-xyz',
    });
    expect(urlWithToken).toContain('api_key=session-token-xyz');

    const urlWithoutToken = buildItemImageUrl(serverUrl, itemId, 'Primary', {
      tag: 'tag-1',
    });
    expect(urlWithoutToken).not.toContain('api_key');
  });

  it('builds user avatar image URL', () => {
    const url = buildUserAvatarUrl(serverUrl, 'user-999', { tag: 'avatar-tag' });
    expect(url).toBe('https://jellyfin.example.com/Users/user-999/Images/Primary?tag=avatar-tag&quality=90&format=webp');
  });

  it('returns empty string if serverUrl or itemId is missing', () => {
    expect(buildItemImageUrl('', itemId)).toBe('');
    expect(buildItemImageUrl(serverUrl, '')).toBe('');
  });
});
