import { describe, it, expect } from 'vitest';
import { parseChapters, classifyChapterName } from '../../src/player/anime/chapterParser';
import type { ChapterInfoDto } from '../../src/api/types/jellyfinDto';

describe('Chapter Parser & Classification', () => {
  it('classifies standard anime chapter names accurately', () => {
    expect(classifyChapterName('Opening')).toBe('Intro');
    expect(classifyChapterName('Opening Theme')).toBe('Intro');
    expect(classifyChapterName('OP')).toBe('Intro');
    expect(classifyChapterName('OP 1')).toBe('Intro');
    expect(classifyChapterName('Intro')).toBe('Intro');
    expect(classifyChapterName('Introduction')).toBe('Intro');

    expect(classifyChapterName('Ending')).toBe('Outro');
    expect(classifyChapterName('Ending Theme')).toBe('Outro');
    expect(classifyChapterName('ED')).toBe('Outro');
    expect(classifyChapterName('ED 2')).toBe('Outro');
    expect(classifyChapterName('Outro')).toBe('Outro');
    expect(classifyChapterName('Credits')).toBe('Outro');

    expect(classifyChapterName('Recap')).toBe('Recap');
    expect(classifyChapterName('Summary')).toBe('Recap');
    expect(classifyChapterName('Previously On')).toBe('Recap');

    expect(classifyChapterName('Preview')).toBe('Preview');
    expect(classifyChapterName('Next Episode Preview')).toBe('Preview');
    expect(classifyChapterName('Next Time')).toBe('Preview');

    expect(classifyChapterName('Scene 1')).toBe('Other');
    expect(classifyChapterName('Main Feature Part A')).toBe('Other');
    expect(classifyChapterName(undefined)).toBe('Other');
  });

  it('parses Jellyfin ChapterInfoDto list into typed Chapter models with duration bounds', () => {
    const rawChapters: ChapterInfoDto[] = [
      { StartPositionTicks: 0, Name: 'Prologue' },
      { StartPositionTicks: 900_000_000, Name: 'Opening (OP 1)' }, // 90s
      { StartPositionTicks: 1_800_000_000, Name: 'Part A' }, // 180s
      { StartPositionTicks: 13_200_000_000, Name: 'Ending (ED)' }, // 1320s
      { StartPositionTicks: 14_100_000_000, Name: 'Preview' }, // 1410s
    ];

    const parsed = parseChapters(rawChapters, 1440); // 1440s total runtime

    expect(parsed).toHaveLength(5);

    expect(parsed[0]).toEqual({
      index: 0,
      name: 'Prologue',
      startTimeSeconds: 0,
      endTimeSeconds: 90,
      imageTag: undefined,
      type: 'Other',
    });

    expect(parsed[1]).toEqual({
      index: 1,
      name: 'Opening (OP 1)',
      startTimeSeconds: 90,
      endTimeSeconds: 180,
      imageTag: undefined,
      type: 'Intro',
    });

    expect(parsed[2]).toEqual({
      index: 2,
      name: 'Part A',
      startTimeSeconds: 180,
      endTimeSeconds: 1320,
      imageTag: undefined,
      type: 'Other',
    });

    expect(parsed[3]).toEqual({
      index: 3,
      name: 'Ending (ED)',
      startTimeSeconds: 1320,
      endTimeSeconds: 1410,
      imageTag: undefined,
      type: 'Outro',
    });

    expect(parsed[4]).toEqual({
      index: 4,
      name: 'Preview',
      startTimeSeconds: 1410,
      endTimeSeconds: 1440,
      imageTag: undefined,
      type: 'Preview',
    });
  });

  it('handles empty and undefined chapters gracefully', () => {
    expect(parseChapters([])).toEqual([]);
    expect(parseChapters(undefined)).toEqual([]);
  });
});
