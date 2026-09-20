---
# folio-assistant-hs08
title: 'MIGRATION: the content/ -> folio/ rename has reached the declaration and NOTHING that reads a folio'
status: in-progress
type: task
priority: high
created_at: 2026-09-20T10:02:53Z
updated_at: 2026-09-20T12:09:49Z
parent: folio-assistant-zzmr
---

Owner, 2026-09-20: *"content/ shouldnt be expected anymore. folio/ was
renamed as default/convention."* Then, on being shown a compatibility-fallback
design: **"no content/ fallback. excise!!!!!"**

Measured on `0392892c`.

## Where the rename HAS landed

- `cat-harness/harness.json` declares `folio/` holding the `folio` graph, and
  carries no `content` entry at all
- the `folio` graph kind exists, registered by **core** (`schemas/folio-graph-kind.ts`)

## Where it has NOT

| | still `content/` |
|---|---|
| `scripts/init-folio.ts` | scaffolds `content/<slug>/` and `content/schema/` |
| readers | **86 literal sites across 55 non-test files** |
| tests | 25 files, which build `content/` trees as fixtures |
| eight workflows | `cd content` |

By layer, non-test files:

    content/pipeline/   36
    scripts/             8
    adapters/            7
    src/                 4
    schemas/             0

Shapes are uniform — `join(<root>, "content", ...rest)` — so the swap is
mechanical.

## The blocker I reported was MINE, and the ruling dissolved it

I first proposed a resolution point preferring `folio/` and falling back to
`content/`, and reported that it was blocked: such a helper must be reachable
from `src/` (harness), `adapters/` and `content/pipeline/` (core), while
`allowed` in `repo-partition.ts` gives `harness: ["harness"]`. That is `ot9a`'s
boundary, and `ot9a` says not to settle it as a drive-by.

**The blocker was created by the fallback, not by the rename.** A straight
excision keeps ONE LITERAL PER SITE, exactly as today — just a different
string. No shared module, no new import, no cross-layer edge. `ot9a` is not in
the way of this at all.

Worth keeping as a worked example: an agent proposed a design, hit a wall that
the design itself had built, and reported the wall as a property of the
problem. The owner's one-line ruling removed it.

## THE ONE THING THAT DOES NOT FOLLOW MECHANICALLY

`cat-harness/content/pipeline/` is the **platform's own** directory and is NOT
a folio content root. String literals naming platform modules —
`"content/pipeline/render-latex.ts"` in `render-targets.ts`, the `schema:`
entries in `cat-harness.ts`, dozens of doc comments — must NOT be rewritten.

The discriminator is what the value is FOR, not how it is spelled:

- `join(<folioRoot>, "content", ...)` builds a FOLIO's content root -> rename
- `"content/pipeline/x.ts"` names a PLATFORM module -> leave

A blind `sed` over the string `content/` conflates them and is how this
migration goes wrong.

## Fallout that is NOT this repo's to fix

`litlfred/qou` is a real folio and still has `content/`. With no fallback, it
breaks the moment this lands. That is the owner's call, taken knowingly, and
the qou-side rename is a coordinated change in that repository — not something
the platform can absorb.

## Done when

- [ ] the 86 non-test sites renamed, platform module paths untouched
- [ ] the 25 test fixtures renamed with them, or they fail
- [ ] `init-folio` scaffolds `folio/<slug>/` and `folio/schema/`
- [ ] the eight workflows' `cd content` -> `cd folio`. They are **vendored by
      folios** (`code-quality-gates.yml` says so outright), so a folio that
      vendors them needs the rename too
- [ ] a ratchet so `content/` as a folio root cannot come back — the literal
      count goes to zero and stays there
- [ ] `qou` renamed in coordination, since nothing catches it here

---

## 2026-09-20, resolved — the owner's one line settled the design

> *"qou can declare a new folio at content/"*

That is what a declaration is FOR, and it reframed the remaining work from
cleanup into the enabling step. Measured immediately afterwards: **zero** sites
resolved the folio root through the declaration. All 162 were literals, so a
folio declaring `content/` would have been ignored and stayed invisible. The
rename had landed; the mechanism it exists to serve had not.

### `folioDir(root)` — one resolution point

`schemas/cat-harness.ts`, beside `directoryForGraph`. Three answers:

- a declared folio graph -> that path (`content/`, or anything else)
- no declaration -> the CONVENTION, `folio/`, never `content/`
- the kind unregistered -> **throws**, naming the import to add

### The first version was wrong, in the way that mattered

It fell back to the convention when the `folio` kind was unregistered. Probed
it and got `/probe/folio` for a folio declaring `content/` — the declaration
silently ignored, a plausible path returned instead of a fault. That is
"could not determine" rendered as an answer, and it would have made qou
invisible in exactly the processes that matter. Replaced with a loud failure.

### Why the registration import cannot live with the helper

`schemas/folio-graph-kind.ts` imports `cat-harness.ts`, so the reverse import
is a CYCLE. It goes at the entry point instead — `content/pipeline/repo-root.ts`
now carries it, the same pattern `schemas/harness-config.ts` and
`src/tools/skill-fetch.ts` already use. That it must be repeated per entry
point is `ot9a`'s fragility, unchanged and not made worse.

### Layering: the assumption was backwards

`repo-partition` says `schemas/cat-harness.ts` and `content/pipeline/` are
**harness**, while `src/routes/relevance.ts` and `adapters/` are **core**.
Layer is not by directory. Since `core` may import `harness` but not the
reverse, a HARNESS home is the only one every caller can reach — so the helper
sits where it had to.

On `ot9a`'s falsifier (*"if the harness still has to know the string `folio`
anywhere, the re-siting is cosmetic"*): the harness does still know it. But it
knew it in 162 places and now knows it in ONE, which is the difference between
a fact you can audit and one you can only grep for.

### Done

- [x] 91 non-test sites across 58 files now call `folioDir`
- [x] 89 `declared-path-literal` markers removed — they claimed a literal was
      being counted above lines that now read the declaration
- [x] 7 tests, including **end to end**: `findPapers` finds a paper in a folio
      whose declaration names `content/`
- [x] 55 gates, 3533 tests, tsc and eslint clean
- [ ] **qou declares its folio at `content/`** — coordinated, in that repo
- [ ] the eight vendored workflows' `cd content`: they move after the folios do
