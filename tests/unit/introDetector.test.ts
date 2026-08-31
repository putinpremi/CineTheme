import { describe, it, expect } from 'vitest';
import { introDetector } from '../../src/player/anime/introDetector';
import type { Chapter } from '../../src/domain/anime/types';

describe('IntroDetector Segment Processing & Active Segment Query', () => {
  const mockChapters: Chapter[] = [
    { index: 0, name: 'Prologue', startTimeSeconds: 0, endTimeSeconds: 60, type: 'Other' },
    { index: 1, name: 'OP - Gurenge', startTimeSeconds: 60, endTimeSeconds: 150, type: 'Intro' },
    { index: 2, name: 'Main Episode', startTimeSeconds: 150, endTimeSeconds: 1300, type: 'Other' },
    { index: 3, name: 'ED - From the Edge', startTimeSeconds: 1300, endTimeSeconds: 1390, type: 'Outro' },
    { index: 4, name: 'Next Time Preview', startTimeSeconds: 1390, endTimeSeconds: 1420, type: 'Preview' },
  ];

  it('detects segments from native Jellyfin chapter metadata when no plugin is present', () => {
    const segments = introDetector.detectSegments(mockChapters, null);

    expect(segments).toHaveLength(3); // Intro, Outro, Preview
    expect(segments[0]).toEqual({
      type: 'INTRO',
      title: 'OP - Gurenge',
      startTimeSeconds: 60,
      endTimeSeconds: 150,
      source: 'ChapterMetadata',
      confidence: 0.9,
    });
    expect(segments[1]).toEqual({
      type: 'OUTRO',
      title: 'ED - From the Edge',
      startTimeSeconds: 1300,
      endTimeSeconds: 1390,
      source: 'ChapterMetadata',
      confidence: 0.9,
    });
    expect(segments[2]).toEqual({
      type: 'PREVIEW',
      title: 'Next Time Preview',
      startTimeSeconds: 1390,
      endTimeSeconds: 1420,
      source: 'ChapterMetadata',
      confidence: 0.85,
    });
  });

  it('prioritizes IntroSkipper plugin timestamps over chapter metadata', () => {
    const pluginTimestamps = {
      IntroStart: 62.5,
      IntroEnd: 152.0,
      CreditsStart: 1302.0,
      CreditsEnd: 1392.0,
      Valid: true,
    };

    const segments = introDetector.detectSegments(mockChapters, pluginTimestamps);

    expect(segments[0]).toEqual({
      type: 'INTRO',
      title: 'Intro',
      startTimeSeconds: 62.5,
      endTimeSeconds: 152.0,
      source: 'IntroSkipperPlugin',
      confidence: 1.0,
    });

    expect(segments[1]).toEqual({
      type: 'OUTRO',
      title: 'Credits',
      startTimeSeconds: 1302.0,
      endTimeSeconds: 1392.0,
      source: 'IntroSkipperPlugin',
      confidence: 1.0,
    });
  });

  it('accurately identifies the active segment at a given playback timestamp', () => {
    const segments = introDetector.detectSegments(mockChapters, null);

    // During Prologue (0 - 60s) -> null
    expect(introDetector.getActiveSegment(30, segments)).toBeNull();

    // During Intro (60 - 150s) -> INTRO segment
    const activeIntro = introDetector.getActiveSegment(95, segments);
    expect(activeIntro).not.toBeNull();
    expect(activeIntro?.type).toBe('INTRO');

    // Exactly at Intro end boundary (150s) -> null
    expect(introDetector.getActiveSegment(150, segments)).toBeNull();

    // During Outro (1300 - 1390s) -> OUTRO segment
    const activeOutro = introDetector.getActiveSegment(1350, segments);
    expect(activeOutro).not.toBeNull();
    expect(activeOutro?.type).toBe('OUTRO');
  });
});
