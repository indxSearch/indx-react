/** Ask phrases: the words a question is built with, in four groups matched in order from the
 *  start. A dataset's own list, served as `effective.askPhrases` by the Search or ask settings;
 *  the server (SearchOrAskPhrases) is the authority and applies the same rule to the judge's search. */
export interface AskPhrases {
  leadIns: string[];
  frames: string[];
  links: string[];
  articles: string[];
}

const words = (s: string) => s.toLowerCase().replace(/’/g, "'").split(/\s+/).filter(Boolean);
const endPunctuation = /[?!.,]+$/;

/** The longest phrase of the list that the words start with at `at`, as a word count. */
function take(ws: string[], at: number, list: string[]): number {
  let best = 0;
  for (const phrase of list) {
    const p = words(phrase);
    if (p.length > best && at + p.length <= ws.length && p.every((w, i) => ws[at + i].replace(endPunctuation, '') === w)) best = p.length;
  }
  return best;
}

/**
 * What to search for what is typed, and the phrases taken off it: "help me find the movie about
 * the green ogre" searches "green ogre". A lead-in, then what is asked for, then the link, then an
 * article; nothing is taken unless the start has a question's shape (a lead-in of two words or
 * more, a one-word lead-in with what is asked for, or what is asked for with its link) and a word
 * of substance is left, so a title ("help", "what we do in the shadows"), a genre ("film noir") and
 * an unfinished "help me find" search as typed. The same rule as the server's.
 */
export function stripAskPhrases(typed: string, phrases: AskPhrases): { text: string; taken: string[] } {
  const original = typed.trim().split(/\s+/).filter(Boolean);
  const ws = words(typed);
  let at = 0;
  const taken: string[] = [];
  const step = (list: string[]) => {
    const n = take(ws, at, list);
    if (n) { taken.push(original.slice(at, at + n).join(' ')); at += n; }
    return n > 0;
  };
  const leadWords = take(ws, 0, phrases.leadIns);
  const lead = step(phrases.leadIns);
  const frame = step(phrases.frames);
  const link = step(phrases.links);
  const shaped = (lead && (leadWords > 1 || frame)) || (frame && link);
  if (!shaped) return { text: typed, taken: [] };
  step(phrases.articles);
  const rest = original.slice(at).join(' ').replace(/[?!.]+$/, '').trim();
  if (!/\p{L}{3,}/u.test(rest)) return { text: typed, taken: [] };
  return { text: rest, taken };
}
