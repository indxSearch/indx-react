// Focusing (IndxServer, Notes/focusing.md): when no record holds every word of a search, the list is
// in BM25F's order, and the server says which typed words the first record does not hold
// (Indx-Focus-Left-Out). These are real outcomes, not a stand-in: the questions of the committed
// test sets, searched on tmdb23k and the school register by the 6.0 engine on 10 Nov 2026
// (FocusProbe --left-out --titles). The words in brackets are the ones left out. Wrong first
// results are kept: they are what a visitor will see too.

export interface Example {
  set: 'Films' | 'Schools';
  /** The text as typed, the words left out in brackets. */
  typed: string;
  /** How many records hold the most of the words: the count the page shows. */
  count: number;
  /** The first three results, and which of them the question was written about (-1: none). */
  results: string[];
  right: number;
}

export const EXAMPLES: Example[] = [
  { set: 'Films', typed: '[hva] [handler] saltburn [om]', count: 72, results: ['Saltburn', 'What Will People Say', 'xXx: Return of Xander Cage'], right: 0 },
  { set: 'Films', typed: '[hva] [heter] [filmen] [der] wolverine [drar] [til] japan', count: 103, results: ['The Wolverine', 'X-Men Origins: Wolverine', 'Hulk vs. Wolverine'], right: 0 },
  { set: 'Films', typed: '[hvem] [spiller] deckard shaw furious', count: 3, results: ['Fast & Furious Presents: Hobbs & Shaw', 'Furious 7', 'The Fate of the Furious'], right: 1 },
  { set: 'Films', typed: '[who] [does] the [voice] of stuart little', count: 1, results: ['Stuart Little 3: Call of the Wild', 'Stuart Little', 'Little Voice'], right: 1 },
  { set: 'Films', typed: 'what is [ronin] about', count: 112, results: ['What About Bob?', 'What Men Talk About', 'What Men Still Talk About'], right: -1 },
  { set: 'Films', typed: '[whats] [polar] about', count: 18, results: ['What Men Still Talk About', 'What Men Talk About', 'What About Bob?'], right: -1 },
  { set: 'Films', typed: '[whats] the movie [where] [rat] [wants] to [be] [chef] in paris', count: 1, results: ['Rugrats in Paris: The Movie', "It's a Very Merry Muppet Christmas Movie", 'What a Girl Wants'], right: -1 },
  { set: 'Films', typed: '[hvilken] film [har] en [sankt] [bernhardshund] og ond [dyrlege]', count: 27, results: ['The Maiden Heist', 'Amundsen', 'Howards End'], right: -1 },
  { set: 'Schools', typed: '[hvor] [mange] [elever] [har] skistua barneskole', count: 1, results: ['Skistua barneskole', 'Bekkestua barneskole', 'Halsan barneskole'], right: 0 },
  { set: 'Schools', typed: '[does] bergen katedralskole [use] [nynorsk]', count: 1, results: ['Bergen katedralskole', 'Oslo katedralskole', 'Hamar katedralskole'], right: 0 },
  { set: 'Schools', typed: '[hvilke] [trinn] [har] ydalir skole', count: 19, results: ['Elverum kommune - Ydalir skole', 'Stuenes skole barne- og Ungdomstrinn', 'Jar skole'], right: 0 },
];

export interface Word { text: string; matched: boolean }

/** The example's words, each matched or left out. */
export const words = (e: Example): Word[] =>
  e.typed.split(' ').map(w => w.startsWith('[') ? { text: w.slice(1, -1), matched: false } : { text: w, matched: true });

/** The text as the visitor typed it. */
export const typed = (e: Example) => words(e).map(w => w.text).join(' ');
