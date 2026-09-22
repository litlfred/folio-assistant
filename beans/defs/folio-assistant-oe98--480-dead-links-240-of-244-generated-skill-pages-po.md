---
# folio-assistant-oe98
title: '480 dead links: 240 of 244 generated skill pages point ''Edit this page''s source'' at a path that does not exist'
status: in-progress
type: task
priority: normal
created_at: 2026-09-22T12:09:09Z
updated_at: 2026-09-22T13:55:22Z
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
