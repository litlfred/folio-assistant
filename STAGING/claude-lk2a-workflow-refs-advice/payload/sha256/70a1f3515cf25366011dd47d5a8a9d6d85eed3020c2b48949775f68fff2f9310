---
# folio-assistant-hs08
title: 'MIGRATION: the content/ -> folio/ rename has reached the declaration and NOTHING that reads a folio'
status: in-progress
type: task
priority: high
created_at: 2026-09-20T10:02:53Z
updated_at: 2026-09-22T18:18:42Z
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

- [ ] the **4** renameable non-test sites renamed, and the **2** that name a
      platform module left alone — re-measured 2026-09-22, see below; the 86
      this line carried counted the `holds: content` graph-layer axis and skill
      `tags:` alongside the folio roots, and was never 86 of this thing
- [ ] the **11** test fixture sites renamed with them, or they fail
- [x] `init-folio` scaffolds `folio/<slug>/` and `folio/schema/` — **done**,
      `cat-harness/scripts/init-folio.ts:639-651`
- [ ] the **6** workflow files' `cd content` / `working-directory: content` ->
      `folio`. They are **vendored by folios** (`code-quality-gates.yml` says so
      outright), so a folio that vendors them needs the rename too
- [ ] `cat-harness/content/docs/` — 14 live subgraphs — moved AND declared;
      the old framing left this out entirely
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

## 2026-09-20 — the coordinated half is open: litlfred/qou#7445

qou had **no declaration at all**, so it fell back to the convention and
resolved to a `folio/` that does not exist. Measured against the platform at
`e1cd7877`, by moving the file aside and back rather than inferring:

    without harness.json:  folioDir -> /home/user/qou/folio   findPapers -> []
    with    harness.json:  folioDir -> /home/user/qou/content findPapers -> 5 folios

`bach2013-double-slit`, `fred2005-formal-groups`,
`quantum-observable-universe`, `unital-groebner-bases`, `visualizer`.

**One entry, not six.** A `directories` array MERGES with the conventions
rather than replacing them — verified directly: with only `folio` declared,
`library` and `uploads` still resolved. Declaring qou's `library/`, `uploads/`
and `todos/` would restate defaults that already work, and a
declared-but-absent directory is the `dh4f` defect.

**Declare rather than rename**, per the owner: moving `content/` -> `folio/`
in qou would touch five folio trees, the bun workspace, the CI paths and every
cross-reference in the corpus. The declaration is four lines.

## Done

- [x] 91 non-test sites call `folioDir`
- [x] `folioDir` reads the declaration, falls back to the CONVENTION (never
      `content/`), and throws rather than guessing when the kind is unregistered
- [x] a ratchet — `scripts/tests/folio-root-is-asked.test.ts` — falsified both
      ways, and already clean against 37 commits of concurrent work
- [x] 27 identifiers renamed off `CONTENT_*`
- [x] qou declares its folio at `content/` (litlfred/qou#7445, OPEN)
- [ ] the eight vendored workflows' `cd content` — after the folios move


## RE-MEASURED 2026-09-22 on `main` at `b7f8945b` — every count in this bean is stale, and one is off by 20×

_Stream 1/3 (`upgd`)._ The table above was measured 2026-09-20 on `0392892c`.
Two days and roughly 250 commits later, **none of its four numbers holds**, and
one box is already done. Recorded as a re-measurement rather than an edit,
because the next reader should see which way the work actually moved.

| | 2026-09-20 (`0392892c`) | 2026-09-22 (`b7f8945b`) |
|---|---|---|
| non-test reader sites | **86** across 55 files | **6**, of which 2 must NOT be renamed → **4 real** |
| test fixtures | 25 files | **11** sites |
| workflows with `cd content` | 8 | **6 files** |
| `init-folio` scaffolds | `content/<slug>/`, `content/schema/` | **`folio/<slug>/`, `folio/schema/` — DONE** |

### `init-folio` is done, and that box can be ticked

`cat-harness/scripts/init-folio.ts` writes `folio/schema/builders.ts`,
`folio/schema/types.ts` and `folio/<slug>/…` (lines 639–651), declares
`path: "folio/"` with `graphKinds: ["folio"]` (178–184), and its reserved-slug
error says `folio/${slug}/ has a platform meaning`. Nothing in it scaffolds
`content/`.

### The 86 was never 86 of the thing this bean is about

The old figure counted the literal `"content"` wherever it appeared. Most
occurrences are **the `holds: content | context | state` graph-layer axis** —
`graph-kind-registry.ts` alone has 14 — plus skill `tags:` and the
`provides?: Array<"skills" | "content" | "translations">` union. None of those
is a folio content root and none was ever in scope. Applying **this bean's own
discriminator** (what the value is FOR, not how it is spelled) to
`(join|resolve)(…, "content", …)` gives six non-test sites:

| site | verdict |
|---|---|
| `cat-harness/content/pipeline/gen-site-jsonld.ts:55` | rename — `join(REPO_ROOT, "content", "docs")` |
| `cat-harness/scripts/gen-docs-pages.ts:88` | rename — same shape |
| `cat-harness/scripts/gen-docs-pages.ts:623` | rename — same shape |
| `cat-harness/content/pipeline/translation-block-qa.ts:850` | rename — `join(INSTANCE_ROOT, arg("root", join("content", "docs")))` |
| `cat-harness/adapters/document/tools/render.ts:156` | **LEAVE** — names `content/pipeline/generate-block-tex.ts`, a platform module |
| `cat-harness/adapters/document/tools/_pipeline.ts:40` | **LEAVE** — resolves `content/pipeline`, a platform module |

That is exactly the trap §"THE ONE THING THAT DOES NOT FOLLOW MECHANICALLY"
names: two of six sites look identical to a `sed` and must not move.

### A finding this bean does not have, and it changes what the rename IS

All four renameable sites build the same path: **`cat-harness/content/docs/`**.
That directory exists and holds **14 documentation subgraphs**
(`agentic-harness`, `crdm-methodology`, `kgraph`, `publication-workflow`, …).
`REPO_ROOT` in both generators resolves to `cat-harness/`, so these are **live
paths, not stale ones** — the generators read real content today.

And **`cat-harness/content/docs/` is declared nowhere.** `cat-harness.json`
carries no `content` entry at all — which §"Where the rename HAS landed"
records as the rename having *landed*. Meanwhile the declared `folio/` →
`cat-harness/folio/` holds **three JSON files**.

So the state is sharper than "the rename reached the declaration and nothing
that reads it". It is: **the declaration was emptied of `content/` before the
directory holding the content was moved into `folio/`**, leaving 14 subgraphs
that the docs-site generators read and that no declaration mentions. That is
the `dh4f` shape pointed the other way — not a declared-but-absent directory,
but a present-but-undeclared one, which no consumer scanning the declaration
can see.

### What this does NOT change

The owner's ruling stands unqualified: *"no content/ fallback. excise!!!!!"*
And §"Fallout that is NOT this repo's to fix" still holds — `litlfred/qou`
carries `content/` and breaks when this lands.

### Where this lands in the canonical checklist

The `## Done when` section above now carries these numbers; it is the section a
reader and every tool consult, so it is the one that was corrected. Restating
the list down here produced a **shadow checklist** — `check:bean-bodies` caught
it, correctly: a ticked item down here beside an unticked canonical one is two
answers to one question.
