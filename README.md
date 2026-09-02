# tstimer

A speedcubing timer and memo trainer for 3BLD and CFOP trainer. Scrambles for all 17 WCA events, a Speffz letter-pair
library for 3BLD, and the 21 PLL cases with algs for your to learn or practice.

**[tstimer](https://stantargonski.github.io/tstimer/)**


## Demo

Add demo videos

| | |
|---|---|
| **Timing a solve** | Space to arm, release to start, any key to stop — with 15-second inspection and the +2 / DNF cutoffs. |
| **Blindfolded** | The memo split: one keypress ends memo and starts execution, and both halves land in the solve list. |
| **Stats** | Sessions, ao5 / ao12 / ao100, the time-of-day heatmap and the histogram. |
| **3BLD letter pairs** | Fill mode walking the whole Speffz set, one pair at a time. |
| **Appearance** | Themes, fonts, a background picture, and the panel opacity / blur sliders. |

*Clips pending — the table above is the shot list.*


## Running it locally

```bash
npm install
npm run dev
```



## Bringing your csTimer history with you

Settings → csTimer takes the file csTimer writes from **wrench icon → Export → Export to file**.
Drop it on the panel or pick it, and every session in it is listed with its solve count and dates.
For each one you choose three things: the **event** (csTimer only records which scrambler a session
used, so this is a guess worth checking), **where** the solves go — a new session, or added to one
you already have — and what a new session is **called**. Untick anything you don't want. Nothing is
written until you press import, and then a receipt says exactly what landed where.

Times, scrambles, dates, +2s, DNFs and BLD memo splits from multi-phase sessions all come across;
solve comments don't. Appending to an existing session skips solves it already has, so re-importing
an updated export picks up only what is new. Nothing already in the timer is ever replaced.

Imported files are treated as untrusted — sizes, names, times and dates are all bounded before
anything is stored, and an import too large for the browser's storage is refused rather than
half-written. `src/data/limits.ts` says what is bounded and why.
