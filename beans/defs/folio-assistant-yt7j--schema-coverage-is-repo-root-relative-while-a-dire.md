---
# folio-assistant-yt7j
title: 'SCHEMA: coverage.* is repo-root relative while a directory''s path is instance-relative, and nothing says so'
status: todo
type: task
parent: folio-assistant-yj32
created_at: 2026-09-20T22:53:52Z
updated_at: 2026-09-20T22:53:52Z
---

Found while building the `elsewhere` state (bean `flh4`, PR #619). A `ContentDirectory`'s `path` resolves against the INSTANCE root; its `coverage.visualiser` / `coverage.docs` resolve against the REPO root. Nothing in `SubgraphCoverageSchema` or `ContentDirectorySchema` says so.

Measured 2026-09-20 across `harness.json` and `cat-harness/harness.json`: of 27 coverage paths, **25 resolve only from the repo root**, 2 from both (the root declaration's own, where the two roots coincide) and **0 from the instance root alone**.

Why it matters rather than being a curiosity: `state-visualizer.ts` has `ROOT = cat-harness/`, so the obvious `join(ROOT, cov)` reports every declared visualiser as missing. In that generator the consequence was a page full of false "declared visualiser is not there" defect reports — caught only because the corpus was measured first. The next consumer has no such luck.

## Done when
- [x] The two bases are stated on the schema, where a consumer reads them
- [ ] Decided and recorded: is the asymmetry deliberate, or should one of the two move? Do NOT change resolution behaviour without the owner's ruling — 27 paths depend on it

## Progress — 2026-09-20

`SubgraphCoverageSchema.visualiser` and `.docs` now state the repo-root base,
the 25-of-27 measurement, and the concrete failure it nearly caused, with a
pointer back to this bean for the open half. `skill` is documented as a NAME
rather than a path, so no base applies to it.

**Deliberately left open.** Whether the asymmetry should stay is not an
agent's call: 27 declared paths resolve against it today, and changing the
base would move all of them at once. This bean now records the behaviour
accurately and waits for the owner's ruling rather than pre-empting it.

## `path` HAS a declared disambiguator; `coverage.*` has none — 2026-09-21

Found while verifying `1ity`, and it sharpens the ruling this bean is waiting
for rather than merely adding to it.

`cat-harness/harness.json` uses **both bases in one file**, and says which is
which:

| id | `scope` | `path` | resolves from |
|---|---|---|---|
| `library` | *(none)* | `library/` | the INSTANCE |
| `who-iris-library` | `repository` | `who-iris/library/` | the REPO |
| `agent-skills-library` | `repository` | `agent-skills/library/` | the REPO |
| `folio-assistant-sci-library` | `repository` | `folio-assistant-sci/library/` | the REPO |

So a declared `path` is instance-relative **by default** and repo-relative
when `scope: "repository"` declares it so. A consumer never has to guess,
and a first pass that ignored `scope` wrongly called three of these missing —
which is the failure mode the mechanism exists to prevent.

**`coverage.visualiser` and `coverage.docs` have no such field.** They are
repo-relative always, by convention only, with nothing in the declaration
saying so. That is the asymmetry, stated more precisely than this bean had
it: not "two fields use two bases", but **one field declares its base and the
other does not**.

It also suggests the cheapest resolution, without deciding it: `coverage.*`
could honour the SAME `scope` the sibling field already uses, rather than a
new mechanism or a migration of 27 paths. Recorded as an option for the
owner, not taken.

