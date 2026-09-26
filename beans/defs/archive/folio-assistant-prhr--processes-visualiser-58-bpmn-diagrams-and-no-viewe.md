---
# folio-assistant-prhr
title: 'PROCESSES VISUALISER: 58 BPMN diagrams and no viewer — a searcher over lanes, skills, bean ops and methodology'
status: completed
type: task
priority: normal
created_at: 2026-09-21T22:01:44Z
updated_at: 2026-09-22T09:34:57Z
parent: folio-assistant-p5wm
---

## What — owner, 2026-09-21

> bean, we also need a processes/ visualization as it is controlled.... its
> basically a bpmn searcher tool or so. with various filters.

## THE TITLE SAYS 58 AND THE NUMBER IS 61

Not a typo worth quietly fixing — it is this repository's own rule catching
its author mid-sentence. `bpmn-processes` says *"Count the directory rather
than quoting a number from this paragraph."* I counted
`skills/workflows/**` and `methodologies/*/workflows/**`, got 58, wrote it
into the title, then widened the glob to include instance-level `*/workflows/`
and got **61**.

The title stands as the evidence. **Re-count before quoting either.**

## Why a viewer, and why this one is not optional

`workflows` is one of the 16 kinds with no visualiser (bean `yunp`), and it is
the one where absence costs most: these diagrams are **executable**.
`workflow_list` / `workflow_start` / `workflow_next` / `workflow_gate` /
`workflow_complete` run them, instances are committed under
`beans/workflows/`, and `workflow_complete` refuses a step that is not
enabled. A corpus that governs what agents may do, and no way for a person to
search it.

The owner's *"as it is controlled"* is the point: a controlled process whose
only index is a hand-maintained markdown page is controlled in name.

## The filters come from the corpus, not from taste

Measured across the 61 files, 2026-09-21:

| facet | distinct | note |
|---|---|---|
| **lane** | 89 | `Agent` (12), `CI/CD Pipeline` (9), `Work plan — beans` (9), `Ingestion Engine` (8), `BA / Feature Requestor` (7), `Stakeholders` (5) |
| **`folio:skill ref`** | 84 | every activity carries one — this is the join to the skills graph |
| **`folio:bean op`** | 3 | `note` 24, `claim` 17, `resolve` 8 |

So the useful searches are already implied by the markup:

- *"which processes does a **Stakeholder** appear in?"* — lane
- *"what runs **this skill**?"* — the reverse of `folio:skill ref`, which is
  the join nothing currently exposes and which `kg:audit` checks one criterion
  of
- *"which steps **claim** a bean?"* — bean op, and this is the audit trail for
  who reserves work
- *"which processes are **strict** vs advisory?"* — `bpmn-processes` names
  four steps no package may relax
- **methodology** — CRDM and RACI have their own `workflows/` directories, and
  an instance may add more

## What it is NOT

Not a re-render. `render:bpmn` already produces the SVGs and
`render:bpmn:check` fails if they are stale. This is an INDEX over them —
search, filter, and the joins — so it consumes generated art rather than
generating any.

And not a second answer to "where are we": workflow STATE lives in committed
instances under `beans/workflows/`. A viewer that displayed its own idea of
position would be a second store free to disagree with the first, which
`workflow-state` names explicitly.

## Done when

- [x] The count is re-measured from the directory, not taken from this bean or
      its title
- [x] A person can answer "what runs skill X" and "which processes have a
      Stakeholder lane" without opening a file
- [x] The viewer reads the committed instances for position and renders no
      position of its own
- [x] A process with no rendered SVG is reported as such rather than omitted —
      third state, same as everywhere else

## Built — `gen-processes-viz.ts`, and the count is 62

**Re-measured from the directory, as the first done-when demands.** The bean's
title said 58, its body said 61; both are wrong now and were wrong differently.
This page carries no number in prose — every figure on it is counted at
generation time, which is the only form of the rule that survives the corpus
moving.

| fact | bean | my first pass (regex) | parser |
|---|---|---|---|
| diagrams | 58 / 61 | 62 | **62** |
| distinct lanes | 89 | 93 | **96** |
| distinct skill refs | 84 | 85 | **85** |
| bean ops | 49 | **30** | **49** |

### Three defects, all mine, all during construction

**1. It swept nothing and called that success.** `workflowFiles` takes an
INSTANCE root; handed the repository root it returns `[]`. The first run printed
*"Wrote processes-index.md — 0 diagram(s)"* and exited 0, over a corpus of 62.
The `dh4f` shape, produced by the generator written to report it. Fixed at the
cause (iterate every instance declaration) **and** at the symptom (a vacuity
guard that refuses to write an index over nothing).

**2. It claimed a gap that was not there.** The SVG path was composed from each
`.bpmn`'s own location instead of the docs layer `render:bpmn` writes to, so it
reported **11 of 62** diagrams as unrendered — all 8 CRDM, all 3 bootstrap.
Every one of those SVGs exists, and `render:bpmn:check` was green throughout.
**A finding that contradicts a passing gate is a finding to verify, not to
publish**, and this repository paid for the same mistake in
`viewer-undiscovered.test.ts` the same week.

**3. It measured with a regex.** 30 bean ops found, 49 present. Two legal
markup variants missed: a `store=` attribute before `op=`, and attributes
wrapped onto the next line. `check:workflow-refs` already says *"the real parser
is the oracle for the generator's regex"* — measured again, on the generator
written to index the corpus that sentence is about. It now consumes
`loadProcessModel`, the same bpmn-moddle parse the engine runs.

### A third state the bean did not know about

**24 of 62 processes declare no `folio:policy`.** `loadProcessModel` reads an
undeclared policy as `strict`, which is right for the ENGINE and its comment
says why — *"a process that forgot to say is governed, not exempt"*. It is not
right for a reader: *somebody chose strict* and *nobody said, so the engine
assumed strict* are different facts. The page asks the FILE whether a policy is
declared — a presence check, not a second reading of its meaning — and reports
`declared` and `defaulted` in separate columns. The engine keeps one answer; the
reader gets its provenance.

### The finding the page surfaces that nothing else did

**31 activities across 19 diagrams carry no `<folio:skill ref>`.**
`bpmn-processes` requires one on every activity: without it an agent reaching
the step is told what it is called and not what to run. Not fixed here — 19
diagrams is its own change — but it is now visible instead of being a thing
nobody counted.

### Where the done-whens are answered

The checklist above is ticked in place rather than restated here.
`check:bean-bodies` calls a second `Done when` a **shadow-checklist**, and it is
right: two of them are two answers to "is this done", and the one a reader finds
first is not the one the bean has always carried. I appended one anyway, and the
gate caught it.

- **count re-measured** — the table at the top of this section; the page carries
  no number in prose.
- **"what runs skill X"** — the reverse `folio:skill` join, 85 skills.
  **"which processes have lane Y"** — the lane table, 96 distinct names.
- **renders no position of its own** — the index consumes generated SVGs and
  reads nothing from `beans/workflows/`; workflow state stays the one store.
- **no rendered SVG reported, not omitted** — and the **zero** case is stated
  too, because "all rendered" and "the check did not run" are different facts an
  absent section cannot tell apart.

## The tile pointed at the SOURCE file — `publishedHref`, second half

Checked on the deploy rather than assumed, which is the habit `10s1` bought
three pushes earlier by shipping a mark with nothing to style.

`harness.json` carried `href: "/processes-index.md"`. **Jekyll serves no `.md`**,
so that tile was a guaranteed 404 — `pb04`, a dead link being worse than no
link.

`publishedHref` already knew this. Its comment, written 2026-09-21 when
`fsh-guts` became the first markdown viewer, says: *"a tile pointing at
`/x/index.md` is a guaranteed 404 … the bug needed a markdown viewer to exist
before it could fire."* The fix then covered `index.md` — the DIRECTORY form —
and a viewer named anything else kept its extension. So the first markdown
viewer found half the bug, and the second one found the rest.

Two fixes, because either alone leaves a trap:

- **the function** now maps a named `.md` to `.html`, so the next page authored
  as `foo.md` cannot repeat this. Mapped rather than stripped, because that is
  what Jekyll does to a page which is not a directory index;
- **the page** moved to `cat-harness/docs/processes/index.md`, matching `tools/`
  and `fsh-guts/` exactly, so it serves at `/processes/`.

Pinned in `graph-tiles.test.ts`, including the direction that must NOT change:
`index.md` still reaches `/x/` rather than `/x/index.html`, because two
spellings of one page are two entries in a reader's history.

### Still unverified

The staging deploy in hand predates this push, so the rendered page has not been
inspected — only the href the data now carries and the route it composes to.
`bun run preview:site` finds no working Jekyll in this container.

## Incoming from the open PRs — two that bear on this directly

Read per the owner's standing ask: *"when working on a PR in a repo, watch all
open PRs for incoming insights ... can incoming content be used to simplify
code, exposition, proofs."* Both arrived at the same conclusion this bean
reached by accident.

### #876 — *"currency is not validity"*, and `processes:viz:check` is one of the 42

Its measurement: all 42 generated-artefact checks ask *would the generator write
something different from what is committed?* and **none** asks *does this
artefact work?* Its worked example is `library:viz:check` green while the page
it generated could not parse.

**`processes:viz:check` is exactly that shape** — a byte comparison, no
validation. And this bean has the matching incident from the other direction:
the index reported **11 of 62** diagrams as unrendered while `render:bpmn:check`
sat green beside it. Currency said yes; the claim was false.

One distinction worth handing back, because it changes what #876 is counting:
**the validity of this artefact IS asserted, in `processes-viz.test.ts`** —
every SVG it names exists, every gap it reports is real, the joins are complete.
That is a THIRD category beside "the check validates" and "nobody validates":
*validated, but not by the check*. A count that merges it with the second
over-reports the gap.

### #874 — the route for what could not be verified here

This bean twice recorded *"the rendered page has not been inspected;
`preview:site` finds no working Jekyll in this container"*. #874 solves it:
extract the publish ref with `git archive origin/gh-pages`, serve it over a
local static server, and drive a real Chromium at a fixed viewport with external
fetches blocked. The live URL being unreachable is not the same as the page
being uninspectable.

Not applied yet — the staging deploy in hand predates the push that added
`/processes/`. It is the route to use once it lands, and it retires the excuse.

#874 is also the same defect family as `10s1`'s mark-with-nothing-to-style: a
CSS rule inlined on **331** published pages for a class emitted on **0**. Three
instances of one shape in one day, across three agents.

## A SECOND false finding, same page, two hours later

The index's first version said *"31 activities carry no `<folio:skill ref>`.
`bpmn-processes` requires one on every activity"* and listed them under
Findings — where a reader goes to act.

**They are deliberate, and this repository had already settled it.** Beans
`luke` and `uuhu` worked the same corpus from **90** down to this remainder.
`luke`: *"coverage is deliberately NOT gated — a human sign-off step has no
skill."* `uuhu` added the call-activity exemption and recorded that its own
remainder *"are not gaps"* — four stakeholder sign-offs among them.

So the page was accusing 31 design decisions of being defects, in the section
a reader trusts most. Same shape as the 11 phantom unrendered SVGs, in the same
file, hours apart. **Both were found by checking the claim against what the
repository already knew, rather than by re-reading the code that produced it.**

### What it says now

A **census**, not a gap list, with the provenance:

- **10 call activities** — they delegate to a subprocess, where the skill is
  named. Naming it twice would be one fact in two places.
- **21 others, broken down by lane** — because the lane says whether a person,
  a pipeline or an agent performs the step, and only the last has a skill to
  run. `CI/CD Pipeline` 6, `Stakeholders` 4, `Contributor` 2, then singletons.
- **No verdict on which is a gap**, stated as the honest third state with its
  reason: telling a person's judgement step from an agent step somebody forgot
  needs the lane's actor KIND, and a free-text lane name does not carry it.
  `<folio:role ref>` is the join that would answer it, present on **4** of
  those **21**.

### And a third correction, inside the second

That last sentence first read *"present on **few of these** lanes"* — and the
ternary behind it was testing whether the lane had a NAME, a different question
with a different answer. A characterisation standing where a number belongs.

The guard against it then tripped on the page's own explanation of the mistake,
because that prose contains the phrase. It now asserts the CLAIM form —
`present on **` must be followed by a digit — rather than forbidding the words,
so the page can describe its own history without failing its own test.

## VERIFIED — the rendered page, at last (2026-09-22 09:38 canonical deploy)

Six commits carried the note *"the rendered page has not been inspected"*. It
has been now, and the route is #874's: `git archive origin/gh-pages` into a temp
dir, served statically, driven by a real Chromium at 1280x900 with **every
external fetch blocked**.

`/processes/index.html` landed on canonical at 09:38:50, in the deploy from
`2cb60226bd` (my merge's own deploy was cancelled by the following push to
main — concurrency working, not a fault).

| property | measured |
|---|---|
| tables render as tables | **6**, rows 4 / 86 / 97 / 4 / 3 / 13 |
| unrendered markdown (`^\|` rows) | **0** |
| tables overflowing their column | **0** |
| horizontal page scroll | none |
| heading anchors | **8, all distinct** — no `gjli` duplicate |
| failed requests | **0** |
| reachable from a tile | **yes** — 49 tiles, one resolving to `/processes/` |

The last row is the one that mattered most and could not be checked any other
way: `prhr` exists so a person can FIND these diagrams, and a viewer nobody can
reach is the gap the page itself reports about other graphs.

### Two things measured and NOT reported as defects

**Twelve 404s on the first run** — `/folio-assistant/assets/css/...` and friends.
That was MY HARNESS: the site is served under a `/folio-assistant/` baseurl and
I had served the tree at `/`. Re-served under the prefix: zero failures. #874's
author hit the same class (*"blank artwork in my screenshots was my harness"*),
which is why the check was to identify each URL rather than to count them.

**The body background is identical in light and dark** — `rgb(39, 38, 43)` under
both, with `prefers-color-scheme` correctly emulated and no `data-theme`
attribute set. The control settles it: `/processes/`, the pre-existing `/tools/`
and the site ROOT all behave the same, and `themes.css` carries **0**
`prefers-color-scheme` blocks (`docs-ui.css` has 5, for specific components).
Site-wide, pre-existing, untouched by this work, and almost certainly deliberate.
Recorded as a measurement, not filed as a finding.

### `readOnlyTiles: 0`, exactly as documented

The graph-tile surface carries no `readOnly` in this repository — the same fact
bean `10s1` records, now confirmed on a deployed page rather than in the data.
The read-only state reaches a reader through the harness FINDING instead.
