---
# folio-assistant-eq01
title: Web 'Add files via upload' lands at the repo ROOT; 6.0 MB of images sit outside cat-harness/uploads/
status: completed
type: bug
parent: folio-assistant-5a3l
created_at: 2026-09-20T10:00:22Z
updated_at: 2026-09-20T10:00:22Z
---


Owner, 2026-09-20, on commit `89fb9f3`: *"why sitll no uploads/ dir on main?
missing .gitigore with a #donotdelete?"*

## The hypothesis is right about the mechanism and wrong about the cause

The keep-marker IS the pattern — `keepMarker()` in `schemas/cat-harness.ts`
writes a `.gitignore` opening `# do not delete me`, because git tracks files
and not directories. Both `cat-harness/uploads/` and `cat-harness/library/`
carry one.

**But `uploads/` is not missing.** It is at `cat-harness/uploads/`, with four
PDFs in it; the `cat-harness/` restructure moved it out of the root. No absent
directory, no missing marker.

What actually happens: GitHub's web **"Add files via upload"** commits to the
path being viewed, and at the repo root there is nothing named `uploads/` to
land in. Commit `89fb9f3` put three ~2 MB PNGs at the root that way.

## Measured on `origin/main`, 2026-09-20

```
1,886,642  ChatGPT Image Sep 20, 2026, 11_56_58 AM.png
2,049,014  ChatGPT Image Sep 20, 2026, 11_57_08 AM.png
1,929,334  ChatGPT Image Sep 20, 2026, 11_58_08 AM.png
  232,840  Publication and information products style guide-info.pdf
  201,099  Publication and information products style guide.pdf
                                    5 files, 6.0 MB
```

The three PNGs are the bootstrap theme art from `89fb9f3`; the two PDFs
predate it.

## Why a root `uploads/` is NOT obviously the fix

It would be a SECOND uploads directory. `harness.json` declares the
directories an instance scans, and a root `uploads/` is either undeclared —
two places to look, and the ingestion pipeline reads only the declared one, so
a file dropped at the root reads as absent to every consumer — or declared,
at which point the instance has two incoming queues with no rule saying which.
That is the `dh4f` shape.

Moving the five files into `cat-harness/uploads/` is the smaller change and
needs no new declaration.

## DECIDED — owner, 2026-09-20

> *"only one uploads/ needed, cat-harness __initialize__ uploads/ if not there
> as one of its steps. not keep it there permanently, but nice convention to
> developer to know whats supposed to be there. easier to copy structure."*

**One** uploads directory — `cat-harness/uploads/`, already declared in
`harness.json`. No root twin, so the `dh4f` risk above does not arise.

**Initialization creates it when absent.** Done: the session-start hook now
runs `harness-dirs.ts`, the writer. `materialiseDeclaredDirectories` already
existed and `init-folio` already called it for a NEW folio — the platform's
own tree was the one case with a declaration and no step honouring it.

The point is the CONVENTION being discoverable, not the files persisting: a
created directory gets the `keepMarker` `.gitignore`, which ignores nothing and
exists to say what belongs there. Verified by deleting `cat-harness/uploads/`
and running the hook — it came back with the marker naming it as the ingestion
queue — then restoring the four PDFs byte-for-byte.

**Still open: the five files at the root.** 6.0 MB that nothing references.
Moving them into `cat-harness/uploads/` is the smaller change; not done,
because moving somebody's uploaded artefacts is a durable-artefact decision
and the owner has not said to
(`deletion-requires-confirmation`).

## Done when

- [x] initialization creates a missing declared directory, with its marker
- [x] the root-level files are moved into `cat-harness/uploads/` — owner,
      2026-09-20: *"move/leave root level uplaods in uploads/"*

## Related

| | |
|---|---|
| the keep-marker convention | `keepMarker()`, `schemas/cat-harness.ts` |
| declared-but-absent directories | `dh4f` |
| the report-never-act rule | `deletion-requires-confirmation` |

_2026-09-20T11:15Z_ — Moved, with `git mv`, and **the count was four times what
this bean recorded.**

This bean measured 5 files / 6.0 MB at 10:00Z. By 11:10Z it was **11 files /
17.2 MB** — more web uploads had landed in the hour between writing the bean
and acting on it. Re-measured before moving rather than trusting the number I
had written down an hour earlier, which is this repository's own rule turned on
its own bean.

`cat-harness/uploads/` now holds 15 files, 27 MB. No collisions; every move was
a rename, so history follows.

**One of them is referenced by a SIBLING's open bean**, `tfo1` (*"INGESTION: a
skill that takes 3 avatar/theme layouts"*), which records these files as
EVIDENCE — their sizes, their sha256s, and the finding that two are
byte-identical. Moving them does not undercut that argument; it is that
argument, since `uploads/` is the ingestion queue those files were never put
through. A dated note was added to `tfo1` saying where they went. Its status is
untouched: never resolve a sibling's bean.

While moving, `tfo1`'s duplicate finding was independently confirmed —
`sha256 30dad51dfc691587…` for BOTH `ChatGPT Image Sep 20, 2026, 08_26_47
AM.png` and `d1a26515-9bde-455d-84bc-2e5fc196b004.png`, exactly as it recorded.

**The habit is not fixed, only its output tidied.** GitHub's web "Add files via
upload" still commits to the path being viewed, so the next batch lands at the
root again. That is what `tfo1`'s ingestion skill is for.
