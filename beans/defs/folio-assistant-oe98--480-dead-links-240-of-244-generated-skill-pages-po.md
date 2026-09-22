---
# folio-assistant-oe98
title: '480 dead links: 240 of 244 generated skill pages point ''Edit this page''s source'' at a path that does not exist'
status: todo
type: task
created_at: 2026-09-22T12:09:09Z
updated_at: 2026-09-22T12:09:09Z
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

- [ ] `repoPrefix` resolves from the instance declaration rather than being composed, for BOTH the same-instance and cross-instance cases
- [ ] The `..` case is gone rather than normalised — a cross-instance skill's source lives at a real repo-relative path, and if it cannot be named as one, the page says so instead of emitting a URL that 404s
- [ ] A check that RESOLVES these links rather than comparing bytes. Byte-comparison cannot see this class, and the two `--check` gates over this directory were green throughout
- [ ] Re-measure: 244 pages, 0 non-resolving
