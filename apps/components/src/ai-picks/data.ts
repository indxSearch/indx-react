// Mock data for the AI picks mockup: a film catalogue asked for "queer movies". The catalogue has
// no genre or keyword for it, so the search can only match the word, and with a typo allowed,
// "queen" too. The picks are what the assistant chose from reading the records.

export interface Film {
  key: number;
  title: string;
  year: number;
  genres: string[];
  overview: string;
}

/** A film the assistant chose, numbered as the answer cites it, with why it was chosen. */
export interface Pick extends Film {
  n: number;
  why: string;
}

/** A film a search found that the assistant read and left out, with why. */
export interface LeftOut extends Film {
  why: string;
}

export const QUESTION = 'find queer movies';

export const PICKS: Pick[] = [
  { n: 1, key: 258480, title: 'Carol', year: 2015, genres: ['Romance', 'Drama'],
    overview: 'In 1950s New York, a department-store clerk who dreams of a better life falls for an older, married woman.',
    why: 'Two women fall in love in 1950s New York.' },
  { n: 2, key: 376867, title: 'Moonlight', year: 2016, genres: ['Drama'],
    overview: 'The tender, heartbreaking story of a young man’s struggle to find himself, told across three defining chapters.',
    why: 'A young Black man in Miami comes to terms with who he loves, in three chapters.' },
  { n: 3, key: 531428, title: 'Portrait of a Lady on Fire', year: 2019, genres: ['Drama', 'Romance', 'History'],
    overview: 'On an isolated island in Brittany at the end of the eighteenth century, a female painter is obliged to paint a wedding portrait.',
    why: 'A painter and the woman she paints fall in love.' },
  { n: 4, key: 398818, title: 'Call Me by Your Name', year: 2017, genres: ['Romance', 'Drama'],
    overview: 'In 1980s Italy, a relationship begins between seventeen-year-old teenage Elio and the older adult man hired as his father’s research assistant.',
    why: 'A summer love between two young men in 1980s Italy.' },
  { n: 5, key: 142, title: 'Brokeback Mountain', year: 2005, genres: ['Drama', 'Romance'],
    overview: 'Two modern-day cowboys meet on a shepherding job in the summer of ’63 and form a lifelong connection.',
    why: 'Two cowboys keep their love going for twenty years.' },
  { n: 6, key: 290098, title: 'The Handmaiden', year: 2016, genres: ['Thriller', 'Drama', 'Romance'],
    overview: '1930s Korea, in the period of Japanese occupation, a new girl is hired as a handmaiden to a Japanese heiress.',
    why: 'A con between two women turns into a love story.' },
  { n: 7, key: 234200, title: 'Pride', year: 2014, genres: ['Comedy', 'Drama', 'History'],
    overview: 'In 1984, a group of gay and lesbian activists decide to raise money to support the families of striking miners.',
    why: 'A comedy about gay and lesbian activists in 1984.' },
  { n: 8, key: 1084199, title: 'Queer', year: 2024, genres: ['Drama', 'Romance'],
    overview: '1950s Mexico City. William Lee, an American expat, falls for a younger man.',
    why: 'An American in 1950s Mexico City falls for a younger man.' },
];

/** What the search for the word found, as the page lists it now: one film about it, then
 *  films that matched "queen" with a typo. */
export const SEARCHED: Film[] = [
  PICKS[7],
  { key: 1165, title: 'The Queen', year: 2006, genres: ['Drama', 'History'],
    overview: 'The intimate behind-the-scenes story of the royal family in the week after the death of Princess Diana.' },
  { key: 522039, title: 'Queen & Slim', year: 2019, genres: ['Crime', 'Drama', 'Romance'],
    overview: 'A couple’s first date takes an unexpected turn when a police officer pulls them over.' },
  { key: 317557, title: 'Queen of Katwe', year: 2016, genres: ['Drama'],
    overview: 'A young girl overcomes her disadvantaged upbringing in the slums of Uganda to become a Chess master.' },
  { key: 286939, title: 'Queen of the Desert', year: 2015, genres: ['Drama', 'Adventure'],
    overview: 'A chronicle of Gertrude Bell’s life, a traveler, writer, archaeologist and political attaché for the British.' },
];

export const SEARCH_COUNT = 38;

export const LEFT_OUT: LeftOut[] = [
  { ...SEARCHED[1], why: 'Found for “queen”, one typo from the word. About the royal family.' },
  { ...SEARCHED[2], why: 'Found for “queen”. A couple on the run, not a queer story.' },
  { ...SEARCHED[3], why: 'Found for “queen”. A chess prodigy in Uganda.' },
  { ...SEARCHED[4], why: 'Found for “queen”. Gertrude Bell’s travels.' },
];

/** The answer, citing the picks as [n]. */
export const ANSWER =
  'Here are eight films with queer lives at their heart. Carol [1] and Portrait of a Lady on Fire [3] are love stories between women, ' +
  'Moonlight [2] and Call Me by Your Name [4] are about growing up and first love, and Pride [7] is a warm comedy about activists in 1984. ' +
  'The catalogue has no genre for this, so I chose them by what they are about, and left out films that only matched a word like “queen”.';

/** What the assistant did, as AskPanel shows its steps. */
export const STEPS = ['Searching: “queer”', 'Searching: Romance, “two women”', 'Searching: Drama, “gay”', 'Reading 74 films', 'Picked 8'];
