# Screenshots

Images for the repository `README.md`. Reference them as `docs/images/<name>` from the root.

| File | Shows |
|---|---|
| `intrface-demo.gif` | The README's opening image: the film search with nothing typed, a misspelled title typed key by key and found, then a search narrowed by genre and release years. 1200 px wide, about 11 s, built from the frames the stills come from |
| `intrface-catalogue.png` | The film search with nothing typed: the most voted films, genre buttons with counts, the Actors filter. Not in the README, where the GIF opens on the same screen; here for release notes and the combined Indx GIF |
| `intrface-fuzzy.png` | "intersetllar", two letters swapped: no word matches, and Interstellar still comes first |
| `intrface-filters.png` | "space" narrowed to Science Fiction from 1970 to 1999: the active filters as chips, the genre counts for what is left, the years on the slider |

The stills are **2560x1600 PNG**, a 1280x800 viewport at `deviceScaleFactor: 2`, dark theme. The
demo is built from `@indxsearch/intrface` and `@indxsearch/systm` alone, over 23,439 films from
[TMDB](https://www.themoviedb.org) with small WebP posters, served by a local Indx server. All of
it, and the Playwright script that takes the pictures, lives outside this repository, beside the
IndxServer screenshots. Film data and posters from TMDB; this product uses TMDB data but is not
endorsed or certified by TMDB.
