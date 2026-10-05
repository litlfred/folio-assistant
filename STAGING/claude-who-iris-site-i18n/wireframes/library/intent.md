# Library visualiser — as-is intent

**Covers** five declared refs that share one template:
- `cat-harness/docs/cat-harness/library/who-iris/index.html` (declared in `who-iris/who-iris.json` and in `cat-harness/cat-harness.json`)
- `cat-harness/docs/cat-harness/library/agent-skills/index.html` (`agent-skills/agent-skills.json`, `cat-harness/cat-harness.json`)
- `cat-harness/docs/cat-harness/library/cat-harness/index.html` (`cat-harness/cat-harness.json`)
- `cat-harness/docs/cat-harness/library/folio-assistant/index.html` (`folio-assistant.json`)
- `cat-harness/docs/cat-harness/library/folio-assistant-sci/index.html` (`folio-assistant-sci/folio-assistant-sci.json`, `cat-harness/cat-harness.json`)

All five are written by `cat-harness/scripts/gen-library-viz.ts`: "a zero-dependency viewer under `<site>/<graph>/` that fetches the projection relative to its own location" (`cat-harness/docs/assets/library/index.json`). The drawing uses `who-iris`. The others differ only in their counts: agent-skills has 4 entries, cat-harness 4, folio-assistant 0 entries with 20 of 31 uploads uningested, and folio-assistant-sci 1.

**Who it is for:** a librarian or maintainer of an instance's L1 corpus (the ingested documents). The generator quotes the owner: *"need (srotable) lisiting (w/ metadata) and folio/desktop view"*.

**What they need to do** (from the generator):
- in the **Listing**, sort by any column and see every metadatum, to answer "which is the biggest", "which has no OCR" and "which came from which upload"
- in the **Desktop**, see the corpus as tiles, to answer "what is in here" before knowing what to look for
- search entries
- tell the three OCR states apart (`scanned`, `not scanned`, `empty`), none styled as an error
- see the uploads queue that feeds the library, and what is still uningested
- open an entry and read its blocks: for each prose block, the **extract** (the first 600 characters of the section) and, **beside it**, the **agent summary** with its state in words — "agent draft (model …)", "confirmed by …", "stale: source changed", "rejected — back in the queue", "not yet summarised". Owner, 2026-09-24: *"on library/ page, the extract of a node is shown, but no agentic summary"*; and on scope, *"Make as QA sidecar as part of general doc ingestion to slowly drain."*
- see how much of the summary drain is left: a badge counts the prose blocks not yet summarised and the agent drafts awaiting a person, and an opened entry states its own count. The count is advisory, never styled as an error.
- "Pull out to folio" an entry. The page is otherwise read-only by the owner's ruling (*"just on that subgraph w/o edit functionality"*).

**What it must show:** a heading and a summary line (instance · entries · words · sections), badges (uningested uploads, json files scanned for references, prose blocks not yet summarised), the toolbar, the listing (13 columns: slug with the entry's cover and the pull-out control, title, instance, rung, sections, blocks, images, OCR, pages, words, size, referenced by, source), the "Uploads — the queue feeding this" table, and, once an entry is opened, its blocks with the extract and the agent summary side by side (stacked at 390 px).

## Observed on main (re-checked against main 0bcf94bd)

Rendered at 1280×800 and 390×844, served from the checkout. Since e112deae the generator adds a cover avatar per entry (bean `zrvt`, issue #1006) and moves "Pull out to folio" from the last cell to the first. The only mobile behaviour is the wrapping of the header and toolbar. Both tables sit in `overflow-x: auto` boxes, which is why the page itself does not scroll sideways. The drawing's mobile layout is how the page renders at 390 px, with the tables clipped at the box edge (the dashed line).

1. **Folio handle:** a `▾ Folio` button, `position: fixed`, at the top centre (accessible name "Pull down your folio").
2. **Header:** "Library — the L1 corpus", then `who-iris · 3 entries · 84,292 words · 404 sections`, then two badges: "**1** uningested in `who-iris/uploads` of 4" and "**1728** json file(s) scanned for references".
3. **Toolbar:** a search field "Search entries…" (`aria-label`) and a Listing | Desktop toggle (`aria-pressed`).
4. **Listing:** 3 rows (`9789241548960-eng` "Handbook forGuideline Development 2nd edition", `who-pub-tps-931` "Abies", `wpr-rdo-2020-003-eng` "PUBLICATION AND INFORMATION"), sorted by slug ▲, with header buttons carrying `aria-sort`. The first cell (`white-space: nowrap`, 391 px) holds a 34 × 46 px cover (`alt=""`; all three who-iris entries have one, a book glyph stands in otherwise), the slug and a "⤴ Pull out to folio" button (accessible name "Pull <title> out to your folio glass"). The last column has "source verified" and the PDF name. The table is now 1820 px wide.
5. **Uploads — the queue feeding this:** 4 units (`9789241548960-eng`, `iris-home` uningested, `who-pub-tps-931`, `wpr-rdo-2020-003-eng`) with queue, kind ("intake · N files"), size and state ("ingested → slug").
6. **Desktop view** (after the toggle): one card per entry, with the cover, the title and "Pull out to folio", `instance / slug`, sections, blocks, images, pages, words, size, and pills for rung, OCR, source and references.

## Findings

1. **Five columns are off-screen even at desktop width.** The page action is now reachable: "Pull out to folio" moved to the first cell, so finding 1 of the earlier drawing (the action past the right edge) is fixed. But the first cell is now 391 px and does not wrap, and the table has grown to 1820 px. At 1280 px **Pages**, **Words**, **Size**, **Referenced by** and **Source** are past the right edge of the scroll box, and nothing on screen shows there is more to the right.
2. **On a phone the listing is one column.** At 390 px only the first cell is in view: the cover, the slug and the pull-out button. Title, words, size, OCR and source, the metadata the listing exists to show, all need a sideways scroll inside a box. The uploads table shows only "Unit" at 390 px.
3. **The fixed Folio handle covers the page title on a phone.** At 390 px the `▾ Folio` button sits over "Library — the L1 corpus" (it reads "Library — th… ▾ Folio …s"). At 1280 px it clears the title.
4. **Entries cannot be opened.** Neither the slug, the title nor the cover is a link, in either view. Rows and cards carry a `data-fa-library-href`, but nothing on the page lets a reader reach an entry's sections or source.
5. **The titles shown are extraction artefacts.** "Abies" is the title shown for `who-pub-tps-931` (the WHO editorial style manual, per the uploads table). "PUBLICATION AND INFORMATION" is cut short, and "Handbook forGuideline" is missing a space. The same text is also the pull-out button's accessible name ("Pull Abies out to your folio glass"). At 34 × 46 px the cover is too small to settle what an entry is, so the reader still has to cross-check against the uploads table.
6. **"Referenced by" details are in a `title` tooltip only.** The pill "1 catalogue, 1 voices" puts the referencing file paths in its `title` attribute, which touch and keyboard users cannot reach.

## Update, 2026-09-24: the agent summary beside the extract

The blocks panel (bean `lrmo`) showed a prose block's extract and, in its last column, only a narrative STATE. It now carries the block's agent summary from the entry's `summaries.json` sidecar (`schemas/block-summary.ts`) **beside** the extract, never in its place: two columns at 1280 px, stacked with the extract first at 390 px. The last column is "narrative / summary", and for a prose block it shows the summary's state as a word badge. A header badge counts the backlog of the summary drain (`bun run summaries`) for the entries in scope. Checked by rendering the cat-harness page at both widths with `arxiv-2312.07755v1` opened: no horizontal page scroll at 390 px, and no script errors.

## Update, 2026-10-02: findings re-measured and worked (bean `gnqa`, issue #1838)

Re-measured on a local build of `main` cf3e62487 (`preview:site`, served at `/folio-assistant/`), at 1280×800 and 390×844. Pictures in `rendered-2026-10-02/` (`before-*` is that build, `after-*` the branch). The as-is drawing above is NOT re-drawn; it records the page as it was.

1. **Fixed.** The page now aggregates 60 entries and the table had grown to 3,636 px. Slug, title and source wrap inside bounded widths, so it is 1,552 px. The first column is pinned while it scrolls, and a right-edge fade shows there is more (`after-web.png`, `after-web-scrolled.png`).
2. **Fixed.** Below 800 px each row is a two-column card with every cell labelled, and the header row stays as the sort controls. The uploads table gets the same treatment. Measured: `scrollWidth` 390, both tables 334 px in a 334 px box (`after-mobile.png`).
3. **No longer holds** (already recorded fixed 2026-09-29). The handle is at 0–28 and the h1 at 52.
4. **No longer holds** (#1592). Each title is a link to the entry's README.
5. **Fixed for the three named entries.** A catalogue node that names the slug in `libraryId` now supplies the title: "Abies" becomes "WHO editorial style manual", "PUBLICATION AND INFORMATION" becomes "Publication and information products style guide", and "Handbook forGuideline…" becomes "WHO handbook for guideline development". The pull-out button's accessible name follows. The extracted title is kept as `extractedTitle` and is still searched. Two parts are left open. Other entries with no catalogue node still show extraction artefacts (e.g. "PROV-O: … Editors:"), which is corpus data. The 34×46 px cover is an open design question on the PR.
6. **Fixed.** "Referenced by" is a `<details>`, so its files open on tap, Enter or Space. There is no `title` tooltip.

## Update, 2026-10-02: titles of entries with no catalogue record (bean `w6fu`, issue #1838)

The owner ruled on finding 5's open half: **both, in order**. (a) The PDF ingest path now resolves a title from the sources that can vouch for it: the PDF's `Title` metadata, page 1's largest heading, and the outline, before the text walk (`scripts/_pdf_title.py`, shared by both PDF rungs and `ingest-document.ts --refresh-title`). A candidate is taken only when an independent source corroborates it; otherwise the raw title stays, marked `title_verified: false`, with every candidate recorded. Over all 57 entries with a `structure.json`, this changed 19 shown titles. The number of entries that show only their slug went from 25 to 18. (b) The 19 titles still wrong after that are corrected as data, in each entry's own `structure.json` (`metadata.title_correction`, with the basis it was read from). The manifest records `title_source: "editorial"` beside the extracted title.

Pictures in `rendered-2026-10-02/`, at 1280×800 and 390×844, on a local `preview:site` build. `titles-before-*` uses #1839's library index and `titles-after-*` uses this branch's. `titles-w3c-*` filters the list to "w3c", where the run-on titles were. No horizontal page scroll at either width, and no script errors.

Still open: `kg-folio-asst-2026-09-30` (a slide deck with no title metadata) and `codata-2022` (a tabular entry titled by its file name) keep their current titles. Neither is a PDF, and nothing in either says what its title is.
