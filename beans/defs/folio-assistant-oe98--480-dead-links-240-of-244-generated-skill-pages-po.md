---
# folio-assistant-oe98
title: '480 dead links: 240 of 244 generated skill pages point ''Edit this page''s source'' at a path that does not exist'
status: in-progress
type: task
priority: normal
created_at: 2026-09-22T12:09:09Z
updated_at: 2026-09-23T16:49:03Z
parent: folio-assistant-1swy
---

Found 2026-09-22 while checking that a NEW skill page rendered. The new page was fine; it had simply joined 239 others carrying the same defect.

## Measured

```
generated skill pages with a source link : 244
  ... whose path does NOT resolve        : 240  (98%)
  ... dead links (2 per page)            : 480
```

Two links per page — *"Generated from [`…`]"* and *"✎ Edit this page's source"* — both composed in `gen-skill-docs.ts` from `group.repoPrefix`:

```ts
const sourceUrl = `https://github.com/litlfred/folio-assistant/blob/main/${group.repoPrefix}/${file}`;
const editUrl   = `https://github.com/litlfred/folio-assistant/edit/main/${group.repoPrefix}/${file}`;
```

**Two distinct causes**, and the second is worse than the first:

| pages | prefix | why it fails |
|---|---|---|
| 231 | `skills/folio-core`, `skills/workflow`, `methodologies/crdm`, … | missing the `cat-harness/` prefix — the pre-split path. There is no `skills/` at the repo root |
| 9 | `../bootstrap/skills`, `../who-iris/skills`, `../large-datasets/skills`, `../kg-navigation/skills`, `../bootstrap/tools` | **contains `..`** — a GitHub blob URL cannot have a parent segment. These were never going to resolve in any layout |

Only **4** pages link correctly: 3 under `.claude/skills/local` and 1 under `bootstrap`.

## Why nothing caught it

`docs:auto:check` and the skill-doc generator's own `--check` compare the committed bytes against what the generator would write. Both were wrong and agreed — the same shape as the process-summary defect found on 2026-09-22, where a generated index quoted a lane's documentation as the process's and `--check` was green across it because the generator's own output looked right.

`readme:audit` resolves links, but it audits READMEs, not `docs/reference/`.

**This is `blv9` at scale** — an IRI that does not dereference — and it is the third instance this week of the pre-split `cat-harness/` prefix outliving the move. `AGENTS.md` already records two others, both in the two commands a newcomer runs first.

## Why it is not fixed here

Found while verifying PR #949, whose subject is the vocabulary registry. Fixing a docs generator there would widen that PR on my own initiative. The fix itself looks small — `repoPrefix` should be instance-relative-to-repo-root — but "looks small" is exactly what the `..` group shows to be untrustworthy: two different prefix computations are wrong in two different ways, so one substitution will not cover both.

## Done when

- [x] `repoPrefix` resolves from the instance declaration rather than being composed, for BOTH the same-instance and cross-instance cases — ONE line in `gen-skill-docs.ts` (`relative(REPO_ROOT, …)`), plus `gen-schema-docs.ts` derived from `SKILLS_DIR` rather than hardcoded
- [x] The `..` case is gone **from everything either generator writes**. The 5 pages that still carry it are orphans no generator owns — their `..` is bean `nsbk`, not a composition bug
- [ ] A check that RESOLVES these links rather than comparing bytes. Byte-comparison cannot see this class, and the two `--check` gates over this directory were green throughout
- [ ] Re-measure: 0 non-resolving — **blocked on `nsbk`**, and deliberately not reached by deleting five pages that document real skills


_2026-09-22T13:50:00Z_ — CLAIMED on `claude/peaceful-heisenberg-dzgsf1`. Liveness checked first per `bean-coordination` §"A claim is branch-local": no unmerged branch names it, no open PR names it, `todo` since 12:09.


_2026-09-22T14:05:00Z_ — **262 non-resolving → 5, and the bean's own prediction about the fix was wrong.**

## The count was bigger than this bean measured

Re-derived rather than quoted, and the scope was one directory short:

| directory | pages w/ link | non-resolving | links | causes |
|---|---|---|---|---|
| `reference/skill-instructions/` | 244 | 240 | 488 | `skills` 450, `..` 22, `methodologies` 8 |
| `reference/skills/` | 22 | **22** | **88** | `schemas` 88 |

This bean's 244 / 240 / 480 reproduces exactly for the first row — 480 dead of 488 total, the 8 difference being the 4 good pages' links. **`reference/skills/` is a second generator it never reached**: `gen-schema-docs.ts`, 88 more dead links, same root cause. The real total was **568**, not 480.

## ONE line, BOTH symptoms — this bean predicted otherwise

> "two different prefix computations are wrong in two different ways, so one substitution will not cover both"

They are the same substitution. `gen-skill-docs.ts:361`:

    const rel = relative(INSTANCE_ROOT, skillsRoot);   // INSTANCE root, not REPO root

These values become `blob/main/<rel>/<file>`, which is a path **from the repository root**. Measured from `cat-harness/`:

- `cat-harness/skills/folio-core` → `skills/folio-core` — the missing prefix, 231 pages
- a sibling instance → has to climb out → `../bootstrap/skills` — the `..`, 9 pages

Measured from the repository root, both are already what the URL wants. `repoRootFor` was **already imported and used** eleven lines below.

The prediction was reasonable from the symptoms and wrong about the cause, which is the argument for finding the line rather than reasoning from the shape of the output.

`gen-schema-docs.ts` was a genuinely separate defect: four hardcoded `schemas/skills/${skill}` literals, stale since the split. Fixed by **deriving** the prefix from `SKILLS_DIR`, the constant that reads the files — so the link cannot disagree with the source it names.

## Re-measured

    skill-instructions   244 pages,  5 non-resolving,  488 links   (only `..`, 10 links)
    skills                22 pages,  0 non-resolving,   88 links
    TOTAL                266 pages,  5 non-resolving,  576 links

**568 dead → 10.**

## The remaining 5 are not a link defect, and this bean cannot close on them

They are `bootstrap/skills`' five pages, and they are **orphans**: mtime 06:05, hours older than every sibling, not rewritten by either generator run. The content is real — `bootstrap/skills/` holds exactly those five `.md` files — but `kgDirectories` no longer returns that directory, because **`bootstrap` and the root instance both declare a directory with id `cat-harness`**, and overrides match on id. The root's wins; bootstrap's is dropped.

Filed as **`nsbk`**, with the wider cost: those five skills are unreachable to `skill_list` and `skill_fetch`, which makes `AGENTS.md`'s "a dependency's skills ARE reachable" false for bootstrap specifically.

Not fixed here: renaming a declared id is a cross-instance change and the id is the override key, so which side is renamed is the owner's judgement rather than a defect with one repair.

## Two boxes ticked, and they are ticked ABOVE

The canonical `## Done when` at the top of this bean now carries them. I first
appended a second `## Done when` here with the ticks in it, and
`check:bean-bodies` refused the run: **`shadow-checklist`** — *"a checklist
item below `## Done when` is ticked while the canonical item it restates is
still open. The section a reader and every tool consult says this is not
done."*

Exactly right, and worth leaving on the record rather than quietly deleting.
A bean with two checklists has two answers to "is this finished", and the one
a tool reads is the first. That is the same defect this bean is about, one
layer up: a generated view and its source disagreeing, with the view looking
fine.


_2026-09-22T14:10:00Z_ — **VERIFIED ON THE PUBLISHED PREVIEW, not just the working tree.** The staging deploy rebuilt with the fix, so the deployed HTML could be read through the publish ref — `git show origin/gh-pages:STAGING/<slug>/<page>`, the route `staging-review` establishes for exactly this.

    245 published pages
    2448 blob/edit links in the deployed HTML
      10 NON-RESOLVING — all `..`, all `nsbk`'s five orphan pages × 2

**Every link either generator writes now resolves in the served output.** That is a different claim from "the generator emits good links", and it is the one that matters: this repository's own `preview:site` note exists because *"a green gate set is not a rendered page"*, and 123 green gates were compatible with 568 dead links for as long as this defect stood.

The 10 that remain are the same 5 pages, unchanged — no generator writes them, so nothing about this fix could have touched them. They are `nsbk`'s.

Worth noting the link count: 2448 in the HTML against 576 in the markdown, because the rendered page carries nav and theme links the source does not. Only the `blob|edit` ones were counted on both sides, so the two measurements are of the same quantity; the difference is the denominator, not the finding.


---

## RE-CUT ONTO CURRENT `main`, 2026-09-23 — and the fix had to be re-derived, not copied

_Owner ruled "split and fix then merge" on #944, which carried this bean and
`tebu` on one branch. This is the `oe98` half, cut fresh from `main` at
`899476a9f`._

**The old branch's fix could not be transplanted.** `main` reworked
`gen-skill-docs.ts` substantially in the meantime — `processRows` appended to
every page, the category table re-keyed by basename after the owner's *"dont
bury sub-graph assets"* move. Copying the old file would have reverted all of
that.

**And the bug is still live on `main`**, which was worth establishing before
touching anything: regenerating on a clean checkout of `899476a9f` changes
**zero files**, and the output still reads

    Generated from `skills/folio-core/bean-blocking.md`
      -> .../blob/main/skills/folio-core/bean-blocking.md

while the file is at `cat-harness/skills/folio-core/bean-blocking.md`. The
generator and its committed output are **self-consistent and both wrong** —
which is exactly why the `--check` gate cannot see it, and is the reason this
bean's third Done-when box exists.

### Same one-line cause, re-applied at its new site

`rel = relative(INSTANCE_ROOT, skillsRoot)` -> `relative(REPO_ROOT, skillsRoot)`.
`repoPrefix` becomes `blob/main/<prefix>` and `edit/main/<prefix>`, which are
REPOSITORY-root paths; measuring them from `cat-harness/` drops the stub. The
two roots were the same directory until `wggr` inverted the stubs, which is why
this file read correctly for as long as it did and broke with no edit to it.

Two literals in the cross-link table carried the same stale prefix and are
fixed with it. The other three — `.claude/skills/local`, `kg-navigation/skills`,
`bootstrap/skills` — were checked against disk rather than assumed: all three
are genuinely top-level and were already right.

### `gen-schema-docs.ts` — the second generator, and this bean missed it

Confirmed again on current `main`: four links per page across 22 pages spelled
`schemas/skills/<skill>/…` where the directory is `cat-harness/schemas/skills/`.
Now **derived** from `SKILLS_DIR` rather than written out —
`relative(repoRootFor(INSTANCE_ROOT), SKILLS_DIR)` — because a literal is
precisely what went stale, and this bean's own measurement missed this
generator entirely by looking only at the directory the other one writes.

### MEASURED after the fix, by resolving every link against disk

Not a byte comparison — the thing this bean says byte comparison cannot do:

| | links | non-resolving |
|---|---|---|
| **274 pages the generators write** | 604 | **0** |
| 8 orphan pages no generator writes | — | 14 |

Before: **568 dead** (488 in `skill-instructions/`, 88 in `skills/`, per the
table above).

**The 8 orphans are `nsbk`, not this bean**, and the classification was
measured rather than assumed: a mark file is touched, both generators run, and
a page is generator-owned only if its mtime passes the mark. An earlier pass
used a 30-minute window instead and misclassified `bootstrap-graph-emission.md`
and `bootstrap-graph-publication.md` as owned — they carried an mtime from a
previous run in the same session. **A coarse clock reads exactly like a
finding**, which is worth recording given how much of this bean is about
measurements that looked like answers.

    AGENTS.md            bootstrap-kg-navigation.md   discussion.md
    root-readme.md       bootstrap-graph-emission.md  log-message.md
    confirm-harness.md   bootstrap-graph-publication.md

`bootstrap/tools/` does not exist and `cat-harness.json` no longer declares it;
these pages document real skills that live at `bootstrap/skills/`. Removing
them is `deletion-requires-confirmation`, and re-homing them is `nsbk`.

## Done when — against this measurement

- [x] `repoPrefix` resolves from the instance declaration rather than being composed, for BOTH generators
- [x] The `..` case is gone from everything either generator writes — **0 of 604**
- [ ] A check that RESOLVES these links rather than comparing bytes — still open, and now with a reproduction: `gen-skill-docs --check` exits **0** on output the generator itself would rewrite
- [ ] Re-measure 0 non-resolving overall — **blocked on `nsbk`**, 14 links in 8 orphan pages
