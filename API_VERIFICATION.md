# Jellyfin REST API Verification & Specification Reference

This document records the verified Jellyfin REST API endpoints, request/response shapes, headers, authentication mechanics, and version-specific behaviors based on official Jellyfin OpenAPI documentation and source code (Jellyfin Server 10.8.x, 10.9.x, and 10.10+).

---

## 1. Authorization Header Protocol

### 1.1 Header Structure
All requests to Jellyfin (except unauthenticated public endpoints like `/System/Info/Public`) require the `MediaBrowser` authorization scheme. Jellyfin accepts this either in `X-Emby-Authorization` or the standard `Authorization` header:

```http
X-Emby-Authorization: MediaBrowser Client="CineTheme", Device="Web", DeviceId="{uniqueDeviceId}", Version="0.1.0", Token="{accessToken}"
```

### 1.2 Header Parameters
| Parameter | Type | Required | Description |
|---|---|---|---|
| `Client` | `string` | Yes | Application identifier (`"CineTheme"`). |
| `Device` | `string` | Yes | Platform / Device type (`"Web"`, `"Windows"`, `"Android"`). |
| `DeviceId` | `string` | Yes | Unique persistent client installation UUID. |
| `Version` | `string` | Yes | Client semantic version (e.g. `"0.1.0"`). |
| `Token` | `string` | For authenticated routes | Session access token returned by authentication endpoint. |

*(Note: For static media streams `<video src>` and images `<img src>` where browser fetch headers cannot be set, authentication is passed via query parameter `?api_key={accessToken}`).*

---

## 2. Verified Authentication Endpoints

### 2.1 Authenticate by Name & Password
- **Endpoint:** `POST /Users/AuthenticateByName`
- **Authentication:** Unauthenticated (Authorization header sent without `Token`)
- **Headers:** 
  - `Content-Type: application/json`
  - `X-Emby-Authorization: MediaBrowser Client="CineTheme", Device="Web", DeviceId="{deviceId}", Version="0.1.0"`
- **Request Body:**
  ```json
  {
    "Username": "string",
    "Pw": "string"
  }
  ```
- **Response Shape (HTTP 200 OK):**
  ```json
  {
    "User": {
      "Name": "Admin",
      "Id": "a1b2c3d4e5f678901234567890abcdef",
      "HasPassword": true,
      "HasConfiguredPassword": true,
      "EnableAutoLogin": false,
      "LastLoginDate": "2026-08-29T12:00:00.0000000Z",
      "LastActivityDate": "2026-08-29T12:00:00.0000000Z",
      "Configuration": {
        "PlayDefaultAudioTrack": true,
        "SubtitleLanguagePreference": "eng",
        "DisplayMissingEpisodes": false
      },
      "Policy": {
        "IsAdministrator": true,
        "IsDisabled": false,
        "EnableMediaPlayback": true,
        "EnableAudioPlaybackTranscoding": true,
        "EnableVideoPlaybackTranscoding": true
      },
      "PrimaryImageTag": "d41d8cd98f00b204e9800998ecf8427e"
    },
    "SessionInfo": {
      "Id": "session-guid-1234",
      "UserId": "a1b2c3d4e5f678901234567890abcdef",
      "UserName": "Admin",
      "Client": "CineTheme",
      "LastActivityDate": "2026-08-29T12:00:00.0000000Z",
      "DeviceName": "Desktop Web",
      "DeviceId": "ct-web-9f8a3c2e1b",
      "ApplicationVersion": "0.1.0",
      "IsActive": true
    },
    "AccessToken": "e4d3c2b1a09876543210fedcba098765",
    "ServerId": "9876543210abcdef0123456789abcdef"
  }
  ```
- **Error Responses:**
  - `HTTP 401 Unauthorized`: Invalid username or password, or disabled user policy.
  - `HTTP 400 Bad Request`: Missing username or invalid payload.

### 2.2 Logout & Session Invalidation
- **Endpoint:** `POST /Sessions/Logout`
- **Authentication:** Authenticated (Requires `Token`)
- **Headers:** `X-Emby-Authorization: MediaBrowser ..., Token="{accessToken}"`
- **Request Body:** None / `{}`
- **Response Shape:** `HTTP 204 No Content` or `HTTP 200 OK`
- **Behavior:** Explicitly closes the active session on the Jellyfin server.

---

## 3. Verified Media Library, Search & Content Endpoints

### 3.1 User Views / Libraries
- **Endpoint:** `GET /Users/{userId}/Views`
- **Authentication:** Authenticated (`Token` required)
- **Response Shape (HTTP 200 OK):** QueryResult containing `CollectionFolder` / `UserView` items.

### 3.2 Media Items with Server-Side Pagination & Filtering
- **Endpoint:** `GET /Users/{userId}/Items`
- **Authentication:** Authenticated (`Token` required)

### 3.3 Advanced Search & Filtering
- **Endpoint:** `GET /Users/{userId}/Items`
- **Authentication:** Authenticated (`Token` required)

### 3.4 Resume / Continue Watching
- **Endpoint:** `GET /Users/{userId}/Items/Resume`
- **Authentication:** Authenticated (`Token` required)

### 3.5 Recently Added Media
- **Endpoint:** `GET /Users/{userId}/Items/Latest`
- **Authentication:** Authenticated (`Token` required)

### 3.6 Single Item Metadata
- **Endpoint:** `GET /Users/{userId}/Items/{itemId}`
- **Authentication:** Authenticated (`Token` required)

### 3.7 Genres & Collections
- **Endpoints:** `GET /Users/{userId}/Genres` & `GET /Users/{userId}/Items?IncludeItemTypes=BoxSet&Recursive=true`

---

## 4. Verified Playback & Streaming Endpoints

### 4.1 PlaybackInfo Negotiation
- **Endpoint:** `POST /Items/{itemId}/PlaybackInfo?userId={userId}`
- **Authentication:** Authenticated (`Token` required)
- **Request Body:** `PlaybackInfoDto` with `DeviceProfile`, `MaxStreamingBitrate`, `StartTimeTicks`, `AudioStreamIndex`, `SubtitleStreamIndex`.
- **Response Shape:** `PlaybackInfoResponse` with `PlaySessionId` and `MediaSources` containing `SupportsDirectPlay`, `SupportsDirectStream`, `SupportsTranscoding`, `TranscodingUrl`, `MediaStreams`.

### 4.2 Progressive Direct Play Stream
- **Endpoint:** `GET /Videos/{itemId}/stream.{container}`
- **Query Parameters:** `static=true`, `mediaSourceId={id}`, `playSessionId={sessionId}`, `api_key={accessToken}`
- **Headers:** `Range: bytes=0-`
- **Response:** `206 Partial Content` or `200 OK` with progressive binary audio/video stream.

### 4.3 HLS Master Playlist & Transcode Stream
- **Endpoint:** `GET /Videos/{itemId}/master.m3u8`
- **Query Parameters:** Supplied via `MediaSourceInfo.TranscodingUrl` (`DeviceId`, `PlaySessionId`, `MediaSourceId`, `VideoCodec`, `AudioCodec`, `AudioStreamIndex`, `SubtitleStreamIndex`, `api_key`).
- **Response:** `application/x-mpegURL` (HLS master manifest).

### 4.4 Telemetry: Playback Start
- **Endpoint:** `POST /Sessions/Playing`
- **Request Body:** `{ ItemId, MediaSourceId, AudioStreamIndex, SubtitleStreamIndex, PlaySessionId, PlayMethod, PositionTicks, CanSeek, IsMuted, VolumeLevel }`

### 4.5 Telemetry: Playback Progress
- **Endpoint:** `POST /Sessions/Playing/Progress`
- **Frequency:** Strict 10-second interval + 500ms trailing seek debounce + immediate pause trigger.
- **Request Body:** `{ ItemId, MediaSourceId, AudioStreamIndex, SubtitleStreamIndex, PlaySessionId, PlayMethod, PositionTicks, IsPaused, IsMuted, VolumeLevel, EventName }`

### 4.6 Telemetry: Playback Stopped
- **Endpoint:** `POST /Sessions/Playing/Stopped`
- **Request Body:** `{ ItemId, MediaSourceId, PlaySessionId, PositionTicks }`

### 4.7 Subtitle Stream Extraction
- **Endpoint:** `GET /Videos/{itemId}/{mediaSourceId}/Subtitles/{index}/Stream.{format}`
- **Formats:** `.vtt`, `.srt`, `.ass`, `.ssa`

### 4.8 Font Attachment Extraction
- **Endpoint:** `GET /Videos/{itemId}/{mediaSourceId}/Attachments/{attachmentIndex}`

---

## 5. Chapter, Anime Intelligence, Trickplay & Plugin APIs

### 5.1 Native Chapters
- **Endpoint:** Extracted from `GET /Users/{userId}/Items/{itemId}` -> `item.Chapters`
- **Structure:**
  ```json
  [
    {
      "StartPositionTicks": 0,
      "Name": "Prologue",
      "ImageTag": "abc123tag"
    },
    {
      "StartPositionTicks": 900000000,
      "Name": "Opening / Intro",
      "ImageTag": "def456tag"
    },
    {
      "StartPositionTicks": 1800000000,
      "Name": "Episode Content"
    },
    {
      "StartPositionTicks": 13200000000,
      "Name": "Ending / Outro"
    }
  ]
  ```

### 5.2 Episode Relationships for Anime & TV Series
- **Endpoint:** `GET /Shows/{seriesId}/Episodes?seasonId={seasonId}&userId={userId}&Fields=ItemCounts,PrimaryImageAspectRatio`
- **Response:** `QueryResultDto<BaseItemDto>` containing full season episode hierarchy sorted by `IndexNumber`.

### 5.3 Trickplay Manifest & Sprite Tiles (Jellyfin 10.9+)
- **Manifest Endpoint:** `GET /Items/{itemId}/Trickplay/{width}/GetManifest` (or `/GetManifest.json`)
- **Response Shape:**
  ```json
  {
    "Version": 1,
    "Width": 320,
    "Height": 180,
    "TileWidth": 10,
    "TileHeight": 10,
    "ThumbnailCount": 600,
    "Interval": 10000,
    "Bandwidth": 128000
  }
  ```
- **Tile Endpoint:** `GET /Items/{itemId}/Trickplay/{width}/{tileIndex}.jpg?api_key={token}`

### 5.4 Optional IntroSkipper Plugin Probing
- **Primary Endpoint:** `GET /Episode/{episodeId}/IntroTimestamps`
- **Fallback Endpoint:** `GET /Plugin/IntroSkipper/Timestamps/{itemId}`
- **Response Shape:**
  ```json
  {
    "IntroStart": 90.5,
    "IntroEnd": 180.0,
    "CreditsStart": 1320.0,
    "CreditsEnd": 1410.0,
    "Valid": true
  }
  ```
- **Resilience Contract:** If the plugin returns 404/500/timeout, CineTheme seamlessly relies on native chapter metadata without triggering alerts or failing playback.

---

## 6. Image API Specification

### 6.1 Image URL Construction
- **Endpoint:** `GET /Items/{itemId}/Images/{imageType}`
- **Path Parameters:** `itemId`, `imageType` (`Primary`, `Backdrop`, `Logo`, `Thumb`, `Banner`, `Art`)
- **Query Parameters:** `tag`, `quality`, `maxWidth`, `maxHeight`, `format=webp`

---

## 7. Security & Session Rules

1. **Session Credential:** Jellyfin `AccessToken` is an opaque session credential.
2. **Password Security:**
   - Password is **not persisted** to disk or client storage (`localStorage`, `sessionStorage`, `IndexedDB`, or cookies).
   - Password is **not stored** in global application state after authentication completes.
   - Password and `AccessToken` are **never written to logs** or console output.
3. **HTTP 401 Session Expiration:** On HTTP 401 response from any protected endpoint, the session is invalidated, caches are cleared, and the client transitions to `/login`. No retry loops.
4. **Untrusted User Search Input:** Search queries are treated as untrusted strings, never injected raw into HTML templates or unescaped URLs.
5. **Media Stream Tokens:** Appended via `?api_key={token}` and scrubbed from client console logs.

---

## 8. Official References
- Jellyfin Official API Documentation: `https://api.jellyfin.org/`
- Jellyfin Server Source Code: `https://github.com/jellyfin/jellyfin`
- Jellyfin OpenAPI 10.8 / 10.9 / 10.10 Specifications
