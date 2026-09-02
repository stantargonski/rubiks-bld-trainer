import { parseSuggestionList } from './suggester';
import raw from './suggestions.txt?raw';

/**
 * An image or two for every letter pair, shipped with the app.
 *
 * The list used to be something you pasted in yourself, which made a full
 * library a prerequisite for using the tool rather than a thing the tool helped
 * you build. It covers all 552 pairs a standard buffer choice can produce, so
 * there is no code you can land on with nothing to suggest.
 *
 * Parsed from the text file rather than checked in as JSON so the source stays
 * something you can read and edit as a list — it costs about a millisecond once,
 * at module load, and reuses the parser the paste box already used.
 */
export const BUILT_IN_SUGGESTIONS: Record<string, string[]> = parseSuggestionList(raw);
