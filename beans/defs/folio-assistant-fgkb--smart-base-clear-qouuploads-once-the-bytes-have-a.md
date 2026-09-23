---
# folio-assistant-fgkb
title: 'smart-base: clear qou/uploads once the bytes have a home'
status: todo
type: task
priority: normal
created_at: 2026-09-22T08:35:28Z
updated_at: 2026-09-22T11:55:45Z
parent: folio-assistant-2yyh
---

Issue #877. The eight PDFs are in `litlfred/qou` as https://github.com/litlfred/qou/commit/a3d2266a1b08018af5f8f88c222c1e7b45e6a36c — a mathematics repository, which is not their home.

**`deletion-requires-confirmation` governs and this is not the agent's call.** What follows is the report the skill requires: what would go, with sizes, and the evidence that nothing would be lost. Nothing has been removed.

## What would be removed from `qou/uploads/`

| file | size | ingested here as | sha256 |
|---|---:|---|---|
| `9789240010567-eng.pdf` | 4.3 MB | `smart-base/library/9789240010567-eng/` | **matches** |
| `9789240081949-eng.pdf` | 1.5 MB | `smart-base/library/9789240081949-eng/` | **matches** |
| `9789240093362-eng.pdf` | 2.7 MB | `smart-base/library/9789240093362-eng/` | **matches** |
| `9789240120747-eng.pdf` | 1.5 MB | `smart-base/library/9789240120747-eng/` | **matches** |
| `9789241509510_eng.pdf` | 3.2 MB | `smart-base/library/9789241509510-eng/` | not re-checked |
| `9789241511766-eng.pdf` | 3.3 MB | `smart-base/library/9789241511766-eng/` | **matches** |
| `WHO-RHR-18.06-eng.pdf` | 0.4 MB | `smart-base/library/who-rhr-1806-eng/` | not re-checked |
| `Home _ folio-assistant.pdf` | 7.0 MB | **NOT ingested** | — |

24 MB total. Five of the seven WHO publications were verified byte-identical by comparing the `source.sha256` each entry's own `structure.json` records against the file in `qou`. Two were not re-checked in that pass and should be before anything is removed — a partial verification is not a verification.

`uploads/` in THIS repository also holds its own copies, committed, which is the incoming queue the ingest ran from.

## The one that is not like the others

`Home _ folio-assistant.pdf` is a print of this project's own home page and is the largest file in the set at 7.0 MB. It was never ingested, deliberately: ingesting the platform's own rendered docs as WHO subject matter is the boundary this repository keeps warning about. It is almost certainly a stray from the same upload.

It needs a separate decision from the other seven, because "the source is safely ingested elsewhere" is the argument for removing those and it does not apply to this one.

## Why an agent does not do this unasked

The skill's rule, and the reason it exists: an agent never removes a durable artefact on its own initiative. A deleted file leaves the next reader unable to tell a decision from an accident, and `qou` is somebody else's repository — the removal would be a commit there, not here.

A "go" on the session's work is not consent for this. It is the one step in the plan whose cost is irreversible.

## Done when
- [x] the remaining two sha256 comparisons are made
- [x] the owner has said whether to remove the seven, and separately what to do with `Home _ folio-assistant.pdf`
- [x] if yes: a commit in `litlfred/qou`, not here — for the ONE file that was a yes

## The verification is complete, 2026-09-22 — and all SEVEN were re-run, not two

Stream 3/3 of the #956 consolidation. **Nothing has been removed, and nothing
will be by an agent.** This closes the one Done-when that was a *measurement*;
the two that are *decisions* stay open and are the owner's.

This bean said the right thing about its own gap — *"a partial verification is
not a verification"* — so the fix was not to add the two missing rows to five
quoted ones. **All seven were recomputed in a single pass**, source bytes read
out of `litlfred/qou` @ `a3d2266` and compared against the `source.sha256` each
entry's own `structure.json` records on this branch.

| file | size | ingested here as | sha256 |
|---|---:|---|---|
| `9789240010567-eng.pdf` | 4.29 MB | `smart-base/library/9789240010567-eng/` | `a4804f85…` **match** |
| `9789240081949-eng.pdf` | 1.54 MB | `smart-base/library/9789240081949-eng/` | `af6fd10e…` **match** |
| `9789240093362-eng.pdf` | 2.66 MB | `smart-base/library/9789240093362-eng/` | `0d47d983…` **match** |
| `9789240120747-eng.pdf` | 1.51 MB | `smart-base/library/9789240120747-eng/` | `c710f7cf…` **match** |
| `9789241509510_eng.pdf` | 3.18 MB | `smart-base/library/9789241509510-eng/` | `26aa12fb…` **match** — was unchecked |
| `9789241511766-eng.pdf` | 3.27 MB | `smart-base/library/9789241511766-eng/` | `934bdf11…` **match** — was unchecked |
| `WHO-RHR-18.06-eng.pdf` | 0.39 MB | `smart-base/library/who-rhr-1806-eng/` | `44be3640…` **match** |
| `Home _ folio-assistant.pdf` | **7.00 MB** | **NOT ingested** | `783058fd…` — nothing to compare it to |

**7 of 7 WHO publications are byte-identical.** 16.84 MB across the seven; 23.84 MB
including the eighth. Uploaded to `qou` 2026-09-22T08:22:48Z, so **under a day
old** — an age worth stating, because `deletion-requires-confirmation` asks for
ages and a fresh upload is more likely to be mid-workflow than abandoned.

### What that does and does not establish

It establishes that removing the **seven** loses no bytes: every one of them is
reproducible from `smart-base/library/` on this branch. It establishes nothing
about **whether** to remove them, which is not a measurement.

And it establishes nothing at all about `Home _ folio-assistant.pdf`. That file
is the largest of the eight, was never ingested, and the argument for removing
the others — *the source is safely ingested elsewhere* — **does not apply to
it**. A verification pass that quietly folded it in with the seven would be
exactly the error this bean was written to prevent.

### Still not the agent's call, and a "go" on the session is not consent

Unchanged and restated because the measurement completing makes it tempting: the
removal would be a commit in `litlfred/qou`, somebody else's repository and a
mathematics one. `deletion-requires-confirmation` governs. The report is here;
the decision is the owner's, and is being put to them as a selectable question
rather than as free text.

*Recorded by stream 3/3 of the #956 consolidation — session_013vZiHGPug7PuHoMxRS82vw.*

## Both decisions taken, 2026-09-22 — and they went opposite ways

Put to the owner by stream 3/3 of the #956 consolidation as two **separate**
selectable questions, which is what this bean's own Done-when demanded. The
answers differ, which is the vindication of insisting they be separate:

| | ruling |
|---|---|
| the **seven** WHO publications, 16.84 MB, all seven sha256-verified byte-identical | **KEEP them here for now** |
| **`Home _ folio-assistant.pdf`**, 7.00 MB, never ingested | **remove it, do not ingest it** |

**A single question would have got one of these wrong.** The verification pass
established that removing the seven loses no bytes, and that is exactly the
evidence that makes a combined "remove them all" feel obvious. The owner declined
it for the seven anyway — a completed verification is not an instruction — while
approving removal of the one file the verification could say nothing about.

### Done, in `litlfred/qou` and not here

- **Issue [litlfred/qou#7450](https://github.com/litlfred/qou/issues/7450)** — what
  would go, with size, sha256 and the reason this file is not like the other seven.
- **PR [litlfred/qou#7451](https://github.com/litlfred/qou/pull/7451)** — removes
  that one file and nothing else.

**Not merged.** `deletion-requires-confirmation` governs, and `qou` is stricter
still: `/prepare-merge` plus an explicit *"merge it"* from the author for every
merge to `main`. The PR is the proposal; the merge is the owner's.

Built with git plumbing against `main` @ `7aafd8d` — no checkout, so no blobs were
fetched — and the resulting tree was verified to contain no `Home*` entry under
`uploads/` **before** the commit was written. Blob `3a83ab4` stays reachable in
history: this is a `git rm`, not a history rewrite, so the decision is reversible
and that is stated rather than assumed.

The seven remain in `qou/uploads/` untouched, with their verification recorded
above so the next session need not redo it.
