# Eye-Tracking Reading Explorer

A website prototype that presents the eye-tracking visualizations from Mia Davis's Observable notebook
[`@miadavis/untitled/4`](https://observablehq.com/@miadavis/untitled/4) as a clean, responsive web page.

**Live site:** https://billionairesarfaraj.github.io/eye-tracking-reading-explorer/

## Overview

The site doesn't re-implement the notebook. It loads the **published notebook module from Observable**
and runs it in the browser with the official **Observable Runtime**. Each notebook cell's output (charts and
inputs) is placed into a section of the page. The notebook's JavaScript, data sources, and processing logic
run as written, so the notebook stays the single source of truth.

Visualizations and controls on the page, with the notebook cell each one comes from:

| Page section | Notebook cell(s) | Cell name(s) |
|---|---|---|
| Reader & trial selection | 4, 7, 8, 9 | `viewof fullReader`, anonymous summary cell, `viewof fullTrialKey`, `fullTrial` |
| Word-level fixation heatmap | 11 | `fullHeatmap` |
| Fixation scanpath | 12 | `fullScanpath` |
| Scanpath replay (play/pause, slider, speed) | 13, 14 | `viewof fullReplayStep`, `fullReplayPlot` |
| Condition filters | 15 | `viewof fullConditionFilters` |
| Reading time comparison | 16 | `fullReadingTimePlot` |
| Comprehension accuracy | 17 | `fullAccuracyPlot` |
| First vs. repeated reading | 18 | `fullRepetitionPlot` |
| Advanced vs. elementary difficulty | 19 | `fullDifficultyPlot` |
| Matched paragraph comparison | 20 | `viewof fullMatchedTrialKey`, `fullMatchedHeatmap` |

Data cells (`fullCatalog`, `fullSummary`, `fullReaderIndex`, `fullLoadShard`, `fullReaderData`, `fullAreas`,
`fullFixes`) run unchanged. Their results feed the charts and the summary numbers on the page.

## Notebook integration

`js/main.js`:

1. Imports the compiled notebook module, pinned to the published version:
   `https://api.observablehq.com/@miadavis/untitled/4@213.js?v=4`.
   If the Observable API can't be reached, it falls back to the archived copy of the same module in
   `notebook/miadavis-untitled-4@213.js`.
2. Creates an Observable `Runtime` and calls `runtime.module(define, observer)`. The observer factory maps
   each cell name to an element with a matching `data-cell="…"` attribute in `index.html` and renders it with
   Observable's `Inspector`. Loading and error states are added around each cell.
3. Data attachments (CSV files and the 12 ZIP shards, about 150 MB in total) are fetched on demand from
   Observable's file CDN (`static.observableusercontent.com`). Nothing is copied into this repository.

### The participant selector (Cell 4)

In the published notebook (version 213), Cell 4, *"Select a Participant from the Full Dataset"*, is
**empty**. The variable `fullReader` is never defined, so on observablehq.com every per-participant
cell shows `RuntimeError: fullReader is not defined`. The parent notebook it was forked from has the same
empty cell.

To make those visualizations work, `main.js` defines that one cell in the notebook's own style: an
`Inputs.select` over every `participant_id` in `fullReaderIndex`. This is the only code the site adds to
the notebook graph, and it is skipped automatically if a future notebook version defines `fullReader`.
The fix can also be made in the notebook itself by pasting this into Cell 4:

```js
viewof fullReader = Inputs.select(
  fullReaderIndex.map(d => d.participant_id),
  {label: "Select Participant"}
)
```

## Technologies

- JavaScript, HTML, CSS; no build step and no framework
- [Observable Runtime](https://github.com/observablehq/runtime) 5.9.9 (vendored in `js/vendor/`, ISC license)
- Observable standard library, loaded by the runtime from jsDelivr: Observable Plot 0.6.16,
  Observable Inputs 0.11.0, d3 7.9.0, htl, JSZip 3.10.1
- Google Fonts: Inter and Source Serif 4 (optional; system fonts are used if they don't load)

## Project structure

```
eye-tracking-website/
├── index.html                         Page layout and cell slots (data-cell="…")
├── css/
│   ├── style.css                      Site design, responsive rules
│   └── observable-inspector.css       Observable Inspector styles (from the notebook export)
├── js/
│   ├── main.js                        Loads the notebook and wires cells to the page
│   └── vendor/observablehq-runtime-5.9.9.umd.js
├── notebook/
│   └── miadavis-untitled-4@213.js     Archived compiled notebook module (fallback and reference)
├── .nojekyll                          Serve files as-is on GitHub Pages
└── README.md
```

## How to run it

**Easiest: open the live site.** https://billionairesarfaraj.github.io/eye-tracking-reading-explorer/

**From the ZIP:**

1. Unzip the archive. Don't open `index.html` from inside the ZIP preview; extract the whole folder first.
2. Double-click `eye-tracking-website/index.html` to open it in Chrome, Edge, or Firefox.
3. Wait for the green "Notebook version 213 loaded" message under the page title. The first load downloads
   the notebook and about 12–25 MB of eye-tracking data from Observable, which takes about 10–30 seconds.
   Charts show a "Loading data…" badge until their data arrives.

An internet connection is required: the notebook, its data, and its chart libraries are loaded from
Observable and jsDelivr. Keep the tab in the foreground while it loads. Browsers pause background tabs,
and the Observable Runtime waits until the tab is visible.

**Optional, with a local web server** (closest to how the live site is served). From the
`eye-tracking-website` folder:

```bash
python3 -m http.server 8080
```

Then open http://localhost:8080.

## Updating to a newer notebook version

Change `VERSION` in `js/main.js` to the new published version number, or remove the `@${VERSION}` part
of `REMOTE_MODULE` to always follow the latest published version. If cells are renamed, update the
matching `data-cell` attributes in `index.html`.

## Deployment

The site is static and is hosted on **GitHub Pages**, built from the `main` branch root:
https://billionairesarfaraj.github.io/eye-tracking-reading-explorer/

Any static host (Netlify, Vercel, Cloudflare Pages, an Observable-adjacent web server) works the same way:
upload the folder as-is.

## Notes

- Selecting a participant downloads that participant's ZIP shard (about 12 MB), and the matched comparison
  may download another shard. This is the notebook's data design, and the page shows a loading state while it happens.
- The notebook's charts are drawn at a fixed 1050–1100 px width. On narrow screens they keep a minimum
  width and scroll sideways inside their card, so the passage text stays legible.
- The Observable Runtime schedules work with `requestAnimationFrame`, so a page opened in a background tab
  starts computing when the tab is shown.
- `main.js` and the runtime are loaded as classic (non-module) scripts. That's why `index.html` also works
  when opened directly from disk, where browsers block `<script type="module">`.
