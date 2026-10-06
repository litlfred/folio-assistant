---
title: "Auto-docs as rendered sub-graphs"
kind: proposal
summary: >-
  Proposed 2026-10-03: 488 of the 908 pages under cat-harness/docs/ declare
  their generator in their own front matter, yet eleven merge-conflict patterns
  rediscover that fact by hand-maintained glob, 42 files are covered by none of
  them, one pattern id covers two generators, and the `docs` declaration itself
  admits the mixture without recording it. The arrow already exists in prose —
  `uml`'s declaration says "the rendered pages are docs/uml/overview/". The
  proposal is to declare that arrow structurally, so the merge pattern, the
  audit coverage and the gating decision all derive from one fact instead of
  eleven globs. Measurement and options; nothing is built, and the two
  questions that are the owner's are named rather than answered. SUPERSEDED
  the same day: the owner ruled for a reserved `auto-docs/` prefix with `docs/`
  kept for authored content, which is the option this page argued against — see
  §"SUPERSEDED" for why that recommendation was wrong (permalinks already
  decouple URL from path, so no published URL need break; and the namespace
  argument was never weighed) and for the measured migration cost. Includes the
  consolidation the same declaration would allow — 16 writers into docs/, 31
  hand-written --check branches, 11 merge globs and 13 skill sections — with
  what must NOT consolidate (the per-writer carry-forward judgement, and the
  gated/ungated split, which turns on input set rather than generated-ness)
  and a three-step sequencing whose middle step is provably a no-op.
---

# Auto-docs as rendered sub-graphs

## SUPERSEDED, same day — the owner ruled for relocation

**Owner, 2026-10-03:** *"we need to fixup IRIs and paths … reserve `docs/` for
user generated content, `auto-docs/` for glossary and such. otherwise we will
have an issue."*

That is option C, which the §"Options" section below **recommends against**.
The ruling stands and the recommendation was wrong. The sections after this one
are kept rather than rewritten, because their measurements are still the
evidence and their reasoning was right for the question it answered — but read
this first.

### Why the recommendation was wrong

Two errors, one of them an omission.

**I priced the URL churn without checking the mechanism that removes it.** The
objection to C was that the 17 `gen-docs-pages.ts` pages "carry `permalink`"
and moving them breaks reader-facing URLs. Measured properly: of the **488**
generated pages, exactly **10** carry an explicit `permalink:`, and all ten are
the glossary pages, which already pin their URL to `/glossary/…` **independent
of file location**. So moving `docs/glossary/` → `auto-docs/glossary/` changes
no URL at all. For the rest, `permalink:` is the same mechanism, available
wherever an old URL must persist. **The published surface can be held byte-fixed
while every file moves**, and that was checkable before the recommendation was
written.

**I never weighed the namespace argument, which is the owner's actual reason.**
"Otherwise we will have an issue" is about `docs/` being one namespace holding
two kinds of thing. A declaration-keyed scheme (option A) records *which*
pages are generated; it does not stop an authored page and a generated page
contending for one path, and it leaves every IRI, `site_path` and
`visualiserHref` minted over a prefix whose contents are half authored. A
reserved prefix makes the distinction true of the **path**, which is what every
consumer already keys on.

### What the migration actually costs — measured, not estimated

Published IRIs are **not** at risk, which is worth stating because it is the
thing the ruling names first. The SKOS exports mint
`https://litlfred.github.io/cat-harness/0.1.0/ns#glossary/<ledger>/<local>` —
no filesystem path appears in any `@id` (the `docssite` that looks like one is
the `docs-site.yml` **process** id). Moving files rots no minted IRI.

The cost is in-repo references, split by whether the referrer is itself
regenerated — because those are fixed for free:

| path | generated referrers | **authored referrers** |
|---|---|---|
| `docs/reference/` | 7 | **92** |
| `docs/publication-workflow` | 89 | **38** |
| `docs/glossary/` | 3 | **23** |
| `docs/uml/` | 6 | **20** |
| `docs/lsi/` | 5 | **11** |
| `docs/harness.md` | 0 | **0** |

So ~**184** authored references, concentrated in `docs/reference/` rather than
in the page I had assumed (`publication-workflow`, whose 127 referrers are 89
generated). And the rewrite is **gate-verified rather than hoped**:
`readme:audit`, `check:anchor-names`, `check-workflow-refs` and
`check:reference-direction` all resolve links, so a missed reference fails a
check instead of shipping a 404.

### Owner rulings, 2026-10-03 — the three open questions are now closed

> *"auto-docs is one declared subgraph, with declared sub-sub-graphs per writer."*
> *"not sure all that is in assets, but what is not user content goes to auto-docs."*
> *"it is `derived-content` graph typology."*

**1. One graph, sub-sub-graphs per writer.** Settles the question §"What the
ruling does not settle" left open, and in the direction the consolidation
section argued: the per-writer split is where `rendersTo` lives, so each writer
owns its own sub-entry and the single `auto-docs/` entry is what a consumer
scans. Nothing above needs changing — it becomes the spec.

**2. The layer is the EXISTING `derived`, and no new kind is needed.** `holds`
already has **four** values, not three: `content`, `context`, `state` and
`derived`, the last added 2026-09-20 for `library/` (bean `hqku`), and
`isDerived` is already in `schemas/cat-harness.ts`. So `derived-content` names
a layer that exists — which saves adding one.

The precedent transfers **verbatim**, which is the strongest argument available
for the ruling:

- **`context` is ruled out** by its own rule — *"a step that writes to it is a
  defect, not an update"* — and sixteen declared generators write these pages.
  Choosing `context` would make every one of them a defect by this axis's rule.
- **`content` is ruled out** by the sweep rule: *a QA finding against a derived
  section is a finding against its **generator***, so a sweep that judges an
  auto-doc page sends a reviewer to the wrong file. Exactly the `library/`
  argument with "page" for "section".
- And what `derived` buys is exactly what is wanted here: `walkBlocks` skips a
  directory whose declared graphs are all non-`content`, so `auto-docs/` leaves
  the sweep **with no directory name hardcoded anywhere** — which is the thing
  a reserved prefix would otherwise tempt somebody to hardcode.

**3. `assets/` splits — it does not move wholesale, and that is measured.**
"What is not user content goes to auto-docs" is the rule; applying it to
`docs/assets/` (≈608 files) leaves a residue:

| under `docs/assets/` | files | disposition |
|---|---|---|
| `img/` (BPMN + UML renders) | 397 | derived → `auto-docs/` |
| `library/`, `glossary/`, `prov/`, `qa/`, `beans/`, `todos/`, `schemas/`, `folio/`, `harness/`, `translation-status/`, `voices/` — the `site-data` JSON and SKOS exports | ≈199 | derived → `auto-docs/` |
| `css/avatars.css`, `css/docs-ui.css`, `css/themes.css` | 3 | derived (carry a generated marker) → `auto-docs/` |
| **`css/narrow-viewport.css`, `css/uml.css`, `css/work-plan.css`, `js/docs-ui.js`, `js/kg-render.js`, `js/work-plan.js`** | **6** | **authored — carry no generated marker** |
| `js/vendor/` | — | third-party |

**So yes, `assets/` is still needed, and it shrinks to about six files plus
vendor.** Worth flagging before that residue is filed under either prefix: it
is **not documentation at all**. It is site chrome — stylesheets and
client-side code the theme needs — so it is neither "user generated content"
(`docs/`) nor derived from any graph (`auto-docs/`). A third home may be the
honest answer, and that is a question rather than a recommendation, because the
rule as stated routes it to `auto-docs/` where a regeneration would overwrite
hand-written code.

### Why `assets/` is its own directory, and whether it can split

Asked 2026-10-03: *"why is assets/ its own sub-dir? can it be under auto-docs?
split there and docs?"*

**It is not a content category. It is a Jekyll URL namespace.** The theme
fetches `assets/css/…`, `assets/js/…` and `assets/<graph>/index.json` by URL,
and those URLs are hardcoded **27 times** in files this repo controls —
`docs/_includes/head_custom.html` alone carries 24, plus `_config.yml` (2) and
`footer_custom.html` (1). CSS and JS have no front matter, so `permalink:`
cannot hold their URL the way it holds the glossary pages'; Jekyll serves a
static file at its path.

**So yes, it can split, and splitting it is better than the third home floated
above** — the six authored chrome files go with `docs/`, the ~600 derived ones
with `auto-docs/`, and no new prefix is needed. The 27 references are ours to
update and a gate resolves them.

**With one exception, and it is large enough to decide the shape.**

| | |
|---|---|
| absolute `https://litlfred.github.io/…/assets/…` URLs cited **inside the corpus** | **13,214** |
| files carrying one | **6,861** |
| asset families they point at | **one** — `assets/library/` |

Every one is `assets/library/`. That family is a **published linked-data
interface**, not merely a file path: the library JSON-LD manifests are cited by
absolute URL (`…/assets/library/jsonld/cat-harness/<slug>/manifest.jsonld`), and
`.jsonld` has no front matter, so nothing can preserve the URL while the file
moves.

So the honest split is three ways, not two:

- `assets/css/{narrow-viewport,uml,work-plan}.css`, `assets/js/{docs-ui,kg-render,work-plan}.js`, `assets/js/vendor/` → **authored, with `docs/`**
- `assets/img/`, `assets/glossary/`, `assets/prov/`, and the `*/index.json`
  site-data (≈200 files) → **derived, to `auto-docs/`**. Checked: the SKOS
  exports do **not** cite their own URL (`skos:notation` and `dcterms:source`
  are repo-relative), so these move freely.
- `assets/library/` → **derived, but URL-frozen.** Either it stays where it is,
  or the move is a 13,214-citation rewrite that also 404s any external
  resolver. **That is a decision, not a detail**, and it is the one place where
  "what is not user content goes to auto-docs" has a cost worth naming before
  it is applied.

A fourth option exists and is cheaper than either: move the file and serve the
old URL, which for a static path means a redirect or a published alias rather
than a `permalink`. Whether this site can do that is unmeasured, and it would
settle the `library/` case without the rewrite.

### There are already two `classify()`s, and one knows what the other guesses

Found 2026-10-03 by this proposal's own PR going red — the surest kind of
evidence, since the gate found it rather than a reading did.

| module | signature | answers |
|---|---|---|
| `scripts/check-docs-populated.ts` | `classify(path, text): "authored" \| "generated"` | **is this page generated?** Read off the file's bytes. |
| `scripts/merge-conflict-patterns.ts` | `classify(path): Classified` | **how do I merge this?** Re-derives generated-ness by glob. |

Two exported functions of the same name, in one directory. The first is
imported by `gen-docs-auto.ts` and `instance-rules.ts`; the docs-auto index's
own comment says it is imported *"rather than re-derived"* because owning the
question once was learned the hard way — a substring search for "generated by"
had marked `docs/getting-started.md` generated for *describing* an SVG as
generated. **The second never calls it.** Eleven hand-maintained globs sit where
one call would.

So the consolidation has a cheaper first move than anything above: have the
merge resolver ask the classifier that already exists.

**One real obstacle, stated rather than waved past.** During a conflict the
file on disk IS the conflicted file, so `classify(path, text)` cannot be handed
the working-tree bytes — the §D objection. But a merge resolver holds all three
stages, and `git show :1:<path>` / `:2:` / `:3:` gives it the base's or either
side's bytes. Classifying the BASE blob answers "was this page generated before
either of us touched it", which is the question the strategy actually turns on.
**Feasible, not proven** — nobody has run it, and it is a route for step 2
rather than a result.

### What the ruling does not settle, and should not be guessed

- **Which 488 move, and whether `docs/assets/` goes with them.** `docs/assets/`
  holds the SKOS exports and `site-data` JSON — generated, but fetched by the
  site at paths the viewers compose. "Glossary and such" plainly covers
  `glossary/`, `lsi/`, `reference/`, `uml/`; `assets/` is the boundary case.
- **Whether `auto-docs/` is one declared graph or one per writer.** The
  consolidation section argues for per-source `rendersTo`; a reserved prefix is
  compatible with either, and it is the second half of the question, not an
  answer to it.
- **The graph typology.** Still the question `content-context-and-state-graphs.md`
  says one question settles, still the owner's.

The three-step sequencing in §"Consolidating" is unchanged and now matters more:
**step 2's before/after verdict diff over all 908 pages is what proves a move
changed no resolution**, and it is the only cheap guard against a 184-reference
rewrite going quietly wrong.


## The one-sentence version

**A generated page already says which generator wrote it, in its own front
matter — and every consumer that needs to know re-derives it by glob instead.**

## What was measured

`cat-harness/docs/`, 2026-10-03, against `main` `f239953db6`. Counted by
reading each file's first six lines for a `generated:` key, not by pattern.

| | files |
|---|---|
| all files under `cat-harness/docs/` | 1050 |
| `.md` + `.html` (the rendered surface) | 908 |
| **declaring a generator in front matter** | **488** |
| authored | 420 |

Six generators write those 488:

| generator | files | merge pattern that catches them |
|---|---|---|
| `scripts/gen-skill-docs.ts` | 305 | `skill-instructions` |
| `scripts/gen-uml-overview.ts` | 126 | `uml` |
| `scripts/gen-schema-docs.ts` | 24 | **— none — → `refuse`** |
| `scripts/gen-docs-pages.ts` | 17 | **— none — → `refuse`** |
| `folio-assistant-core/scripts/glossary-page.ts` | 15 | `glossary` ×10, `translated-glossary` ×5 |
| `cat-harness/scripts/gen-upload-step-docs.ts` | 1 | **— none — → `refuse`** |

**42 of 488 generated pages classify `refuse`**, which means `merge:main` hands
them back for hand-editing — the one thing each of their own front matters
forbids (`generated: … — do not hand-edit`). Found the hard way: of PR #1888's
55 conflicts, 53 resolved by pattern and the 2 that refused were
`docs/publication-workflow.md` and its authored source.

Where the 42 are: `docs/reference/skills/` (24), `docs/` top level (13),
`docs/guides/` (4), `docs/reference/upload-step/index.md` (1).

## The shape of the problem is not "a missing pattern"

Filing the 17 as a gap (bean `8c6v`, PR #1965) is correct and small. But the
same measurement shows three further facts that a fourth pattern does not
touch.

**1. Eleven patterns hand-maintain globs over one directory.** In `PATTERNS`
order: `docs-auto`, `glossary`, `translated-glossary`, `viewer-pages`,
`viewer-namespace`, `navbar-include`, `handler-index`, `skos-glossary-export`,
`skill-instructions`, `site-data`, plus `uml`. Two of them enumerate directory
names *literally* —

```
cat-harness/docs/{beans,todos,health,issue-marks,swimlane-glossary,uploads}/index.html
cat-harness/docs/cat-harness/{catalogue,folio,library,schemas,uploads,voices}/**
```

— so adding a graph with a viewer means remembering to extend a brace list in
a merge script. Nothing fails if you forget; the page just starts refusing.

**2. One pattern id covers two generators, and is named for one of them.**
`glossary`'s globs are `cat-harness/docs/glossary/**` **and**
`cat-harness/docs/lsi/**`. The LSI pages are not the glossary and are written
by a different generator. A reader of the pattern list cannot see that, and a
reader looking for "what covers the LSI pages" finds nothing under that name.

**3. `docs/` is declared as a single graph whose own description admits the
mixture.** From `cat-harness/cat-harness.json`:

> "Documentation about the Knowledge Graph itself: the pages of the published
> site, **some written by people and some generated from the graph**."

The declaration states the mixture and records nothing that distinguishes the
two halves. So `audit:coverage` cannot tell a never-audited authored page from
a generated projection that is audited at its source, and every other
declaration-driven consumer scans `docs/` as one undifferentiated thing.

## The arrow already exists — in prose, in one declaration

`uml` is declared as its own graph, `uml/`, and its description says:

> "nothing here is authored. **The rendered pages are `docs/uml/overview/`**"

`swimlane-glossary` is the same shape: the graph is `glossary/` (the retirement
ledger) and its rendered pages are `docs/glossary/`.

So the relation *source graph → rendered pages* is a fact the corpus already
knows. It is written once, in English, in one entry's `description`, where no
consumer can read it. Everything in this proposal is making that one arrow
structural.

It is the same arrow the board skills already draw for a different pair —
`folio → board → position → note`, *"the folio carries what is true, the layout
layer carries where it was drawn … and never back."* A rendered page is where a
graph was drawn.

## Options

Costs first, because one of these is reader-facing and the others are not.

### A. `rendersTo` on the source graph (recommended)

The source graph's entry names where its pages land:

```jsonc
{ "id": "uml", "path": "uml/", "graphTypologies": ["uml"],
  "rendersTo": [{ "path": "docs/uml/overview/", "writer": "scripts/gen-uml-overview.ts" }] }
```

- **Nothing moves.** No URL changes, no `permalink` churn, no redirects.
- One declared fact replaces eleven globs: the merge pattern, the audit's
  per-kind coverage and the gate decision all read it.
- It puts the fact next to the thing that owns it — the generator's graph —
  which is where `uml` already put it in prose.
- A generator with no source graph of its own (`gen-docs-pages.ts` renders
  `content/docs/`) needs that directory declared, which it is not today. **That
  is this option's real work**, and it is the honest one to surface: the arrow
  can only be declared from a node that exists.

### B. Sub-entries under `docs/`

Split the one `docs` entry into `docs-authored` and one entry per generated
tree.

- Also no file movement, and it makes the split visible in the place a reader
  of `docs/` looks first.
- But it puts the fact on the *destination*, so each entry has to name its
  writer anyway, and a generated page outside a clean tree — the **13 loose
  `*.md` at `docs/` top level and 4 of 10 in `docs/guides/`** — has no
  directory to be an entry for. Those are the files that make a
  destination-keyed scheme need a per-file list.

### C. Relocate generated pages under one prefix

Move the loose ones into `docs/generated/` so the split is a path.

- Cleanest to read; and the only option that **breaks URLs**. The 17
  `gen-docs-pages.ts` pages carry `permalink` and `nav_order`, and
  `docs/publication-workflow.md` is linked from `AGENTS.md` and from the
  published site. Not worth it on this evidence.

### D. Derive it from the front matter at runtime

No declaration: have the merge resolver and the audit read each file's
`generated:` key.

- Zero maintenance and no drift — the fact is already in the file.
- But it reads the working tree to decide a *merge* strategy, and during a
  conflict the file on disk is the conflicted file. It also cannot answer
  "which pages does graph X render?" without scanning all 908. Useful as a
  **check** that A's declarations stay complete, not as the mechanism.

**Recommendation: A, with D as its gate** — declare the arrow on the source
graph, and add a check that every file carrying a `generated:` key is covered
by some declared `rendersTo`. That check is what makes the declaration binding,
exactly as `skill:register:check` does for a skill's derived artefacts.

## Consolidating the tooling and the skills

Asked for alongside the layout, 2026-10-03, and it is the same fact seen from
the other end: **eleven globs, sixteen writers and thirteen skill sections all
encode "this page is generated", and none of them is the declaration.**

Measured on `f239953db6`:

| surface | count | what it repeats |
|---|---|---|
| `cat-harness/scripts/gen-*.ts` | 32 | — |
| …of those, writing into `cat-harness/docs/` | **16** | each decides its own output path |
| …of those, the `gen-*-viz.ts` viewer-page family | **12** | one page per declared graph, same shape each time |
| scripts carrying a `--check` / `CHECK_ONLY` branch | **31** | compare-or-write, hand-written 31 times |
| `package.json` docs script pairs (`X` + `X:check`) | **13** | `docs:auto`, `docs:pages`, `uml:overview`, `glossary:page`, `lsi:viz`, `readme:subgraphs`, … |
| merge patterns whose globs name `docs/` | **11** | the same "generated, take base" judgement |
| skill files documenting these generators | **13** | across 7 packages (`ui`, `kg/kg-core`, `kg/graph-management`, `kg/kg-navigation`, `process`, `library`, `sdlc`, `folio-core`) |

### What consolidates, and what must not

**The `--check` branch should be one function, not 31.** Every one of them is
the same three states — absent, differing, identical — and
`gen-docs-pages.ts`'s is the only one that distinguishes a fourth
(`verdict`: existence gated, contents reported). That fourth state is the
interesting one and it is invisible in the other 30, which means they cannot
express "this moved for a legitimate reason" and so either gate a live
measurement or gate nothing. A shared `emit(path, content, kind)` makes the
distinction available everywhere instead of once.

**The 12 `gen-*-viz.ts` are one generator over a declaration, not 12
generators.** Each renders one page for one declared graph. If `rendersTo`
exists, the viewer page is a function of the declaration, and the 12 become one
writer plus 12 rows — which is also what removes the two hand-maintained brace
lists in `viewer-pages` and `viewer-namespace`.

**Thirteen skill sections consolidate to one plus pointers.** They currently
restate "generated, do not hand-edit, run X" in seven packages. `AGENTS.md`'s
own banner says what that costs: *"a rule stated in two places is a rule free to
drift, and the copy a reader finds first is the one with no test."* The home is
`kg/kg-core/` beside `directory-conventions.md`, because the subject is the
declaration; the others keep a pointer, as `where-does-this-go` does for the
nine placement questions.

**What must NOT consolidate** — and this is the part a tidy-up gets wrong:

- **The per-writer carry-forward judgement.** `glossary-export.ts` carries a
  term's earlier names forward into `skos:hiddenLabel`, so its **ledger** is
  refused while its generated tree is `take-base`. One shared pattern that
  assumed "generated ⇒ take-base" would drop a term's history silently. The
  carry-forward test stays per writer; only its *recording* consolidates.
- **The gated/not-gated split.** `library:viz:check` and `schema:viz:check` are
  deliberately ungated (owner, 2026-09-20) because they derive from the whole
  repository, so a red means somebody else merged. The voices projection *is*
  gated because it derives from declared directories, so its red is always the
  author's. **Input set, not generated-ness** — that is the test, and it is a
  property of each writer, not of the family.

### The sequencing that makes this safe

1. Declare `rendersTo` (option A) and add the front-matter completeness check
   (option D as a gate). Nothing moves; nothing is deleted.
2. Derive the merge patterns from the declaration, keeping each writer's
   existing strategy verbatim — so step 2 is provably a no-op, testable by
   classifying all 908 pages before and after and diffing the verdicts.
3. Only then consolidate writers and skills, with the 42 currently-uncovered
   files picked up as part of step 2 rather than as a fourth hand-written
   pattern.

Step 2's before/after diff is the whole safety argument: a consolidation that
cannot be shown to change no verdict is a rewrite.

## What this does not claim

- **Not a graph-typology ruling.** Whether a rendered page tree is `content`
  (a process produces it), `context` (read, never written) or `state` is the
  question `content-context-and-state-graphs.md` says one question settles, and
  it is the owner's. A projection whose source of truth is another graph may not
  fit the three cleanly, and that is worth saying before a kind is picked.
- **Not a claim that `take-base` is safe for all 42.** `8rff`'s discipline is
  *read the writer first*: `glossary-export.ts` looked whole-file-written and in
  fact carries a term's earlier names forward into `skos:hiddenLabel`, which is
  why the glossary **ledger** stays refused while the generated tree is
  `take-base`. `gen-docs-pages.ts` has been read and passes (its `emit()` is
  compare-or-write, and its only read of prior output is inside the `--check`
  branch). **`gen-schema-docs.ts` and `gen-upload-step-docs.ts` have not been
  read**, so their 25 files are not cleared here.
- **Not a count to quote.** Every number above is a measurement on
  `f239953db6` and moves with the corpus. The commands are in the next section
  so the next reader re-measures rather than cites this page.

## How to re-measure

```sh
# generated vs authored across the rendered surface
for f in $(find cat-harness/docs -type f \( -name '*.md' -o -name '*.html' \)); do
  head -6 "$f" | grep -q '^generated:' && echo GEN || echo AUTH
done | sort | uniq -c

# which generator, and how many pages each writes
grep -rh '^generated:' cat-harness/docs/ | sort | uniq -c | sort -rn

# which of them no merge pattern covers
#   (classify() from cat-harness/scripts/merge-conflict-patterns.ts)
```

## Related

- bean `8c6v`, PR #1965 — the 17 `gen-docs-pages.ts` pages as a pattern gap.
  This proposal is why a fourth pattern is a patch rather than the fix.
- bean `8rff`, merged in #1943 — the three families before these, and the
  carry-forward discipline every row above is held to.
- bean `ba9e` — generated README counts, the other chronically-conflicting
  generated family.
- `skills/kg/kg-core/audit-coverage.md` — the per-kind coverage this would let
  distinguish generated projections from authored pages.
- `skills/kg/kg-core/content-context-and-state-graphs.md` — where the graph-typology
  question above is settled.
