import { timelineReport } from './kit/readability';
import { TIMELINE } from './appPreview/timeline';

// One entry per composition in Root.tsx (same id). export-timeline.mjs writes review/<id>.timeline.json from it,
// which check.sh --timeline reads (reading_time) and mix.json's "timeline" reads (VO starts, room-sound segments).
// Keep it in sync when you add compositions.
export const REVIEW = [timelineReport('AppPreviewPortrait', TIMELINE, true)];
