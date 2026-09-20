---
# folio-assistant-eq01
title: Web 'Add files via upload' lands at the repo ROOT; 6.0 MB of images sit outside cat-harness/uploads/
status: todo
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

## Options, for the owner

1. **Move the five into `cat-harness/uploads/`.** One commit, no schema
   change, and the web-upload habit still lands at the root next time.
2. **Move them AND add a root `uploads/` that is declared**, so the habit has
   somewhere correct to land. Needs a rule for which queue ingestion reads.
3. **Leave them.** 6.0 MB in every clone, forever, for files nothing
   references.

Nothing is moved or deleted without the owner saying which
(`deletion-requires-confirmation`). Reported, not acted on.

## Related

| | |
|---|---|
| the keep-marker convention | `keepMarker()`, `schemas/cat-harness.ts` |
| declared-but-absent directories | `dh4f` |
| the report-never-act rule | `deletion-requires-confirmation` |
