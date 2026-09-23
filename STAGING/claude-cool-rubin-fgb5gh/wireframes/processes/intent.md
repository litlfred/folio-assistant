# Processes — as-is intent

## Covers

- Declared visualiser ref: `cat-harness/docs/processes/index.md`. This is tile `processes` in `cat-harness/docs/_data/harness.json`, with surfaces `navbar` and `board`. It is also the target of the navbar icon row's **Processes** icon (`navbar.hrefs.processes: /processes/`).
- Per-process pages: `cat-harness/docs/processes/<name>.md`, 67 of them. The one drawn is `cat-harness/docs/processes/adjudication.md`.
- Generator: `cat-harness/scripts/gen-processes-viz.ts`. The diagrams come from `assets/img/workflows/<name>.svg` (Tool `bpmn-render`), and `docs-ui.js` (`inlineDiagrams`, `mountFigure`) inlines each one and gives it zoom controls.
- Rendered by Jekyll with just-the-docs `v0.12.0`. Both page types set `nav_exclude: true`, so neither appears in the theme's own nav list.

The site could not be built here. The wireframe is drawn from the committed Markdown, the generator and the chrome's templates, JS and CSS.

## Who it is for, and what they need to do

The page says: *"every executable diagram, searchable"*. Each per-process page *"shows the diagram, what it is for, who acts in it, every step with the skill it runs, and which processes call it"*. A `kg:audit` check (`process-diagram-published`) fails any diagram that no page shows.

- **Reader:** a contributor, reviewer or agent who needs to know which process governs a piece of work and what each step asks of whom.
- **Tasks:**
  - find a process
  - see who calls it and what it calls
  - read its lanes
  - find the skill each step runs
  - in reverse, find which processes run a given skill

## What it must show (read off the generator)

Index page:
- counts per directory, and diagrams that failed to parse
- one row per process: steps, and undocumented steps
- the skill → processes reverse join
- lane names
- bean ops
- declared versus defaulted enforcement
- findings

Per-process page:
- the do-not-edit note
- the process id, enforcement and step count
- the purpose paragraph
- the diagram
- called by / calls / skill
- the lanes table
- the steps table

## Observed on main (edf3a89+)

The chrome is the same as on every just-the-docs page (see the navbar wireframe):
- a 56 px strip at rest, or the theme's top bar below 800 px
- the "▾ Folio" handle
- the search field
- the footer with "Open notes (3)" and the build stamp

Index (`/processes/`), in reading order:
1. H1 "Processes — every executable diagram, searchable", and the generator line.
2. The "67 / 67 / 0" line, and the where → diagrams table (63 / 3 / 1).
3. "Every process — one page each": 67 rows, with columns process link, steps, and undocumented steps.
4. "What runs this skill?": 91 rows.
5. "Who appears in a process?": 102 lane names.
6. "Which steps touch the work plan?": note 21, claim 17, resolve 8.
7. "Strict, advisory — and nobody said": strict 22 declared / 27 defaulted, advisory 18 / 0.
8. "Findings": the census of 36 activities with no skill ref, across 21 diagrams.

Per-process page (`/processes/adjudication.html`), in reading order:
1. The do-not-edit note, with an "All processes" link.
2. H1 "Adjudication", and `Process_Adjudication · advisory · 6 step(s)`.
3. The purpose, as one paragraph of about 330 words.
4. The BPMN figure: viewBox 1330 × 530, `max-width:100%`, with a figure toolbar of −, 100%, +, Reset and Full width.
5. How it connects: six "Called by" links, "Calls: none", and the skill `adjudication`.
6. Lanes: two rows, Feedback provider and Adjudicator, with long prose.
7. Steps: 6 rows, with columns step name + id, lane, skill link, and what it does.

## Findings

1. **"Searchable" in the H1, but the page has no search or filter control.** The only search is the site-wide theme search. Finding one of 67 processes means scrolling or using the browser's find.
2. **The index is five long tables stacked on one page** (67 + 91 + 102 rows, plus three short ones). "On this page" (7 entries) is only in the opened sidebar. At rest (56 px strip) and on mobile (behind the theme's Menu), there is no visible way to jump between sections.
3. **The index's skill → process column is not linked.** `run by` lists `.bpmn` filenames as code text. The per-process pages exist, but a reader cannot follow "which process runs `adjudication`" to the page for that process.
4. **At phone width the BPMN diagram is unreadable at rest.** A 1330 px-wide viewBox scaled to about 358 px is about 0.27×, so the diagram's text of about 12 px renders at about 3 px. The zoom and Full width controls exist, but the diagram offers nothing until they are used.
5. **The purpose is a single paragraph of about 330 words, above the diagram.** On mobile the diagram, which is what the page is for, begins more than a screen down. The lanes and steps cells hold 40 to 190 words each, and on mobile they scroll sideways inside the table wrapper.
6. **The "undocumented steps" column mixes "—" with numbers.** "—" means zero, but a reader cannot tell it from "not computed".
7. **`nav_exclude: true` on all 68 pages.** The pages are reachable only through the Processes icon (a glyph with an accessible name but no visible label at rest), the Folders list, the C@T Harness divider's "processes" link, or search. The theme's own navigation never lists them.
