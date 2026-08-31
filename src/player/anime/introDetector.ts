import type { Chapter, AnimeSegment } from '../../domain/anime/types';
import type { IntroSkipperTimestampsDto } from '../../api/types/jellyfinDto';

export class IntroDetector {
  /**
   * Deterministically detects Intro, Outro, Recap, and Preview segments
   * applying priority: 1. Verified IntroSkipper plugin, 2. Jellyfin Chapter metadata.
   */
  public detectSegments(
    chapters: Chapter[] = [],
    pluginTimestamps?: IntroSkipperTimestampsDto | null
  ): AnimeSegment[] {
    const segments: AnimeSegment[] = [];

    // Priority 1: Verified IntroSkipper Plugin Timestamps
    if (pluginTimestamps && pluginTimestamps.Valid !== false) {
      if (
        typeof pluginTimestamps.IntroStart === 'number' &&
        typeof pluginTimestamps.IntroEnd === 'number' &&
        pluginTimestamps.IntroEnd > pluginTimestamps.IntroStart
      ) {
        segments.push({
          type: 'INTRO',
          title: 'Intro',
          startTimeSeconds: pluginTimestamps.IntroStart,
          endTimeSeconds: pluginTimestamps.IntroEnd,
          source: 'IntroSkipperPlugin',
          confidence: 1.0,
        });
      }

      if (
        typeof pluginTimestamps.CreditsStart === 'number' &&
        typeof pluginTimestamps.CreditsEnd === 'number' &&
        pluginTimestamps.CreditsEnd > pluginTimestamps.CreditsStart
      ) {
        segments.push({
          type: 'OUTRO',
          title: 'Credits',
          startTimeSeconds: pluginTimestamps.CreditsStart,
          endTimeSeconds: pluginTimestamps.CreditsEnd,
          source: 'IntroSkipperPlugin',
          confidence: 1.0,
        });
      }
    }

    // Priority 2: Native Jellyfin Chapter Metadata (fill missing segments)
    const hasPluginIntro = segments.some((s) => s.type === 'INTRO');
    const hasPluginOutro = segments.some((s) => s.type === 'OUTRO');

    for (const chapter of chapters) {
      if (chapter.type === 'Intro' && !hasPluginIntro) {
        segments.push({
          type: 'INTRO',
          title: chapter.name,
          startTimeSeconds: chapter.startTimeSeconds,
          endTimeSeconds: chapter.endTimeSeconds,
          source: 'ChapterMetadata',
          confidence: 0.9,
        });
      } else if (chapter.type === 'Outro' && !hasPluginOutro) {
        segments.push({
          type: 'OUTRO',
          title: chapter.name,
          startTimeSeconds: chapter.startTimeSeconds,
          endTimeSeconds: chapter.endTimeSeconds,
          source: 'ChapterMetadata',
          confidence: 0.9,
        });
      } else if (chapter.type === 'Recap') {
        segments.push({
          type: 'RECAP',
          title: chapter.name,
          startTimeSeconds: chapter.startTimeSeconds,
          endTimeSeconds: chapter.endTimeSeconds,
          source: 'ChapterMetadata',
          confidence: 0.85,
        });
      } else if (chapter.type === 'Preview') {
        segments.push({
          type: 'PREVIEW',
          title: chapter.name,
          startTimeSeconds: chapter.startTimeSeconds,
          endTimeSeconds: chapter.endTimeSeconds,
          source: 'ChapterMetadata',
          confidence: 0.85,
        });
      }
    }

    return segments.sort((a, b) => a.startTimeSeconds - b.startTimeSeconds);
  }

  /**
   * Returns the segment active at the current playback timestamp, if any.
   */
  public getActiveSegment(
    currentTimeSeconds: number,
    segments: AnimeSegment[] = []
  ): AnimeSegment | null {
    if (!segments || segments.length === 0) return null;

    return (
      segments.find(
        (seg) =>
          currentTimeSeconds >= seg.startTimeSeconds &&
          currentTimeSeconds < seg.endTimeSeconds
      ) || null
    );
  }
}

export const introDetector = new IntroDetector();
