import type { ChapterInfoDto } from '../../api/types/jellyfinDto';
import type { Chapter, ChapterType } from '../../domain/anime/types';
import { ticksToSeconds } from '../../utils/timeUtils';

const INTRO_REGEX = /^(opening(\s+theme)?|op(\s*\d+)?|intro(duction)?)\b/i;
const OUTRO_REGEX = /^(ending(\s+theme)?|ed(\s*\d+)?|outro|credits)\b/i;
const RECAP_REGEX = /^(recap|summary|previously(\s+on)?)\b/i;
const PREVIEW_REGEX = /^(preview|next\s+episode(\s+preview)?|next\s+time)\b/i;

export function classifyChapterName(name?: string): ChapterType {
  if (!name) return 'Other';
  const clean = name.trim();

  if (INTRO_REGEX.test(clean)) return 'Intro';
  if (OUTRO_REGEX.test(clean)) return 'Outro';
  if (RECAP_REGEX.test(clean)) return 'Recap';
  if (PREVIEW_REGEX.test(clean)) return 'Preview';

  return 'Other';
}

export function parseChapters(
  chaptersDto: ChapterInfoDto[] = [],
  totalDurationSeconds = 0
): Chapter[] {
  if (!chaptersDto || chaptersDto.length === 0) return [];

  // Sort strictly by StartPositionTicks
  const sorted = [...chaptersDto].sort((a, b) => a.StartPositionTicks - b.StartPositionTicks);

  return sorted.map((ch, idx) => {
    const startTimeSeconds = ticksToSeconds(ch.StartPositionTicks);
    const nextChapter = sorted[idx + 1];
    
    let endTimeSeconds: number;
    if (nextChapter) {
      endTimeSeconds = ticksToSeconds(nextChapter.StartPositionTicks);
    } else if (totalDurationSeconds > startTimeSeconds) {
      endTimeSeconds = totalDurationSeconds;
    } else {
      endTimeSeconds = startTimeSeconds + 90; // Default segment bound
    }

    const name = ch.Name?.trim() || `Chapter ${idx + 1}`;
    const type = ch.MarkerType === 'Intro' ? 'Intro' : ch.MarkerType === 'Outro' ? 'Outro' : classifyChapterName(name);

    return {
      index: ch.ChapterIndex ?? idx,
      name,
      startTimeSeconds,
      endTimeSeconds,
      imageTag: ch.ImageTag,
      type,
    };
  });
}
