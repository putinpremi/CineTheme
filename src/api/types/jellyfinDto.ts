/**
 * Raw Jellyfin REST API DTOs (Data Transfer Objects)
 * Matching official Jellyfin OpenAPI 10.8 / 10.9 / 10.10 schemas.
 */

export interface PublicSystemInfoDto {
  ServerName?: string;
  Version?: string;
  ProductName?: string;
  OperatingSystem?: string;
  Id?: string;
  StartupWizardCompleted?: boolean;
  LocalAddress?: string;
}

export interface UserPolicyDto {
  IsAdministrator?: boolean;
  IsDisabled?: boolean;
  EnableMediaPlayback?: boolean;
  EnableAudioPlaybackTranscoding?: boolean;
  EnableVideoPlaybackTranscoding?: boolean;
  EnablePlaybackRemuxing?: boolean;
}

export interface UserConfigurationDto {
  PlayDefaultAudioTrack?: boolean;
  SubtitleLanguagePreference?: string;
  DisplayMissingEpisodes?: boolean;
}

export interface UserDto {
  Name?: string;
  Id: string;
  HasPassword?: boolean;
  HasConfiguredPassword?: boolean;
  LastLoginDate?: string;
  LastActivityDate?: string;
  Policy?: UserPolicyDto;
  Configuration?: UserConfigurationDto;
  PrimaryImageTag?: string;
}

export interface SessionInfoDto {
  Id?: string;
  UserId?: string;
  UserName?: string;
  Client?: string;
  LastActivityDate?: string;
  DeviceName?: string;
  DeviceId?: string;
  ApplicationVersion?: string;
  IsActive?: boolean;
}

export interface AuthenticateUserByNameDto {
  Username: string;
  Pw: string;
}

export interface AuthenticationResultDto {
  User: UserDto;
  SessionInfo?: SessionInfoDto;
  AccessToken: string;
  ServerId: string;
}

export interface UserItemDataDto {
  PlaybackPositionTicks?: number;
  PlayCount?: number;
  IsFavorite?: boolean;
  Played?: boolean;
  LastPlayedDate?: string;
  Key?: string;
  Rating?: number;
}

export interface BaseItemPersonDto {
  Name?: string;
  Id?: string;
  Role?: string;
  Type?: string;
  PrimaryImageTag?: string;
}

export interface NameIdPairDto {
  Name?: string;
  Id?: string;
}

export interface MediaAttachmentDto {
  Codec?: string;
  CodecTag?: string;
  Comment?: string;
  Index?: number;
  FileName?: string;
  MimeType?: string;
  DeliveryUrl?: string;
  Name?: string;
}

export interface MediaStreamDto {
  Codec?: string;
  Language?: string;
  DisplayTitle?: string;
  Title?: string;
  IsDefault?: boolean;
  IsForced?: boolean;
  Type?: 'Audio' | 'Video' | 'Subtitle' | 'EmbeddedImage';
  Index?: number;
  Height?: number;
  Width?: number;
  BitRate?: number;
  Channels?: number;
  SampleRate?: number;
  AspectRatio?: string;
  DeliveryMethod?: 'External' | 'Embed' | 'Encode';
  DeliveryUrl?: string;
  IsExternal?: boolean;
  SupportsExternalStream?: boolean;
}

export interface ChapterInfoDto {
  StartPositionTicks: number;
  Name?: string;
  ImageTag?: string;
  ImagePath?: string;
  MarkerType?: string;
  ChapterIndex?: number;
}

export interface TrickplayManifestDto {
  Version?: number;
  Width: number;
  Height: number;
  TileWidth: number;
  TileHeight: number;
  ThumbnailCount: number;
  Interval: number;
  Bandwidth?: number;
}

export interface IntroSkipperTimestampsDto {
  IntroStart?: number;
  IntroEnd?: number;
  CreditsStart?: number;
  CreditsEnd?: number;
  EpisodeId?: string;
  Valid?: boolean;
}

export interface MediaSourceInfoDto {
  Id: string;
  Path?: string;
  Protocol?: string;
  Container?: string;
  Size?: number;
  Name?: string;
  IsRemote?: boolean;
  RunTimeTicks?: number;
  SupportsDirectPlay?: boolean;
  SupportsDirectStream?: boolean;
  SupportsTranscoding?: boolean;
  TranscodingUrl?: string;
  TranscodingSubProtocol?: string;
  TranscodingContainer?: string;
  Bitrate?: number;
  MediaStreams?: MediaStreamDto[];
  MediaAttachments?: MediaAttachmentDto[];
  DefaultAudioStreamIndex?: number;
  DefaultSubtitleStreamIndex?: number;
}

export interface PlaybackInfoDto {
  UserId?: string;
  MaxStreamingBitrate?: number;
  StartTimeTicks?: number;
  AudioStreamIndex?: number;
  SubtitleStreamIndex?: number;
  MediaSourceId?: string;
  DeviceProfile?: unknown;
  EnableDirectPlay?: boolean;
  EnableDirectStream?: boolean;
  EnableTranscoding?: boolean;
  AllowVideoStreamCopy?: boolean;
  AllowAudioStreamCopy?: boolean;
  AutoOpenLiveStream?: boolean;
}

export interface PlaybackInfoResponseDto {
  MediaSources: MediaSourceInfoDto[];
  PlaySessionId?: string;
  ErrorCode?: string;
}

export interface PlaybackStartDto {
  ItemId: string;
  MediaSourceId?: string;
  AudioStreamIndex?: number;
  SubtitleStreamIndex?: number;
  PlaySessionId?: string;
  PlayMethod?: 'DirectPlay' | 'DirectStream' | 'Transcode';
  PositionTicks?: number;
  CanSeek?: boolean;
  IsMuted?: boolean;
  VolumeLevel?: number;
}

export interface PlaybackProgressDto {
  ItemId: string;
  MediaSourceId?: string;
  AudioStreamIndex?: number;
  SubtitleStreamIndex?: number;
  PlaySessionId?: string;
  PlayMethod?: 'DirectPlay' | 'DirectStream' | 'Transcode';
  PositionTicks?: number;
  IsPaused?: boolean;
  IsMuted?: boolean;
  VolumeLevel?: number;
  EventName?: 'TimeUpdate' | 'Seek' | 'Pause';
}

export interface PlaybackStopDto {
  ItemId: string;
  MediaSourceId?: string;
  PlaySessionId?: string;
  PositionTicks?: number;
}

export interface BaseItemDto {
  Id: string;
  Name?: string;
  OriginalTitle?: string;
  ServerId?: string;
  Type?: string;
  CollectionType?: string;
  Overview?: string;
  Taglines?: string[];
  Genres?: string[];
  CommunityRating?: number;
  OfficialRating?: string;
  ProductionYear?: number;
  PremiereDate?: string;
  EndDate?: string;
  RunTimeTicks?: number;
  PrimaryImageAspectRatio?: number;
  ImageTags?: Record<string, string>;
  BackdropImageTags?: string[];
  ParentId?: string;
  ParentLogoItemId?: string;
  ParentBackdropItemId?: string;
  SeriesName?: string;
  SeriesId?: string;
  SeasonName?: string;
  SeasonId?: string;
  IndexNumber?: number;
  ParentIndexNumber?: number;
  UserData?: UserItemDataDto;
  People?: BaseItemPersonDto[];
  Studios?: NameIdPairDto[];
  MediaStreams?: MediaStreamDto[];
  Chapters?: ChapterInfoDto[];
  ChildCount?: number;
}

export interface QueryResultDto<T> {
  Items: T[];
  TotalRecordCount: number;
  StartIndex?: number;
}
