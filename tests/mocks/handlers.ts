import { http, HttpResponse } from 'msw';

export const mockPublicInfo = {
  ServerName: 'CineTheme-Test-Server',
  Version: '10.9.11',
  Id: 'server-guid-12345',
  StartupWizardCompleted: true,
  LocalAddress: 'http://192.168.1.100:8096',
  OperatingSystem: 'Linux',
};

export const mockAuthSuccess = {
  User: {
    Id: 'user-guid-67890',
    Name: 'TestCinematicUser',
    HasPassword: true,
    Policy: {
      IsAdministrator: true,
      IsDisabled: false,
    },
    PrimaryImageTag: 'tag-avatar-abc',
  },
  SessionInfo: {
    Id: 'session-guid-999',
    UserId: 'user-guid-67890',
    UserName: 'TestCinematicUser',
    Client: 'CineTheme',
  },
  AccessToken: 'test-valid-access-token-xyz',
  ServerId: 'server-guid-12345',
};

export const mockLibraries = [
  {
    Id: 'lib-movies-1',
    Name: 'Movies',
    CollectionType: 'movies',
    Type: 'CollectionFolder',
    ServerId: 'server-guid-12345',
    ImageTags: { Primary: 'tag-lib-movies' },
  },
  {
    Id: 'lib-tv-2',
    Name: 'TV Shows',
    CollectionType: 'tvshows',
    Type: 'CollectionFolder',
    ServerId: 'server-guid-12345',
    ImageTags: { Primary: 'tag-lib-tv' },
  },
  {
    Id: 'lib-anime-3',
    Name: 'Anime',
    CollectionType: 'tvshows',
    Type: 'CollectionFolder',
    ServerId: 'server-guid-12345',
    ImageTags: { Primary: 'tag-lib-anime' },
  },
];

export const mockMovieItem = {
  Id: 'movie-item-1',
  Name: 'Inception',
  OriginalTitle: 'Inception (Original)',
  ServerId: 'server-guid-12345',
  Type: 'Movie',
  CollectionType: 'movies',
  Overview: 'A thief who steals corporate secrets through dream-sharing technology.',
  ProductionYear: 2010,
  RunTimeTicks: 88800000000, // 8880 seconds ~ 148 mins
  CommunityRating: 8.8,
  OfficialRating: 'PG-13',
  Genres: ['Action', 'Adventure', 'Sci-Fi'],
  Studios: [{ Name: 'Warner Bros. Pictures', Id: 'studio-1' }],
  People: [
    { Name: 'Christopher Nolan', Role: 'Director', Type: 'Director', Id: 'person-1' },
    { Name: 'Leonardo DiCaprio', Role: 'Cobb', Type: 'Actor', Id: 'person-2' },
  ],
  ImageTags: { Primary: 'tag-inception-poster', Backdrop: 'tag-inception-backdrop' },
  BackdropImageTags: ['tag-inception-backdrop'],
  UserData: {
    PlaybackPositionTicks: 24000000000, // 2400 seconds (resumable)
    PlayCount: 1,
    IsFavorite: true,
    Played: false,
  },
};

export const mockMediaList = Array.from({ length: 60 }).map((_, idx) => ({
  Id: `media-item-${idx + 1}`,
  Name: `Cinematic Film ${idx + 1}`,
  OriginalTitle: `Original Film ${idx + 1}`,
  ServerId: 'server-guid-12345',
  Type: idx % 4 === 0 ? 'Series' : 'Movie',
  ProductionYear: 2020 + (idx % 5),
  RunTimeTicks: 72000000000,
  CommunityRating: 8.0 + (idx % 10) * 0.1,
  Genres: idx % 2 === 0 ? ['Action', 'Sci-Fi'] : ['Drama', 'Thriller'],
  ImageTags: { Primary: `tag-media-${idx + 1}` },
  BackdropImageTags: [`tag-backdrop-${idx + 1}`],
  UserData: {
    PlaybackPositionTicks: 0,
    PlayCount: idx % 3 === 0 ? 1 : 0,
    IsFavorite: idx % 5 === 0,
    Played: idx % 3 === 0,
  },
}));

function isAuthorized(request: Request): boolean {
  const authHeader = request.headers.get('X-Emby-Authorization') || request.headers.get('Authorization') || '';
  return authHeader.includes('Token="test-valid-access-token-xyz"');
}

export const handlers = [
  // Public Server Information
  http.get(/\/System\/Info\/Public$/, () => {
    return HttpResponse.json(mockPublicInfo);
  }),

  // QuickConnect check
  http.get(/\/QuickConnect\/Enabled$/, () => {
    return HttpResponse.json(true);
  }),

  // Authenticate by Name & Password
  http.post(/\/Users\/AuthenticateByName$/, async ({ request }) => {
    const body = (await request.json()) as { Username?: string; Pw?: string };

    if (body.Username === 'demo' && body.Pw === 'password123') {
      return HttpResponse.json(mockAuthSuccess);
    }

    if (body.Username === 'disabled_user') {
      return new HttpResponse(JSON.stringify({ message: 'User is disabled.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new HttpResponse(null, { status: 401, statusText: 'Unauthorized' });
  }),

  // Logout Session
  http.post(/\/Sessions\/Logout$/, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // User Libraries (Views)
  http.get(/\/Users\/[^/]+\/Views$/, ({ request }) => {
    if (!isAuthorized(request)) {
      return new HttpResponse(null, { status: 401, statusText: 'Unauthorized' });
    }

    return HttpResponse.json({
      Items: mockLibraries,
      TotalRecordCount: mockLibraries.length,
    });
  }),

  // Resume Items (Continue Watching)
  http.get(/\/Users\/[^/]+\/Items\/Resume$/, ({ request }) => {
    if (!isAuthorized(request)) {
      return new HttpResponse(null, { status: 401, statusText: 'Unauthorized' });
    }

    return HttpResponse.json({
      Items: [mockMovieItem],
      TotalRecordCount: 1,
    });
  }),

  // Latest Media Items (Recently Added)
  http.get(/\/Users\/[^/]+\/Items\/Latest$/, ({ request }) => {
    if (!isAuthorized(request)) {
      return new HttpResponse(null, { status: 401, statusText: 'Unauthorized' });
    }

    return HttpResponse.json(mockMediaList.slice(0, 10));
  }),

  // PlaybackInfo Negotiation (POST /Items/:itemId/PlaybackInfo)
  http.post(/\/Items\/([^/]+)\/PlaybackInfo$/, async ({ request, params }) => {
    if (!isAuthorized(request)) {
      return new HttpResponse(null, { status: 401, statusText: 'Unauthorized' });
    }

    const itemId = String(params[0] || 'movie-item-1');

    // Handle test error trigger
    if (itemId === 'error-item-trigger') {
      return new HttpResponse(null, { status: 500, statusText: 'Internal Server Error' });
    }

    // Check if DirectPlay or Transcode was negotiated
    const isTranscodeForced = itemId.includes('transcode');
    const isDirectStream = itemId.includes('directstream') || itemId.includes('remux');

    const mediaSource = {
      Id: `source-${itemId}`,
      Path: `/media/movies/${itemId}.mp4`,
      Protocol: 'File',
      Container: isDirectStream ? 'mkv' : 'mp4',
      Size: 8500000000,
      Name: 'Standard 1080p Stream',
      IsRemote: false,
      RunTimeTicks: 88800000000,
      SupportsDirectPlay: !isTranscodeForced && !isDirectStream,
      SupportsDirectStream: isDirectStream,
      SupportsTranscoding: true,
      TranscodingUrl: `/Videos/${itemId}/master.m3u8?DeviceId=test-dev&MediaSourceId=source-${itemId}&PlaySessionId=sess-${itemId}&VideoCodec=h264&AudioCodec=aac`,
      TranscodingSubProtocol: 'hls',
      TranscodingContainer: 'ts',
      Bitrate: 12000000,
      MediaStreams: [
        {
          Codec: 'h264',
          Type: 'Video',
          Index: 0,
          IsDefault: true,
          IsForced: false,
          Width: 1920,
          Height: 1080,
          BitRate: 10000000,
        },
        {
          Codec: 'aac',
          Type: 'Audio',
          Index: 1,
          Language: 'eng',
          Title: 'English Stereo',
          DisplayTitle: 'English (AAC Stereo)',
          IsDefault: true,
          IsForced: false,
          Channels: 2,
          SampleRate: 48000,
        },
        {
          Codec: 'aac',
          Type: 'Audio',
          Index: 2,
          Language: 'jpn',
          Title: 'Japanese Stereo',
          DisplayTitle: 'Japanese (AAC Stereo)',
          IsDefault: false,
          IsForced: false,
          Channels: 2,
          SampleRate: 48000,
        },
        {
          Codec: 'subrip',
          Type: 'Subtitle',
          Index: 3,
          Language: 'eng',
          Title: 'English Subtitles',
          DisplayTitle: 'English (SRT)',
          DeliveryMethod: 'External',
          DeliveryUrl: `/Videos/${itemId}/source-${itemId}/Subtitles/3/Stream.vtt`,
          IsDefault: true,
          IsForced: false,
          IsExternal: false,
        },
        {
          Codec: 'ass',
          Type: 'Subtitle',
          Index: 4,
          Language: 'jpn',
          Title: 'Japanese Styled Subtitles',
          DisplayTitle: 'Japanese (ASS)',
          DeliveryMethod: 'External',
          DeliveryUrl: `/Videos/${itemId}/source-${itemId}/Subtitles/4/Stream.ass`,
          IsDefault: false,
          IsForced: false,
          IsExternal: false,
        },
      ],
      DefaultAudioStreamIndex: 1,
      DefaultSubtitleStreamIndex: 3,
    };

    return HttpResponse.json({
      MediaSources: [mediaSource],
      PlaySessionId: `playsession-test-${itemId}`,
    });
  }),

  // Telemetry: Start Playback
  http.post(/\/Sessions\/Playing$/, ({ request }) => {
    if (!isAuthorized(request)) {
      return new HttpResponse(null, { status: 401, statusText: 'Unauthorized' });
    }
    return new HttpResponse(null, { status: 204 });
  }),

  // Telemetry: Playback Progress
  http.post(/\/Sessions\/Playing\/Progress$/, ({ request }) => {
    if (!isAuthorized(request)) {
      return new HttpResponse(null, { status: 401, statusText: 'Unauthorized' });
    }
    return new HttpResponse(null, { status: 204 });
  }),

  // Telemetry: Playback Stopped
  http.post(/\/Sessions\/Playing\/Stopped$/, ({ request }) => {
    if (!isAuthorized(request)) {
      return new HttpResponse(null, { status: 401, statusText: 'Unauthorized' });
    }
    return new HttpResponse(null, { status: 204 });
  }),

  // Subtitle stream endpoint
  http.get(/\/Videos\/[^/]+\/[^/]+\/Subtitles\/[^/]+\/Stream\.[^/]+$/, () => {
    return new HttpResponse('WEBVTT\n\n1\n00:00:01.000 --> 00:00:04.000\nHello from CineTheme!', {
      headers: { 'Content-Type': 'text/vtt' },
    });
  }),

  // Single Item Details (Items/:itemId where itemId is not Resume, Latest, or PlaybackInfo)
  http.get(/\/Users\/[^/]+\/Items\/([^/]+)$/, ({ request }) => {
    if (!isAuthorized(request)) {
      return new HttpResponse(null, { status: 401, statusText: 'Unauthorized' });
    }

    const url = new URL(request.url);
    const parts = url.pathname.split('/');
    const itemId = parts[parts.length - 1];

    if (itemId === 'non-existent-item') {
      return new HttpResponse(null, { status: 404, statusText: 'Not Found' });
    }

    if (itemId === mockMovieItem.Id) {
      return HttpResponse.json(mockMovieItem);
    }

    const item = mockMediaList.find((m) => m.Id === itemId);
    if (item) {
      return HttpResponse.json(item);
    }

    return HttpResponse.json(mockMovieItem);
  }),

  // Media Items with Search, Pagination & Filtering (/Users/:userId/Items)
  http.get(/\/Users\/[^/]+\/Items$/, ({ request }) => {
    if (!isAuthorized(request)) {
      return new HttpResponse(null, { status: 401, statusText: 'Unauthorized' });
    }

    const url = new URL(request.url);
    const includeItemTypes = url.searchParams.get('IncludeItemTypes');
    const searchTerm = url.searchParams.get('SearchTerm');
    const genre = url.searchParams.get('Genres');
    const years = url.searchParams.get('Years');
    const filters = url.searchParams.get('Filters');
    const sortBy = url.searchParams.get('SortBy') || 'SortName';
    const sortOrder = url.searchParams.get('SortOrder') || 'Ascending';
    const startIndex = parseInt(url.searchParams.get('StartIndex') || '0', 10);
    const limit = parseInt(url.searchParams.get('Limit') || '20', 10);

    // BoxSet check
    if (includeItemTypes === 'BoxSet') {
      return HttpResponse.json({
        Items: [
          {
            Id: 'boxset-1',
            Name: 'Dark Knight Trilogy',
            Type: 'BoxSet',
            ImageTags: { Primary: 'tag-boxset-1' },
          },
        ],
        TotalRecordCount: 1,
      });
    }

    const baseList = searchTerm ? [mockMovieItem, ...mockMediaList] : [...mockMediaList];
    let filtered = baseList;

    // Filter by search term
    if (searchTerm) {
      const termLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.Name.toLowerCase().includes(termLower) ||
          item.OriginalTitle?.toLowerCase().includes(termLower)
      );
    }

    // Filter by media types
    if (includeItemTypes && includeItemTypes !== 'All') {
      const allowedTypes = includeItemTypes.split(',').map((t) => t.trim());
      filtered = filtered.filter((item) => allowedTypes.includes(item.Type));
    }

    // Filter by genre
    if (genre) {
      filtered = filtered.filter((item) => item.Genres?.includes(genre));
    }

    // Filter by year
    if (years) {
      const targetYear = parseInt(years, 10);
      filtered = filtered.filter((item) => item.ProductionYear === targetYear);
    }

    // Filter by status (IsFavorite, IsPlayed, IsUnplayed)
    if (filters) {
      if (filters.includes('IsFavorite')) {
        filtered = filtered.filter((item) => item.UserData?.IsFavorite === true);
      }
      if (filters.includes('IsPlayed')) {
        filtered = filtered.filter((item) => item.UserData?.Played === true);
      } else if (filters.includes('IsUnplayed')) {
        filtered = filtered.filter((item) => item.UserData?.Played === false);
      }
    }

    // Sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'CommunityRating') {
        comparison = (a.CommunityRating || 0) - (b.CommunityRating || 0);
      } else if (sortBy === 'ProductionYear' || sortBy === 'PremiereDate') {
        comparison = (a.ProductionYear || 0) - (b.ProductionYear || 0);
      } else {
        comparison = a.Name.localeCompare(b.Name);
      }
      return sortOrder === 'Descending' ? -comparison : comparison;
    });

    const itemsPage = filtered.slice(startIndex, startIndex + limit);

    return HttpResponse.json({
      Items: itemsPage,
      TotalRecordCount: filtered.length,
      StartIndex: startIndex,
    });
  }),

  // Genres (User scoped and generic)
  http.get(/\/Users\/[^/]+\/Genres$/, ({ request }) => {
    if (!isAuthorized(request)) {
      return new HttpResponse(null, { status: 401, statusText: 'Unauthorized' });
    }

    return HttpResponse.json({
      Items: [
        { Id: 'genre-1', Name: 'Action' },
        { Id: 'genre-2', Name: 'Sci-Fi' },
        { Id: 'genre-3', Name: 'Drama' },
      ],
      TotalRecordCount: 3,
    });
  }),

  http.get(/\/Genres$/, ({ request }) => {
    if (!isAuthorized(request)) {
      return new HttpResponse(null, { status: 401, statusText: 'Unauthorized' });
    }

    return HttpResponse.json({
      Items: [
        { Id: 'genre-1', Name: 'Action' },
        { Id: 'genre-2', Name: 'Sci-Fi' },
        { Id: 'genre-3', Name: 'Drama' },
      ],
      TotalRecordCount: 3,
    });
  }),

  // 404 test endpoint
  http.get(/\/NonExistent\/Endpoint$/, () => {
    return new HttpResponse(null, { status: 404, statusText: 'Not Found' });
  }),

  // Test endpoints for error scenarios
  http.get(/\/Test\/Malformed$/, () => {
    return new HttpResponse('Not valid JSON {', {
      headers: { 'Content-Type': 'application/json' },
    });
  }),

  http.get(/\/Test\/ServerError$/, () => {
    return new HttpResponse(null, { status: 500, statusText: 'Internal Server Error' });
  }),

  http.get(/\/Test\/Delayed$/, async () => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return HttpResponse.json({ ok: true });
  }),
];
