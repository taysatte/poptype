# poptype word system

How vocabulary is built, tiered, and fed into a typing run.

## Overview

Words come from **two sources**, merged into three **difficulty pools**. At run time, [`TypingEngine`](../components/TypingEngine.tsx) picks a pool, shuffles it, and walks the player through one word at a time.

```
FREQUENCY_300 (top English words)     CUSTOM_WORDS (curated tech/arcade)
         │                                      │
         ▼ normalize + tier by length           │
    easy | medium | hard ◄──────────────────────┘
         │ merge + dedupe
         ▼
      wordBank
         │
         ▼
   generateQueue(difficulty, count)  →  session word queue
```

## Source files

| File | Role |
|------|------|
| [`lib/frequencyWords.ts`](../lib/frequencyWords.ts) | Ranked list of 300 common English words |
| [`lib/wordTiers.ts`](../lib/wordTiers.ts) | Assigns each word to `easy` / `medium` / `hard` by length |
| [`lib/wordBank.ts`](../lib/wordBank.ts) | Merges sources, exports `wordBank` and `generateQueue` |

## Difficulty tiers

Tiers are chosen in the UI before a run. Only words from that tier’s pool appear.

| Tier | Letter length | Examples |
|------|----------------|----------|
| **easy** | 3–5 | `the`, `water`, `pop`, `rust` |
| **medium** | 6–7 | `people`, `through`, `engine`, `canvas` |
| **hard** | 8+ | `children`, `mountain`, `stenography`, `optimization` |

Length is a simple proxy for reach and visual load—not full ergonomic analysis (that may come later).

## Normalization rules

Applied to frequency words in [`normalizeWord`](../lib/frequencyWords.ts):

- Lowercase only
- Apostrophes removed (`don't` → `dont`)
- Letters a–z only
- **Dropped** if shorter than 3 characters (`a`, `I`, `to`, etc.) so sprints stay meaningful

~275 of 300 frequency words survive normalization; the rest never enter a pool.

## Custom words

[`CUSTOM_WORDS`](../lib/wordBank.ts) adds hand-picked lists per tier (short brand/tech words on easy, longer friction strings on hard). They are **merged** with frequency words, not replaced. Duplicates are removed case-insensitively.

## Run queue (`generateQueue`)

When you start or reset a session (or change difficulty/duration while idle):

1. `generateQueue(difficulty, count)` runs
2. It Fisher–Yates shuffles that tier’s full pool
3. It returns the first `count` words

Queue size depends on session length in `TypingEngine`:

- **15s** → 40 words  
- **30s** → 60 words  

The carousel advances through the queue and wraps with modulo when needed.

## When the pool refreshes

A **new shuffle** happens when:

- Difficulty or duration changes (idle only)
- **Escape** resets the run
- Retry after the summary screen

The pool does **not** reshuffle mid-run when the timer ends (so summary stats stay correct).

## Dev helper

```bash
pnpm dlx tsx scripts/word-bank-stats.ts
```

Prints word count and length range per tier after merge.

## Possible later improvements

- Ergonomic overrides (e.g. bump `through` to hard despite length)
- Weight sampling by frequency rank (common words appear more often)
