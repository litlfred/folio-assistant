---
# folio-assistant-06e3
title: 'docs-auto: a handler at cat-harness/docs-auto/<auto-doc-type>/<path> that derives documentation for a sub-graph — and the authoring rule that the author must summarise what it indexes'
status: in-progress
type: task
priority: normal
created_at: 2026-09-20T20:54:07Z
updated_at: 2026-09-21T10:28:48Z
parent: folio-assistant-0lmb
---


Owner, 2026-09-20 (session_014HGPQoUnzXGqSspA8x6YyD), in three messages.

## 1. The handler

> in cat-harness needs to be harness/handler at `cat-harness/docs-auto/<auto-doc-type>/<path>`
> defined. which will auto-generate extracatable documentation at `<path>` sub-graph.
> extracablle = bpmn, tasks, glossary, etc. ther is a glosarry bean... this could
> clarify it lives at `cat-harness/docs-auto/glossary/<path>`
>
> auto-doc-type = glossary, index, index/bpmm, index/dmn, index/skills,
> index/tasks index/processes index/roles etc.

One handler, parameterised twice: by **what kind of derived document** and by
**which sub-graph** to derive it over. `<path>` is a sub-graph, not a directory
listing — the point is that any node set can be asked for its glossary, its
process index, its role index.

**`toc` is OUT**, and this is the only place that says so. It was in the list
above and withdrawn in the same session: *"no toc,... ther is no meanging at
folio level/. (mayber later)"* — a table of contents is a document-order notion
and a folio has no single order to take one over. Written down because the next
agent reading the original list would otherwise re-add it.

## 2. The authoring rule — this is the half that is a SKILL, not a generator

> then when authong `<harness>/docs` the author should make use of auto-doc
> referneces and provide a summary / overvuew of each of the business processes
> defined. as part of skills and judgement

So `docs-auto` is deliberately **not** the whole documentation. It produces the
index; a human or agent authoring `<harness>/docs` **references** it and then
writes the thing an index structurally cannot contain — what each business
process is FOR, when you would be in it, and what it is not. That obligation is
a rule in a skill, checked by judgement, not a gate: an auto-generated index
with no prose around it reads as complete while explaining nothing.

## 3. Reuse, do not restate

> ..reuse assets in explain.

The summary **reuses the assets** — the rendered BPMN, the lane and activity
titles and descriptions, the skill descriptions the activities point at — rather
than paraphrasing them into a second copy that is free to drift. Same discipline
as `who-iris/docs/ingestion-notes.html` (54a2edc931), which renders the
requirements table out of `who-iris/skills/iris-dspace.md` instead of restating
it, and refuses rather than rendering an empty table when the source moves.

## Done when

- [ ] the handler exists and is declared, with the `auto-doc-type` set above and
      **no** `toc`
- [ ] **`who-iris/docs` is the first real exercise, end to end** — owner,
      2026-09-20: *"try it out fully w/ who-iris docs, auto-docs."* Not a
      fixture and not a smoke test: the instance that already has a hand-built
      `docs/` is the one that will show whether a derived index and an authored
      summary can sit in the same directory without fighting.
- [ ] the authoring rule lives in a skill with the reuse-not-restate clause
- [ ] `<harness>/docs` carries a per-process summary that references the derived
      index rather than duplicating it
- [ ] a stale or moved source makes the derivation FAIL, never render empty

## Not started — and the order is the owner's

Owner, 2026-09-20: *"after the other issues doen"*. This runs **after** the
three open who-iris items: the cover-image extraction, the IRIS-home mock
validated against the capture, and the CRDM KG-to-CDN work. Stated here so a
session picking this bean up does not start it early.

Queued. Related: `lqo9` (the glossary content kind + defined-terms index) is
pieces 2–4 of its own ask; piece 1 of it is one `auto-doc-type` served here.

## 4. What `<base-url>/<harness>/docs` must be, and what its navbar must hold

Owner, 2026-09-20, same session:

> when you are at `<base-url>/cat-harness/docs`, you see open i the main page the
> main/home/landing documentation page (QA every harness needs at least one
> meaningfully popualated doc page that outlines what the harness does/gives
> overview of main business porcess, roles, tasks, etc... .use docs-auto) you see
> documentation about cat-harness, but in the LHS navbar, there is index of all KG
> assets that have a docs/ with assets in it. (so you could see that who-iris has
> docs, but maybe not litlifred/qou... , they are all sub-harness docs. this
> should be common functionalty,)

Three requirements, and they are separable:

**(a) A landing page, per harness.** `<base-url>/<harness>/docs` opens that
harness's own home documentation page — what this harness does, with an
overview of its main business processes, roles and tasks. Built by
**referencing** the docs-auto indexes and writing the summary around them
(§2 and §3 above), not by pasting a generated index in.

**(b) A QA check with teeth: "at least one MEANINGFULLY POPULATED page".** The
adjective is the requirement. A landing page that exists and says nothing
passes a file-exists check and fails the reader, which is the `xom7` shape
again — *it looks exactly like a working one from in here*. So the check has
to be about content: does the page reference the harness's processes, roles
and tasks, and does it say something about them that the index does not?
**And it must report "could not determine" as a third state**, never as a
pass, per the CI-health and health-check rules this repo already keeps.

**(c) The LHS navbar indexes every KG asset that HAS a populated `docs/`.**
Not every declared `docs` directory — one *with assets in it*. So `who-iris`
appears and a dependency with an empty or absent `docs/` does not. That is
the "declare only what exists" rule (`dh4f`) applied to navigation: a nav
entry to an empty directory is a link that resolves to nothing while reading
as a section.

**This is common functionality, not who-iris's.** It belongs in the harness
layer beside `mount-instance-docs.ts`, which already resolves which instance
owns which route and already refuses collisions — the navbar is the same
question asked for a listing rather than for a mount, so the two must agree by
construction rather than by both being right.

Note the dependency direction: (c) needs nothing from docs-auto and could ship
first; (a) and (b) are what make docs-auto worth having, since an index with
no authored summary around it is the thing §2 exists to forbid.

## 5. The same shape for KG viewers, not just for docs

Owner, 2026-09-20, same session:

> similarly, for KG viewer like visualizers, you can see whats in everyhing, or
> other harnesses that have registerd KGs.

§4(c) indexes the harnesses with a populated `docs/`. This says the **same
mechanism** serves a KG viewer: from one harness's viewer you can see what is
in everything, and reach the other harnesses that have **registered** a KG.

The word doing the work is *registered*. A harness's graphs are already
declared — `harness.json` names each directory and the graph kinds it holds,
and `resolveSkillDirs` already computes the cross-instance overlay. So the
viewer's index is **read off the declarations**, exactly as the docs navbar is,
rather than being a second list somebody maintains. Two indexes over one set of
declarations would be free to disagree, and the one a reader happened to open
would be the one they believed.

Three consequences worth writing down before anything is built:

- **`docs` is not special, it is the first case.** §4(c) says "every KG asset
  that has a `docs/` with assets in it"; this says the general form is "every
  graph kind a harness registered, wherever it is non-empty". The docs navbar
  is that query with `kind = docs`.
- **Non-empty is still the filter.** A registered-but-empty graph is the
  `dh4f` defect — a consumer scans nothing and reports a clean run over it —
  and as a nav entry it is a link that resolves to nothing while reading as a
  section.
- **Reachability is not the same as presence.** A dependency's graphs are
  reachable through the overlay; a sibling repository's (`litlfred/qou`) are
  not, unless it is a declared dependency of the instance being viewed. The
  viewer must show the difference rather than omitting the second silently —
  "not declared here" and "declared and empty" are different answers and
  neither is "absent".

Same home as §4: the harness layer, beside `mount-instance-docs.ts`, which
already answers "which instance owns which route" and already refuses
collisions.

## 6. A sibling already built §4(c) and §5's mechanism — check before rebuilding

Merging `main` on 2026-09-20 (76 commits) brought in
`cat-harness/scripts/state-visualizer.ts` and `render-pipeline.ts`, from bean
`o7eq` / `flh4` / PR #619. **A dashboard per declared graph, at
`<base-url>/<graph>/`, driven off `harness.json`.** That is the same query
§4(c) and §5 describe, already answered for state graphs.

Its comment settles three URL rulings that this bean would otherwise have had
to settle again:

1. the segment is the instance's **`name`**, never its `stub`;
2. the declared graph **is** a path segment, because an instance may declare
   more than one renderable graph and they would collide otherwise;
3. the root instance **elides its own name**, because its `docs/` is installed
   by cat-harness rather than its own (bean `n0nf`).

And it records a distinction worth not rediscovering: `state-visualizer.ts`
keys the URL on the declared entry's **`id`**, while `gen-schema-viz.ts` and
`gen-library-viz.ts` use `viewerPlacement(...)`, the handled directory's
**repo-relative path**. Five of seven state graphs agree because a
root-declared graph's path equals its id; `qa` (`test/results/`) and `health`
(`test/health/results/`) do not. An id-derived URL survives the directory
moving, and a public dashboard addressed `<base>/test/results/` names a test
directory — which is why they are two rules on purpose.

**So before building anything for §4(c) or §5:** read those three files and
decide whether docs-auto is a NEW generator or a `kind` handled by the one
that exists. The honest default is the second — §5 already says the docs
navbar is the general query with `kind = docs`, and there is now a generator
whose whole shape is "one visualiser per declared graph".

What is NOT covered by it, and is still this bean's:

- the **authored summary** (§2) and reuse-not-restate (§3) — a dashboard is an
  index, and §2 exists precisely to forbid shipping an index with no prose;
- the **"meaningfully populated" QA check** (§4b), which is about content
  rather than about routing;
- the **non-empty filter** (§4c) — a dashboard per declared graph does not by
  itself skip a graph that is declared and empty, which is the `dh4f` defect
  as a nav entry.

## Summary of Changes — first increment, 2026-09-20

**The handler exists and is exercised.** `cat-harness/scripts/gen-docs-auto.ts`
publishes at `<base>/<handler>/docs-auto/<auto-doc-type>/<sub-graph>/`, with
two real types: `index/skills` (220 items across 9 sub-graphs) and
`index/processes` (55 across 2). Registered in `package.json`
(`docs:auto`, `docs:auto:check`), in the render pipeline
(`needs: ["skill-docs", "bpmn"]`, non-fatal), and gated in CI.

### §6's guess was wrong, and here is the correction

The note added after merging main said docs-auto was *"probably a `kind`
handled by the generator that now exists, not a second one."* Reading the code
says otherwise, and the reason is structural rather than a matter of taste:
**every existing generator is one-axis** — one graph kind to one viewer at a
fixed route, plus subject pages. docs-auto is **two-axis**, type × sub-graph,
and there is nowhere in a one-axis generator to put the second axis.

What the guess got right is that no new ROUTING was needed.
`viewerPlacement(site, "<handler>/docs-auto/<type>", …)` is the owner's
`<base>/<handler>/<kind>/<subject>` rule with the type as a segment, and
`ankg`'s `orphanSubjectPages()` prunes it unchanged — no fourth pruner.

### The segment is the declared `id`, not `<path>`

The owner wrote `<path>`. This publishes under the declared entry's **id**,
for `state-visualizer`'s own reasons: `id` is what `harness.json` declares and
what an override matches on, so an id-derived URL survives the directory
moving. It also stays ONE segment, which is what lets the ankg pruner's
ownership test stay exact. Every page states its declared path, so the mapping
is on the artefact rather than only in the URL. **Flagged for the owner rather
than buried** — it is a deviation from the literal ask.

### Two defects the build found in itself

1. **1,522 skills against `knownSkills()`'s 219.** The first draft walked every
   declared directory, and `docs/` is declared — it holds a generated markdown
   rendering of every skill, so each was counted again. *A rendering of an
   artefact is not the artefact.* A type now names the graph kind its
   artefacts live in.
2. **227 against 219.** The second draft walked skill directories recursively,
   so `skills/<package>/<skill>/<page>.md` — a supporting page *inside* a
   skill — counted as a skill. `skillMdDirs()` already encodes that
   distinction, so the generator calls it. Two answers to "what is a skill" is
   one too many.

### §2 and §3 demonstrated rather than asserted

`every-workflow-in-the-repo.md` opened with a hand-maintained count that its
own text admitted had been wrong five times. **It was wrong again by sixteen** —
"thirty-nine" against fifty-five. The count is gone; the page now points at the
derived index and keeps the half that cannot be generated. That is
*"reuse assets in explain"* on the page that most needed it, and the historical
lesson is kept rather than deleted.

Bootstrap's three diagrams are correctly OUTSIDE the index —
`bootstrap/workflows/` is declared by `bootstrap/harness.json` and not
by the root, deliberately (bean `pve3`). Stated on the page so the absence
reads as a fact rather than a gap.

### Verified

76 gates (with a stubbed `python3` lacking pymupdf, which is what CI has);
`bun test` 4612 pass / 0 fail; 20 tests on the generator including both
historical counts as ratchets, the most-specific attribution rule, the
shared-prefix trap, and that `who-iris-skills` — the sparse case the owner
asked for — IS rendered while `who-iris` gets no *processes* page, because it
has none.

## Still open on this bean

- **§2's authored summary as a general obligation** — the rule is in the
  `docs-auto` skill and demonstrated once. It is not enforced.
- **§4(b) the "meaningfully populated" QA check** — not built. It is about
  content, not routing, and needs its own thinking.
- **§4(a) the per-harness docs landing page**, **§4(c) the navbar over
  harnesses with populated `docs/`**, and **§5 the KG viewer** — not built;
  see §6 on how much `state-visualizer` already answers.
- **Types declared and not built**: `glossary` (gated by `lqo9`'s roast),
  `index`, `index/bpmn`, `index/dmn`, `index/tasks`, `index/roles`. Absent
  rather than stubbed, on purpose.


---

## §4(a) done — 2026-09-21 (session_014HGPQoUnzXGqSspA8x6YyD)

`cat-harness/docs/cat-harness/index.md`, published at `<base>/cat-harness/`.
**That route had no index at all**: the directory held `docs-auto/`,
`library/` and `schemas/` and nothing above them, so a path that reads like a
section answered nothing.

**Written under §2 and §3, with both rules stated in the file** so the next
editor meets them:

- **Reference, never restate.** If a sentence could be produced by reading a
  generated page, it does not belong here. The page carries the model (actor /
  role / task / process / skill, and why each is not the one beside it), what a
  BPMN process *is* in this repository, what a lane means, and what is
  authored versus generated — then links the indexes for the enumeration.
- **No counts in prose.** The indexes are regenerated and carry live counts; a
  number typed on an authored page is wrong the next time somebody adds a
  diagram and nothing checks it. Measured in prep and deliberately NOT written
  down: 55 BPMN files, 54 processes, 22 named as a call target.

**One concept is derived rather than listed**, and it is the answer to "which
are the MAIN business processes": a process **no other diagram calls** is an
entry point; one named by a `callActivity` is a step inside a larger one, so
entering it directly means starting in the middle. Nothing marks this in the
file — it falls out of who calls whom, so it stays true as diagrams are added.
That is the same discipline as `recordsWork` and as the referrer kind in
`library-refs.ts`.

`nav_exclude: true` is deliberate: the left-hand navbar's structure is bean
`603s`, in flight in another session, and a nav entry here would collide with
the section model it is building.

### FINDING, found by checking the links rather than assuming

**`/cat-harness/docs-auto/` and `/cat-harness/docs-auto/index/` have no index
page either** — the same defect as `/cat-harness/`, one level down.
`gen-docs-auto.ts` writes an `index.html` per TYPE (`index/processes`,
`index/skills`) and nothing at the levels above them. The new page therefore
links the two leaves that exist and names `docs-auto` without a link, with a
comment saying why and that the link returns when the generator writes a
parent index at each level.

**Open, and the next piece of `06e3`:** `gen-docs-auto.ts` should write a
parent index at each level it publishes under. It is the same shape it already
has — an index listing what is below it — and until it exists, every link to a
docs-auto level above a leaf lands on a bare directory.

### Still open in this bean

- §4(b) the "meaningfully populated" QA check — now has a page to pass over,
  which it did not before.
- §4(c) the navbar over harnesses with a populated `docs/` — **blocked**: bean
  `603s` is in flight in another session on branch
  `claude/lhs-navbar-harness-folios-cqo9mu`, editing `harness-tiles.ts` and
  `nav_footer_custom.html`, which is exactly what §4(c) needs.
- §5 the KG viewer.
- The declared-but-unbuilt types: `glossary`, `index`, `index/bpmn`,
  `index/dmn`, `index/tasks`, `index/roles`.


## The docs-auto level pages — done, same session

The finding recorded above is fixed. `gen-docs-auto.ts` now writes an index at
**every level above a built type**, derived from the types actually built:
`/cat-harness/docs-auto/` and `/cat-harness/docs-auto/index/` had none, so any
link to them landed on a bare directory.

- **Derived, never listed.** The children of a level come from the built type
  ids by splitting on `/`. A type added to `TYPES` appears the day it builds; a
  level with nothing under it gets **no page at all** rather than an empty one,
  which is the same absent-rather-than-stubbed rule already on `TYPES` — an
  empty list and a complete list look identical.
- **Each level page names ITSELF** in the same `var SCOPE` line every other
  page here emits, so ownership is read off the file by the one pruner rather
  than assumed from the path. A level page that got this wrong would be
  unprunable forever and nothing else would say so.
- **The shared stylesheet was extracted** to `PAGE_CSS` rather than copied into
  the second renderer. Two copies of one stylesheet is two answers to what this
  looks like, and the copy nobody edits is the one a reader meets first.

§4(a)'s landing page gets its `docs-auto` link back, and the comment explaining
its absence is replaced by one recording why it was briefly missing.

5 tests added: every level has an index, each names itself, links are relative
(and never absolute from a base this generator does not know), an empty level
renders a stated absence, and a level counts a type's items while saying what a
nested level holds.


## §4(b) done — the "meaningfully populated" check — 2026-09-21

`cat-harness/scripts/check-docs-populated.ts`, registered as
`check:docs-populated` and gated in `code-quality-gates.yml`. Green for both
harnesses that declare a `docs` graph, so it gates from the first commit rather
than reddening the build on arrival.

**The adjective is what it measures.** A page counts only when it is AUTHORED —
nothing in its bytes says a generator wrote it — and carries at least 250 words
of PROSE, which excludes front matter, markup, code fences and any line that is
only a link. The threshold carries its basis rather than being tuned: §4(a)
asks a page to say what a process is for, when you would be in it and what it
is not; two or three of those plus a sentence on what the harness does is a few
hundred words, and below that the page is a title and a link list.

Measured: **cat-harness** ✓ `publication-workflow.md`, 8,199 words (76 authored,
261 generated). **who-iris** ✓ `kg-to-portal.html`, 1,496 words (9 authored).

### Three defects this found, two of them in itself

1. **It reported a clean pass over a sweep that looked at nothing.**
   `repoRootFor(process.cwd())` resolved to the repository's PARENT, so
   `instanceRootsIn` found one instance, no `docs` graph, and the check printed
   *"✓ every harness declaring docs has one"*. That is the CWD-vs-instance-root
   defect bean `a6kl` swept every gate for — committed by the gate written
   after it. Root now comes from `instanceRootFor(import.meta.dir)`, and **an
   empty harness list is exit 2**, because a sweep that found nothing has not
   cleared anything.
2. **A substring search for "generated" is wrong in both directions.** It marks
   `docs/getting-started.md` generated — an authored page that says an SVG is
   generated by `render:bpmn` — and misses `docs/publication-workflow.md`,
   which `gen-docs-pages.ts` writes. The markers are anchored now.
3. **`gen-docs-pages.ts` marks nothing it writes**, so its output is
   byte-indistinguishable from authored content. Nothing downstream can tell
   them apart, and this check does not pretend to: it is named in the module
   note as the fix belonging in that generator. **Open, and small:** a marker
   in what it writes, like every other generator here.

### Verified both ways

12 tests, and the one that matters is the falsifier the brief demanded: a page
that is a title plus a list of links comes out **thin**, and a generated page
never carries a harness however long it is. Plus: a declared directory that is
absent is `unknown` rather than thin (`dh4f`), an unreadable page is `unknown`,
and dot-prefixed directories are not searched.

The planted directories in the test are called `pages`, not `docs` — twice
deliberate. `site-dir-single-answer` refuses a hardcoded site root in any
source file and was right to fail the first draft; and a harness's docs
directory is whatever its DECLARATION names, so a check that only worked for
one called `docs` would be reading the name instead of the declaration.

Gates **83/83**.


### The `gen-docs-pages.ts` ambiguity is closed — same session

It now writes an HTML comment carrying the same phrase every other generator
here uses, naming the manifest directory to edit instead of the output. An HTML
comment because it must be invisible in the rendered page and present in the
source a reader opens on the forge; the same phrase because that is what lets
ONE reader recognise every generator rather than a list of spellings.

**It changed the answer, which is the point.** Before, `check:docs-populated`
credited cat-harness with `publication-workflow.md` — 8,199 words, and
generated. After: 65 authored rather than 76, and the evidence page is
`architecture/cat-harness-minimum.md`, 4,635 words, which somebody actually
wrote. The check was passing the harness on documentation nobody authored, and
neither the check nor anything else could have known.
