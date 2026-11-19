# Search results: native modal with game rows vs. tabs and a dropdown panel

> **Decision**: Show search results in a native modal `<dialog>`, with each game as a full-width row, and keep the library as the list of saved games, without tabs.
> **Date**: 2026-11-18
> **Original**: [Spanish](../0009-resultados_de_busqueda_en_dialog_modal.md)

---

## Context

- The library had status tabs (in progress, completed, not started) that did not filter anything.
- Search results were shown on the same page: searching took the user away from their saved games.
- I had to decide how to present results and what to do with the tabs.

## Options considered

| Option | Pros | Cons |
|---|---|---|
| Results and Saved tabs | The simplest, and it already existed | Searching takes the user away from their saved games, and the status tabs were placeholders with no function |
| Dropdown panel next to the search box | Quick to use and does not cover the page | Too narrow for covers or game rows |
| Modal with a grid of covers (native `<dialog>`) | The browser handles focus, Escape and making the page inert | Not useful for comparing data, because the cover does not carry detailed progress |
| ⭐ **Modal with one row per game** (native `<dialog>`, one full-width row per game) | Same native benefits as the grid modal. The row shows cover, progress and locked achievements, which is what users look at to decide whether to save a game | One more component |

## Reasoning

- Results are transient: you look at them, save one or two and close them. A modal keeps them apart from the saved list.
- Between the two modals, the **modal with one row per game** shows more data in the same space and matches what users look at when searching.

## Decision

**I choose the modal with one row per game.**

| Piece | Detail |
|---|---|
| Library | Keeps the search box and the list of saved games. I remove the status tabs and also the dashboard's search box |
| Closing | With Escape, its button or clicking outside (`closedby="any"`, with a fallback for Safari, which does not support it) |
| Saving | If I save a game from the modal, the list behind it updates itself |

## Consequences

- While the modal is open, the search box behind it is inert: to search for something else you have to close it.
- Results have no URL, so the back button does not bring them back.
- Since the search box only lives in the library, a global search shortcut remains a possible improvement.
