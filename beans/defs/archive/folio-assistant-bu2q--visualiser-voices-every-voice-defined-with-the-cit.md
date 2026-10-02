---
# folio-assistant-bu2q
title: 'VISUALISER: voices/ — every voice defined, with the citation each rule carries'
status: completed
type: task
priority: high
created_at: 2026-09-21T18:26:22Z
updated_at: 2026-09-21T18:47:51Z
parent: folio-assistant-yj32
---

Owner, 2026-09-21: 'since cat-harness delcares voices/ dir it needs to add
visualier (followin SOPs on director visualizers in the docs.) shoulld show
list of voices defined.'

One correction to the premise, because it changes who owns the work rather
than whether it is owed: `cat-harness` no longer declares `voices/`. All four
voices moved to `<instance>/skills/voices/` earlier the same day (btuv, PR
#773), so the declarations are now `who-style-guide`, `folio-assistant-sci`
and `agent-skills`.

## Measured, 2026-09-21

- **Three declarations carry a `voices` graph and NONE has a `coverage`
  block.** `who-style-guide.json`, `folio-assistant-sci.json` and
  `agent-skills.json`. The `library` entry in the same sci declaration does
  have one, so this is a gap rather than a convention.
- **Two of those three entries were written an hour before this bean**, by the
  same session, without coverage. This is the defect being recorded against
  its own author.
- **`agent-skills/voices/` does not exist on disk** — 26tu confirmed rather
  than suspected.
- **`DEFAULT_DIRECTORIES` still points the conventional `voices` entry at
  `voices/`** (`schemas/cat-harness.ts:2224`), not `skills/voices/`. The move
  made the convention stale, and an instance inheriting the default now
  declares a directory that will not be there.
- **`check:subgraph-coverage` does NOT fire `visualiser` on `voices`** — it
  fires `serialisations` three times and nothing else. `owesVisualiser`
  returns false for a `content` kind and `voices` is `content`. So this
  viewer is a COURTESY the rule does not demand, exactly as `library/` was
  (jbx2), and the bean should not pretend the axis asked for it.

## Why it is worth building anyway

The subsystem's whole claim is that a voice is **auditable rather than
asserted** — `check-voices.ts` exists because PR #210 shipped ten plausible
rules with `source: null`. Every rule now carries the page and quote it was
read from, and **nobody can read those citations without opening JSON.** A
viewer is what turns the claim into something a reader can check.

## How

The pattern is settled by three precedents — `library:viz`, `schema:viz`,
`state:visualizer`: a `<graph>:graph` projection, a `gen-<graph>-viz.ts` page,
and a `--check`. Read the voices through the DECLARED graph, never a
hardcoded path.

## Done when

- [ ] a page lists every voice in every instance that declares one, with its
      rules, its `overlaySeverity`, and each rule's citation
- [ ] it finds voices through the declaration, not a hardcoded `skills/voices/`
- [ ] all three declarations carry `coverage` — visualiser, docs, skill
- [ ] `DEFAULT_DIRECTORIES` points at the path voices actually live at, or
      says in a comment why it does not
- [ ] a `--check` gate, wired into the gate set, so the page cannot go stale

## Not in scope

`serialisations`. 88 of the 156 `check:subgraph-coverage` findings are
'no serialisations declared' and NOTHING in this repository satisfies it yet,
so it is a repo-wide obligation rather than this bean's.


## 2026-09-21 — built, and the coverage count fell 156 → 147

`scripts/voices-graph.ts` (reader) + `scripts/gen-voices-viz.ts` (projection +
viewer), the same three pieces as `library:viz` and `schema:viz`. Published at
`/cat-harness/voices/`, with a subject page per instance that ships a voice.
Scripts: `voices:graph`, `voices:viz`, `voices:viz:check`.

**Measured through the page, in a browser**: 4 voices, 37 rules, 36 citing an
ingested source, 1 citing a KG node, 9 with a mechanical half. Filtering,
expanding and the citation blockquotes all work; no console errors.

### Every `## Done when` box

- [x] a page lists every voice in every instance that declares one, with its
      rules, its `overlaySeverity`, and each rule's citation
- [x] it finds voices through the declaration, not a hardcoded path —
      `directoriesForGraph(root, "voices")` across every instance
- [x] all three declarations carry `coverage` — visualiser, docs, skill.
      `check:subgraph-coverage` 156 → **147**; the nine that cleared are
      3 directories x 3 criteria. Only `serialisations` remains, which is the
      repo-wide gap this bean excluded.
- [x] `DEFAULT_DIRECTORIES` points at `skills/voices/`
- [x] a `--check` gate, in the gate set

### Two things found while building it

**The conventional default disagreed with the fallback for a day.**
`DEFAULT_DIRECTORIES` said `voices/` while `VOICES_DIR` said `skills/voices`.
It was harmless only BY ACCIDENT — `resolveDirectories` drops an entry whose
directory is absent, so an undeclared instance fell through to the fallback.
An accident is not a mechanism. Fixed, with `LEGACY_VOICES_DIR` still probed,
because an upgrade must not make a downstream folio's voices disappear
silently: that is indistinguishable from having none.

**This gate is NOT exempt, and its siblings are.** `schema:viz:check` and
`library:viz:check` are deliberately ungated (owner, 2026-09-20) because both
projections derive from the WHOLE repository, so a red means somebody else
merged. The voices projection derives from the declared voices directories
alone, so a red means a voice changed and the page was not regenerated — an
omission by the author of the diff, which is the standard the exemption is
measured against. Gated on that difference, and the reason is written at both
the gate and the exemption list.

### Falsified

Two mutations, each caught by `scripts/tests/voices-viz.test.ts`: dropping
absent directories from the reader (the `dh4f` defect) fails 1 test, and
deriving the overlay severity from the worst rule instead of reading the
declared field fails 1. 96/96 gates pass.
