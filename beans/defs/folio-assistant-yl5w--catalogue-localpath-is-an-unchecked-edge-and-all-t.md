---
# folio-assistant-yl5w
title: 'CATALOGUE: localPath is an unchecked edge, and all three point at nothing'
status: completed
type: bug
priority: high
created_at: 2026-09-20T18:49:27Z
updated_at: 2026-09-21T07:38:38Z
parent: folio-assistant-kupb
---


MEASURED 2026-09-20, on `main` after #477 merged. Every `bitstreams[].materialization.localPath` in `who-iris/catalogue/nodes/` names a file that does not exist:

| node | localPath | resolves to | state |
|---|---|---|---|
| `item/18892cf3-…` | `uploads/WPR-RDO-2020-003-eng.pdf` | `who-iris/uploads/WPR-RDO-2020-003-eng.pdf` | **MISSING** |
| `item/local:9789241548960-eng` | `uploads/9789241548960_eng.pdf` | `who-iris/uploads/9789241548960_eng.pdf` | **MISSING** |
| `item/local:who-pub-tps-931` | `uploads/WHO_PUB_TPS_93.1.pdf` | `who-iris/uploads/WHO_PUB_TPS_93.1.pdf` | **MISSING** |

All three bytes are really present — in `cat-harness/uploads/`. #477 moved `library/` into `who-iris/` and left `uploads/` behind; its own "Open" list carries the relocation. So the paths are not wrong about the WORLD, they are wrong about WHERE, and every one of them says `state: "materialized"` while pointing at nothing.

THE CHECK IS THE POINT, not the three paths. `who-iris/scripts/check-catalogue.ts` verifies `metadataRef` exists, and its failure message says exactly why:

> `metadataRef … does not exist — an edge to nothing, which reads as a relationship`

`libraryId` is verified too, against `structure.json`. `localPath` gets neither. So `check:catalogue` reports **✓ every node validates; every metadataRef, libraryId and parent path resolves** over three materialisation claims that resolve to nothing — a clean run over exactly the state the three-state model exists to make impossible. `materialized` is supposed to mean the bytes are HERE.

Found while building the `community-list` mockup, whose asset links have to resolve, so the gap surfaced the moment anything actually followed one.

## Not fixed here, and why

The fix is a move, and `uploads/` relocation is live work on someone else's plate (#477's open list; the owner has a library agent running). Correcting the DATA instead is worse: relative to `who-iris`, the real location is only reachable as `../cat-harness/uploads/…`, and bean `z7ev` forbids exactly that shape — a relative path hardcodes a checkout layout into content.

## Done when
- `check-catalogue.ts` verifies `localPath` the way it verifies `metadataRef`, with the same "edge to nothing" reasoning in the message.
- A `materialized` bitstream whose bytes are absent FAILS. It is never reported as a clean run.
- The three paths resolve — by the bytes moving, not by the claim being softened.


---

## Summary of Changes — 2026-09-21 (session_014HGPQoUnzXGqSspA8x6YyD)

**Re-measured before touching anything, and the bean was out of date.** It
recorded three claims; there were **six**. The three THUMBNAIL covers added
2026-09-20 resolve; the three ORIGINAL PDFs did not. A bean's measurement is
evidence about the day it was written.

### The check, which is the point

`who-iris/scripts/lib/local-path.ts` + the call in `check-catalogue.ts`, beside
the `metadataRef` and `libraryId` checks that already existed. **Three states,
because unreadable is not absent** — reporting them alike sends a reader
hunting for bytes that are sitting right there, and reporting either as a pass
is worse. A path naming a DIRECTORY is `missing` too: `localPath` is where the
bytes landed, and a directory is not bytes.

It resolves against the **instance and nowhere else**, which is the schema's
own words — *"where the bytes landed, instance-relative"*. Deliberate: these
three claims named bytes that DID exist one instance over, and a resolver that
searched the repository would have called them present and made the contract
unenforceable.

A module rather than four inline lines because `check-catalogue.ts` is
imperative top to bottom — importing it to reach a helper runs the gate as a
side effect of loading, and the test would then assert against whatever the
corpus holds rather than a case it planted. Same split `lib/bytes.ts` uses.

### The relocation, on the owner's ruling

Owner, 2026-09-21, given three options: **`git mv` the sources into the
folio**. `cat-harness/uploads/{9789241548960_eng, WHO_PUB_TPS_93.1,
WPR-RDO-2020-003-eng}.pdf` → `who-iris/uploads/<slug>/`, each beside its own
`intake.json` and IRIS capture, and each now listed in that intake with `bytes`
and `sha256` — because the intake describes what is IN that directory.

All three digests match the `source.sha256` their `library/<slug>/structure.json`
already recorded, so the moved bytes are provably the ones the L1 corpus was
derived from. This finishes what `frs5` left: it moved the derived corpus and
not the sources.

### The workaround deleted, exactly as it predicted

`lib/bytes.ts` carried a declared-path-first resolver with a
`cat-harness/uploads/` fallback, and its own note said: *"When `yl5w` is
settled … this module is the one edit, and the `DECLARED_FIRST` order is what
makes that edit a deletion rather than a rewrite."* It was. The fallback is
gone; the resolver now honours the declaration and nothing else.

`ingestion-notes.html`'s **"Still open"** section is now **"Settled"** — it is a
projection of this work, so it could not be left saying `check:catalogue` does
not check `localPath`.

### Consumers, found by running the gates rather than by grepping once

- `tech-meta.test.ts` read `join(ROOT, "uploads/WHO_PUB_TPS_93.1.pdf")` — a
  literal, in the one test whose own comment says asserting a spelling of a
  location re-pins the next relocation. Now derived: `structure.json` gives the
  filename, the library entry gives the instance and slug.
- `declared-path-baseline.json` — the lost witness dropped with `--update`,
  which is a reviewable diff by design.
- `library-graph.ts`'s measured table re-measured: `cat-harness/uploads/`
  **0 of 1**, `who-iris/uploads/` **1 of 4**. **All six entries still report
  `upload=match`** from a recomputed hash across three queues — a name-matched
  relation would have broken on the move and this one did not notice, which is
  the evidence it is content-verified rather than nominal.

### Verified

`check:catalogue` ✓ every metadataRef, libraryId, localPath and parent path
resolves · `bun run gates` **78/78** · `bun test` **4869 pass / 0 fail** ·
`iris:covers:check` re-rendered all three covers **from the moved PDFs**, with
no fallback in the resolver — which is the end-to-end proof the new paths are
the ones being read.

---

## 2026-09-21 ~10:45Z — a DUPLICATE was built in parallel, and its conclusion was WRONG

session_01AYHimvYMmf8h8e9fFN6dW5 claimed this bean at ~10:00Z when it read
`todo`, built a second `localPath` resolver, and opened PR #682 and issue #681.
**PR #664 landed the real one at 10:35Z.** The duplicate is withdrawn: main's
implementation is kept wholesale and mine deleted, along with its baseline file
and tests.

### The claim did not prevent it, exactly as `bean-coordination` says

*"A claim is branch-local — it ANNOUNCES rather than reserves until your PR
exists."* This bean read `todo` because the session doing the work had not
pushed a claim yet. Both checks were half-built before either branch was
visible to the other. That is the documented failure mode, observed.

### The withdrawn conclusion, stated because it was asserted publicly

The duplicate measured the three `localPath` values against its checkout,
found nothing there, and concluded **"the bytes were never captured; the state
is what is false"**. It went further and called
`sourceLoss: { verdict: "permitted", basis: "original bytes held locally with
a recorded sha256" }` **a gate permitted on a false basis**.

**Both are wrong.** The bytes existed — the owner had them, and #664 moved
them in. They are on main now at **exactly** the declared sizes:

| path | bytes |
|---|---|
| `who-iris/uploads/9789241548960-eng/9789241548960_eng.pdf` | 2,136,157 |
| `who-iris/uploads/who-pub-tps-931/WHO_PUB_TPS_93.1.pdf` | 3,293,424 |
| `who-iris/uploads/wpr-rdo-2020-003-eng/WPR-RDO-2020-003-eng.pdf` | 2,810,648 |

The `fixity.sha256` and byte counts were **correct the whole time**; the file
had not landed yet. The evidence (declared sizes an order of magnitude above
the `-info.pdf` captures; `intake.json` listing only the `-info.pdf`) was real
and the inference from it was not: *"absent from this checkout"* and *"never
existed"* are different claims, and one was reported as the other.

That is the same error `8nzu` names — a measurement of a moving system stated
as a settled fact — committed twice by one session in one morning, once about
sessions and once about bytes.

### What survives

Nothing of the duplicate's code. Its one contribution is this record, and the
observation that **a baseline was the wrong instinct here**: the right move was
to ask the owner, which the session that asked got, and which turned a
three-entry backlog into three files that simply arrived.
