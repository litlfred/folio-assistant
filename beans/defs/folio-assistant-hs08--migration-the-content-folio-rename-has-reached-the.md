---
# folio-assistant-hs08
title: 'MIGRATION: the content/ -> folio/ rename has reached the declaration and NOTHING that reads a folio'
status: todo
type: task
priority: high
parent: folio-assistant-zzmr
created_at: 2026-09-20T10:02:53Z
updated_at: 2026-09-20T10:03:14Z
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
