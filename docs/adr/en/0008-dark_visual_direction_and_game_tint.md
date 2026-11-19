# Visual direction: dark, with the game's tint across the whole app

> **Decision**: Adopt a dark style, with covers as the main element and a background tinted with the colours of the current game's cover on every screen after login.
> **Date**: 2026-11-18
> **Original**: [Spanish](../0008-direccion_visual_oscura_y_tinte_por_juego.md)

---

## Context

- I wanted a new visual direction for the redesign of the whole application.
- Later, the library and the profile ended up looking different from the dashboard and the game page, and I had to decide which one was the reference.

## Options for the visual direction

| Option | Pros | Cons |
|---|---|---|
| ⭐ **Dark "gamer" style** (near-black backgrounds, large vertical covers and accents taken from the game's art) | It is the language of Steam and other gaming platforms. Covers already come in vertical format from the CDN ([ADR 0005](0005-game_covers_steam_cdn.md)) | — |
| Editorial and clean (lots of space and characterful type) | — | Colour is less focused on the covers |
| Collector's showcase (badges and medals per game) | Fits achievements | Needs more custom design per game |
| Soft glass with gradients | It is modern | It is generic for this subject |

## Options for the reference across all screens

| Option | Pros | Cons |
|---|---|---|
| Fixed background (a single colour for the whole app) | It is simple | Loses the most distinctive part of the dashboard |
| ⭐ **Background tinted by the current game** (the palette comes from the colours of the last searched game's cover) | More immersive, with a more elegant atmosphere | — |

## Reasoning

- I choose **dark** because vertical covers are what users recognise most, and I already have them.
- For the reference I choose the **background tinted by the current game**: the per-game tint is what sets the app apart most.

## Decision

**I choose dark, with the background tinted by the current game.**

| Piece | Detail |
|---|---|
| Palette and type | Blue-black base with warm white text, Barlow Condensed for headings and Instrument Sans for body text |
| `TintedPage` | Gives every screen the gradient background and the `--p-line`, `--p-surface` and `--p-accent` variables. Used by the dashboard, the library, the game page and the profile |
| Login | The login view keeps its own background |

## Consequences

- Every screen uses the same component, so the look is changed in one place.
- The global theme colour tokens (`ink` and `ink-text`, in orange) are now only used by the login view. Whether to clean them up is still open.
