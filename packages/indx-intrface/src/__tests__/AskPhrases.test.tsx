import { describe, it, expect } from 'vitest';
import { stripAskPhrases, type AskPhrases } from '../utils/askPhrases';

// The server's defaults with a film catalogue's frames, as SearchOrAskPhrasesTests has them.
const FILMS: AskPhrases = {
  leadIns: ['help me find', 'can you help me find', "i'm looking for", 'looking for', 'is there', 'which', 'what'],
  frames: ['the one', 'something', 'the movie', 'the film', 'a movie', 'movies', 'film'],
  links: ['where there is', 'about', 'where', 'with', 'has', 'that'],
  articles: ['the', 'a', 'an'],
};

describe('stripAskPhrases', () => {
  it.each([
    ['Help me find the movie about the green ogre', 'green ogre'],
    ['The movie with the green ogre', 'green ogre'],
    ['Which film has Tom Hanks stranded on an island?', 'Tom Hanks stranded on an island'],
    ['movies about time travel', 'time travel'],
    ['looking for alaska', 'alaska'],
    ['help me find the help', 'help'],
  ])('%s searches %s', (typed, searched) => {
    const r = stripAskPhrases(typed, FILMS);
    expect(r.text).toBe(searched);
    expect(r.taken.length).toBeGreaterThan(0);
  });

  it.each(['help', 'help me find', 'the movie', 'which film', 'film noir', 'what we do in the shadows', 'shrek', 'green ogre'])(
    '%s searches as typed', typed => {
      expect(stripAskPhrases(typed, FILMS)).toEqual({ text: typed, taken: [] });
    });

  it('takes the longest phrase, whatever the case and punctuation', () => {
    expect(stripAskPhrases('CAN YOU HELP ME FIND the movie about the green ogre?', FILMS))
      .toEqual({ text: 'green ogre', taken: ['CAN YOU HELP ME FIND', 'the movie', 'about', 'the'] });
  });
});
