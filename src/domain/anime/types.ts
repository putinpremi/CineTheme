export type ChapterType = 'Intro' | 'Outro' | 'Recap' | 'Preview' | 'Other';

export interface Chapter {
  index: number;
  name: string;
  startTimeSeconds: number;
  endTimeSeconds: number;
  imageTag?: string;
  type: ChapterType;
}

export type AnimeSegmentType = 'INTRO' | 'OUTRO' | 'RECAP' | 'PREVIEW' | 'OTHER';

export interface AnimeSegment {
  type: AnimeSegmentType;
  title: string;
  startTimeSeconds: number;
  endTimeSeconds: number;
  source: 'IntroSkipperPlugin' | 'ChapterMetadata';
  confidence: number;
}

export interface TrickplayManifest {
  width: number;
  height: number;
  tileWidth: number;
  tileHeight: number;
  thumbnailCount: number;
  intervalMs: number;
  bandwidth?: number;
}

export interface TrickplayTile {
  tileIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  imageUrl: string;
}

export interface PlaybackPreferences {
  autoPlayNextEpisode: boolean;
  autoSkipIntro: boolean;
  autoSkipOutro: boolean;
  preferredAudioLanguage?: string;
  preferredSubtitleLanguage?: string;
  subtitleMode: 'Default' | 'Always' | 'OnlyForced' | 'None';
}

export interface EpisodeNavigationInfo {
  currentEpisodeId: string;
  seriesId?: string;
  seriesName?: string;
  seasonId?: string;
  seasonNumber?: number;
  episodeNumber?: number;
  episodeTitle?: string;
  nextEpisodeId?: string;
  nextEpisodeTitle?: string;
  nextEpisodeNumber?: number;
  previousEpisodeId?: string;
  previousEpisodeTitle?: string;
  previousEpisodeNumber?: number;
}
