# Library visualiser — as-is intent

**Covers** five declared refs that share one template:
- `cat-harness/docs/cat-harness/library/who-iris/index.html` (declared in `who-iris/who-iris.json` and in `cat-harness/cat-harness.json`)
- `cat-harness/docs/cat-harness/library/agent-skills/index.html` (`agent-skills/agent-skills.json`, `cat-harness/cat-harness.json`)
- `cat-harness/docs/cat-harness/library/cat-harness/index.html` (`cat-harness/cat-harness.json`)
- `cat-harness/docs/cat-harness/library/folio-assistant/index.html` (`folio-assistant.json`)
- `cat-harness/docs/cat-harness/library/folio-assistant-sci/index.html` (`folio-assistant-sci/folio-assistant-sci.json`, `cat-harness/cat-harness.json`)

All five are written by `cat-harness/scripts/gen-library-viz.ts`: "a zero-dependency viewer under `<site>/<graph>/` that fetches the projection relative to its own location" (`cat-harness/docs/assets/library/index.json`). The drawing uses `who-iris`. The others differ only in their counts: agent-skills has 4 entries, cat-harness 2, folio-assistant 0 entries with 20 of 31 uploads uningested, and folio-assistant-sci 1.

**Who it is for:** a librarian or maintainer of an instance's L1 corpus (the ingested documents). The generator quotes the owner: *"need (srotable) lisiting (w/ metadata) and folio/desktop view"*.

**What they need to do** (from the generator):
- in the **Listing**, sort by any column and see every metadatum, to answer "which is the biggest", "which has no OCR" and "which came from which upload"
- in the **Desktop**, see the corpus as tiles, to answer "what is in here" before knowing what to look for
- search entries
- tell the three OCR states apart (`scanned`, `not scanned`, `empty`), none styled as an error
- see the uploads queue that feeds the library, and what is still uningested
- "Pull out to folio" an entry. The page is otherwise read-only by the owner's ruling (*"just on that subgraph w/o edit functionality"*).

**What it must show:** a heading and a summary line (instance · entries · words · sections), badges (uningested uploads, json files scanned for references), the toolbar, the listing (13 columns: slug, title, instance, rung, sections, blocks, images, OCR, pages, words, size, referenced by, source), and the "Uploads — the queue feeding this" table.

## Observed on main (edf3a89+)

Rendered at 1280×800 and 390×844. The only mobile behaviour is the wrapping of the header and toolbar. Both tables sit in `overflow-x: auto` boxes, which is why the page itself does not scroll sideways. The drawing's mobile layout is how the page renders at 390 px, with the tables clipped at the box edge (the dashed line).

1. **Folio handle:** a `▾ Folio` button, `position: fixed`, at the top centre (accessible name "Pull down your folio").
2. **Header:** "Library — the L1 corpus", then `who-iris · 3 entries · 84,292 words · 404 sections`, then two badges: "**1** uningested in `who-iris/uploads` of 4" and "**1719** json file(s) scanned for references".
3. **Toolbar:** a search field "Search entries…" (`aria-label`) and a Listing | Desktop toggle (`aria-pressed`).
4. **Listing:** 3 rows (`9789241548960-eng` "Handbook forGuideline Development 2nd edition", `who-pub-tps-931` "Abies", `wpr-rdo-2020-003-eng` "PUBLICATION AND INFORMATION"), sorted by slug ▲, with header buttons carrying `aria-sort`. The last column has "source verified", the PDF name and a "Pull out to folio" button.
5. **Uploads — the queue feeding this:** 4 units (`9789241548960-eng`, `iris-home` uningested, `who-pub-tps-931`, `wpr-rdo-2020-003-eng`) with queue, kind ("intake · N files"), size and state ("ingested → slug").
6. **Desktop view** (after the toggle): one card per entry, with title, `instance / slug`, sections, blocks, images, pages, words, size, and pills for rung, OCR, source and references.

## Findings

1. **Two columns are off-screen even at desktop width.** The listing table is 1738 px wide. At 1280 px, **Referenced by** and **Source** (and with it the page's one action, "Pull out to folio") are past the right edge of the scroll box. Nothing on screen shows there is more to the right.
2. **On a phone the listing is two columns.** At 390 px only Slug and part of Title are in view. Words, size, OCR and source, the metadata the listing exists to show, all need a sideways scroll inside a box. The uploads table shows only "Unit" at 390 px.
3. **The fixed Folio handle covers the page title on a phone.** At 390 px the `▾ Folio` button sits over "Library — the L1 corpus" (it reads "Library — th… ▾ Folio …s"). At 1280 px it clears the title.
4. **Entries cannot be opened.** Neither the slug nor the title is a link, in either view. Rows carry a `data-fa-library-href`, but nothing on the page lets a reader reach an entry's sections or source.
5. **The titles shown are extraction artefacts.** "Abies" is the title shown for `who-pub-tps-931` (the WHO editorial style manual, per the uploads table). "PUBLICATION AND INFORMATION" is cut short, and "Handbook forGuideline" is missing a space. The listing leads with the title, so the reader has to cross-check against the uploads table to know what an entry is.
6. **"Referenced by" details are in a `title` tooltip only.** The pill "1 catalogue, 1 voices" puts the referencing file paths in its `title` attribute, which touch and keyboard users cannot reach.
