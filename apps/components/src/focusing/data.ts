// Focusing (IndxServer, Notes/focusing.md on fastmaster): when no record holds every word of a
// search, the list is in BM25F's order, the rarest words a record holds weighing most. A tiny
// stand-in for that here, so the mockup greys the right words as you type: the words the first
// record does not hold are the ones the search did not use.

export interface MockRecord { title: string; meta: string; text: string }

export const FILMS: MockRecord[] = [
  { title: 'Ratatouille', meta: '2007', text: 'A rat who dreams of becoming a great chef in Paris teams up with a young kitchen worker.' },
  { title: "Mr. Morgan's Last Love", meta: '2013', text: 'A widowed professor living in Paris finds new meaning in a friendship with a young dancer.' },
  { title: 'Midnight in Paris', meta: '2011', text: 'A screenwriter on holiday in Paris is taken back to the 1920s every night at midnight.' },
  { title: 'The Rats', meta: '2002', text: 'A department store is overrun by rats living in the basement.' },
  { title: 'Saving Private Ryan', meta: '1998', text: 'During the Second World War, a group of soldiers go behind enemy lines to find a paratrooper.' },
  { title: 'Dunkirk', meta: '2017', text: 'Allied soldiers are surrounded on the beaches of Dunkirk in the Second World War.' },
  { title: 'The Pianist', meta: '2002', text: 'A Polish Jewish musician struggles to survive the Warsaw ghetto in the Second World War.' },
  { title: 'Finding Nemo', meta: '2003', text: "A clownfish searches the ocean for his son, who was taken to a dentist's aquarium." },
  { title: 'Up', meta: '2009', text: 'An old man ties thousands of balloons to his house and flies it to South America.' },
  { title: 'Inception', meta: '2010', text: 'A thief who steals secrets from dreams is given the task of planting an idea.' },
  { title: 'Cast Away', meta: '2000', text: 'A courier is stranded on an island after his plane crashes in the Pacific.' },
  { title: 'Popcorn', meta: '2007', text: 'The most popular movie theatre in town is about to close.' },
  { title: 'Box Office', meta: '2015', text: 'A comedy about the most popular movie star of the year.' },
  { title: 'Fan Club', meta: '2019', text: 'Teenagers run the most popular fan site for a movie series.' },
  { title: 'What About Bob?', meta: '1991', text: 'The most popular patient of a psychiatrist follows him on his family holiday. What is a man to do about Bob?' },
];

export const BOOKS: MockRecord[] = [
  { title: 'Den indre fredsprosessen', meta: 'Freddy Hørven', text: 'En bok om ro, tanker og følelser i hverdagen.' },
  { title: 'Sommer i Lofoten', meta: 'Kari Berg', text: 'Hvem har skrevet den? En roman om en sommer ved havet og den som kom tilbake.' },
  { title: 'Vinterboka', meta: 'Ola Nymo', text: 'Hvem har skrevet den beste boka om vinteren? Her er den.' },
  { title: 'Skogen', meta: 'Ingrid Sæther', text: 'Les om hvem som har skrevet den første boka om skogen i Norge.' },
  { title: 'Påskequiz 2024', meta: 'Gyldendal', text: '1000 spørsmål til påsken for hele familien.' },
  { title: 'Quizboka', meta: 'Gyldendal', text: 'Spørsmål og svar om alt mellom himmel og jord.' },
  { title: 'Året ute', meta: 'Per Hansen', text: '100 turtips for de fire årstidene i Norge.' },
  { title: 'Kokebok for hele familien', meta: 'Anne Lie', text: 'Middager som barna liker, hele året.' },
];

export const FILM_QUESTIONS = [
  'help me find a film about a rat living in paris',
  'most popular second world war movie',
  'which film is about a clownfish who searches for his son',
  'second world war',
];

export const BOOK_QUESTIONS = [
  'hvem har skrevet den indre fredsprosessen',
  'finnes det en quizbok med 1000 spørsmål til påsken',
  'hva heter boka med 100 turtips for årstidene',
  'den indre fredsprosessen',
];

export interface Word { text: string; start: number; end: number; used: boolean }

export interface Outcome {
  /** Every word of the text, where it is, and whether the search used it. */
  words: Word[];
  /** True when no record holds every word and the list is in BM25F's order. */
  focused: boolean;
  /** The records holding every word, or, focused, the records holding the most of them: what the count says. */
  count: number;
  results: MockRecord[];
}

const tokenize = (s: string) => s.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean);

/** The search the page would get. A word is held whole, or as the start of a longer word when it
 *  is the one being typed and three letters or more; one shorter cannot switch the list alone. */
export function search(records: MockRecord[], text: string): Outcome {
  const words: Word[] = [];
  for (const m of text.matchAll(/[\p{L}\p{N}]+/gu)) words.push({ text: m[0].toLowerCase(), start: m.index!, end: m.index! + m[0].length, used: true });
  if (words.length === 0) return { words, focused: false, count: 0, results: [] };
  const typing = !/[^\p{L}\p{N}]$/u.test(text);
  const tokens = records.map(r => new Set(tokenize(`${r.title} ${r.text}`)));
  const holds = (i: number, w: Word) => tokens[i].has(w.text)
    || (typing && w === words[words.length - 1] && w.text.length >= 3 && [...tokens[i]].some(t => t.startsWith(w.text)));
  const last = words[words.length - 1];
  const counted = typing && last.text.length < 3 && words.length > 1 ? words.slice(0, -1) : words;
  const all = records.map((_, i) => i).filter(i => counted.every(w => holds(i, w)));
  if (all.length > 0)
    return { words, focused: false, count: all.length, results: all.slice(0, 5).map(i => records[i]) };

  const df = (w: Word) => records.filter((_, i) => holds(i, w)).length;
  const idf = new Map(counted.map(w => [w, Math.log((records.length + 1) / (df(w) + 1))]));
  const score = (i: number) => counted.reduce((s, w) => s + (holds(i, w) ? idf.get(w)! : 0), 0);
  const ranked = records.map((_, i) => i).filter(i => score(i) > 0).sort((a, b) => score(b) - score(a));
  // The words the first record holds are the ones the list went by.
  for (const w of words) w.used = counted.includes(w) && ranked.length > 0 && holds(ranked[0], w);
  const most = Math.max(...records.map((_, i) => counted.filter(w => holds(i, w)).length));
  const count = records.filter((_, i) => counted.filter(w => holds(i, w)).length === most).length;
  return { words, focused: true, count, results: ranked.slice(0, 5).map(i => records[i]) };
}
