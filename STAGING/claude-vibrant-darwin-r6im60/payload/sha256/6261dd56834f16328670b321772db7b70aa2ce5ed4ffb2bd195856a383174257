---
# folio-assistant-fgkb
title: 'smart-base: clear qou/uploads once the bytes have a home'
status: in-progress
type: task
priority: normal
created_at: 2026-09-22T08:35:28Z
updated_at: 2026-10-03T15:59:20Z
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
- [ ] if yes: a commit in `litlfred/qou`, not here

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

## Owner ruling 2026-10-02: "Put in fsh-guts"

Applied to all eight, the home-page print included: relocation is reversible, which is why fsh-guts exists. litlfred/qou#7494 (draft) moves them from uploads/ to fsh-guts/uploads/, each with a folio-fsh-guts/v1 .md sidecar (kind: source, movedFrom, movedOn, bean). sha256 re-run before the move: all seven WHO PDFs equal the source.sha256 recorded by their smart-base/library entries. Merging in qou needs /prepare-merge and the author's 'merge it'. Close this bean when #7494 merges.

## Owner rulings 2026-10-03 (supersede the 2026-10-02 "Put in fsh-guts" plan for qou#7494)

Dispatched from https://claude.ai/code/session_015Q15h1fg2Hh9MJXfAqr4h7. Held by https://claude.ai/code/session_013Pdniq3SSCRvxhsN4E5aFi (branch `claude/fgkb-cpmo-qou-uploads`).

1. Remove the seven verified WHO PDFs from qou/uploads — selected option, verbatim: **"Yes, via a qou PR"**.
2. `Home _ folio-assistant.pdf` — selected option, verbatim: **"Move it to fsh-guts"**. Keep a copy in folio-assistant's fsh-guts, then remove it from qou.

Order, because the qou step cannot be undone: (a) the home PDF lands in `fsh-guts/uploads/` on folio-assistant **main**; (b) only then all seven sha256 are re-verified against `smart-base/library/*/structure.json`, and the home PDF against its fsh-guts copy on main; (c) ONE qou PR removes the eight files. The owner merges it personally. Any mismatch means nothing is removed.

### Step (a), 2026-10-03
`fsh-guts/uploads/Home-_-folio-assistant.pdf` + sidecar. Copied byte-identical from this repo's `uploads/Home-_-folio-assistant.pdf`: 7,341,534 bytes, sha256 `783058fd36feb3cb2618b43fc236b37d3f10a096d5af1edb354970084deffa54`. The 2026-09-22 pass recorded only the PREFIX `783058fd…` for qou's copy, so the full digest is still owed against qou in step (b).

The seven WHO PDFs already have archived copies at `fsh-guts/uploads/` here (the 2026-09-30 `q7ey` retirement), so step (a) added none of them.

**Blocked on access:** this session's request to attach `litlfred/qou` was refused by the permission classifier, so steps (b) and (c) need the owner to allow `add_repo` for qou, or another session to do them.

## Step (b), main side, 2026-10-03, after #2005 merged

Re-verified on folio-assistant main `f10ad6db4107fb6c5c9f0d8ee7766436206db3f9` by https://claude.ai/code/session_013Pdniq3SSCRvxhsN4E5aFi. Each digest was computed from the blob on main and compared with the `source.sha256` in that entry's `structure.json` on main:

| qou file | bytes | sha256 | kept copy on folio-assistant main | vs library |
|---|---:|---|---|---|
| `9789240010567-eng.pdf` | 4,500,531 | `a4804f85ebb5c223f8e25442b4fa7b8bbbf6536ff1f8c281460423a764589157` | `fsh-guts/uploads/9789240010567-eng.pdf` | match |
| `9789240081949-eng.pdf` | 1,611,431 | `af6fd10ed03d5ee370499eb555d769d287e64f0f935dc9f0ea63f3af973e060a` | `fsh-guts/uploads/9789240081949-eng.pdf` | match |
| `9789240093362-eng.pdf` | 2,787,054 | `0d47d98390b1451d01fafd27b017a6edcccf6effda4830d531b685b4cc85114a` | `fsh-guts/uploads/9789240093362-eng.pdf` | match |
| `9789240120747-eng.pdf` | 1,585,035 | `c710f7cf4a432221b30d7db9272f10e17250c59b14ed33c5405e86695b2edec8` | `fsh-guts/uploads/9789240120747-eng.pdf` | match |
| `9789241509510_eng.pdf` | 3,337,054 | `26aa12fbae4eafb2982a6e19efa9bb692adb4aa5bf74274c609f1a9c61852b11` | `fsh-guts/uploads/9789241509510_eng.pdf` | match |
| `9789241511766-eng.pdf` | 3,428,746 | `934bdf1193c16ee539a90dd4a8c3e98e004b4a01680902b3401b5acf829a52c5` | `fsh-guts/uploads/9789241511766-eng.pdf` | match |
| `WHO-RHR-18.06-eng.pdf` | 403,774 | `44be3640bb1730da309256d74090968e757bb10371b4367e97b75248c49998e6` | `fsh-guts/uploads/WHO-RHR-18.06-eng.pdf` | match |
| `Home _ folio-assistant.pdf` | 7,341,534 | `783058fd36feb3cb2618b43fc236b37d3f10a096d5af1edb354970084deffa54` | `fsh-guts/uploads/Home-_-folio-assistant.pdf` | (not ingested) |

Every digest starts with the prefix the 2026-09-22 pass recorded for the qou file.

**Still owed before anything is removed from qou:** the full sha256 of each of the eight qou files must equal the digest above. This session cannot reach litlfred/qou: `add_repo` was refused by the permission classifier. Steps (b, qou side) and (c, the qou PR, which the owner merges personally) are **blocked on qou access**. If any digest differs, nothing is removed.
