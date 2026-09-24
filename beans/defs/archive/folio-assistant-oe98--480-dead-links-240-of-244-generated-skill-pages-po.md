---
# folio-assistant-oe98
title: '480 dead links: 240 of 244 generated skill pages point ''Edit this page''s source'' at a path that does not exist'
status: completed
type: task
priority: normal
created_at: 2026-09-22T12:09:09Z
updated_at: 2026-09-23T20:05:12Z
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

- [x] `repoPrefix` resolves from the instance declaration rather than being composed, for BOTH the same-instance and cross-instance cases
- [x] The `..` case is gone rather than normalised — a cross-instance skill's source lives at a real repo-relative path, and if it cannot be named as one, the page says so instead of emitting a URL that 404s
- [x] A check that RESOLVES these links rather than comparing bytes. Byte-comparison cannot see this class, and the two `--check` gates over this directory were green throughout
- [x] Re-measure: 253 pages, 504 links, 0 non-resolving (2026-09-23) — after the owner chose to move the 8 orphan pages to `fsh-guts/retired/` rather than delete them
  - Published pages: 252, 0 non-resolving (504 links). 8 ORPHAN pages remain — see Summary.

## Summary of Changes

**Cause.** `gen-skill-docs.ts` built each group's `repoPrefix` as `relative(INSTANCE_ROOT, dir)` — relative to `cat-harness/`, not to the repository. Same-instance groups therefore lost the `cat-harness/` segment (`skills/folio-core/...`), and a dependency's directory came out as `../bootstrap/skills/...`. The twin-banner table also carried hand-written `repoPrefix` literals with the same pre-split path.

**Fix.** `repoRelative(abs)` — relative to `repoRootFor(INSTANCE_ROOT)`, returning `undefined` for anything outside the checkout (no `..`, no absolute). Every group's prefix goes through it, including `.claude/skills/local`; the twin table's literals are gone and a twin's location is looked up from the group that publishes it. A source with no repository path gets a sentence saying so and no edit link.

**Check.** `cat-harness/scripts/tests/skill-doc-source-links.test.ts` resolves every blob/edit link on every page the index publishes against the checkout (and rejects `..`). Verified it fails on the pre-fix `todo-manager.md`.

**Measured** (every page in `cat-harness/docs/reference/skill-instructions/` carrying a source link):

```
before: 260 pages, 520 links, 514 dead
after : 260 pages, 520 links,  16 dead  — all 16 on the 8 orphans below
        252 PUBLISHED pages, 504 links, 0 dead
```

**Not done — the last box stays open on a deletion question.** Eight pages in that directory are no longer written by the generator (not in its index; sources moved or no longer in a declared kg directory after `258d6e0a`), so regeneration cannot fix their links and `--check` cannot see them: `AGENTS.md` (2.2 KB), `bootstrap-graph-emission.md` (4.6 KB), `bootstrap-graph-publication.md` (7.0 KB), `bootstrap-kg-navigation.md` (3.8 KB), `confirm-harness.md` (2.5 KB), `discussion.md` (5.5 KB), `log-message.md` (4.5 KB), `root-readme.md` (4.0 KB). Removing them is a deletion of published pages, so it is asked for (`deletion-requires-confirmation`), not done here. Related and also left: `kg-navigation.md`'s twin banner links `local-kg-navigation.html`, which no group publishes.



**Orphans, 2026-09-23:** the 8 pages the generator stopped writing at `258d6e0a` moved to `fsh-guts/retired/skill-instructions-<name>.md`, each with `movedFrom`/`movedOn` and its original page kept verbatim — the owner's choice ("move to trashcan").
