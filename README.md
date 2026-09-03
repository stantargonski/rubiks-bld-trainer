# tstimer

A speedcubing timer, BLD memo trainer, and CFOP trainer. Scrambles for all 17 WCA events, a Speffz letter-pair
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

## Import csTimer data

In csTimer: the wrench icon → Export → "Export to file". Drag and drop the .txt or open in 
the settings menu.

## Running it locally

```bash
npm install
npm run dev
```
## Acknowledgements

- **[csTimer](https://cstimer.net/)** — the import in this app reads csTimer's own
  export file. tstimer contains no csTimer code and is not derived from it; the
  parser was written against the format. csTimer is a separate project under
  the GPLv3.
- **[WCA Regulations](https://www.worldcubeassociation.org/regulations/)** — the
  source for inspection, the +2 and DNF cutoffs, and what counts as a scramble
  for each event.
- **Speffz** — the corner/edge lettering scheme used by the 3BLD trainer,
  devised by Stefan Pochmann.

## License

MIT — see [LICENSE](LICENSE).
