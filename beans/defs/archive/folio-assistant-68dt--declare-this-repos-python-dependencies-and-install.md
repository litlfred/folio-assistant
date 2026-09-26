---
# folio-assistant-68dt
title: Declare this repo's Python dependencies, and install them in CI
status: completed
type: task
priority: normal
created_at: 2026-09-19T16:19:49Z
updated_at: 2026-09-20T04:15:37Z
parent: folio-assistant-slw1
---


## What

`pdf-structure.py` needs PyMuPDF. `pdf-ocr.py` needs tesseract. Image
extraction needs pypdf + Pillow. **Nothing in this repository says so.** There
is no `requirements.txt` and no `pyproject.toml`, and CI installs only `ruff`.

## Why it matters now

Measured 2026-09-19 while scoping `d5f1`: reaching a working image extractor in
a fresh container took three installs — `pypdf`, then `cffi` (its absence made
`cryptography` panic under pyo3 on *import*), then `Pillow`. None of that is
discoverable from the repository; each was found by hitting the error.

The consequence is worse than inconvenience. A Python tool here can only be
tested in CI if CI has its backend, so an arm needing one must either ship an
**untested path** — the `5rfy` "gate that never fires" defect — or not ship.
That is what `d5f1` and `1r0p` are waiting on.

## Not just a convenience file

Declaring them also makes `--check-deps` meaningful: today it probes a set
someone typed, which can drift from what the scripts actually import.

## Done when

The Python dependencies are declared in one place, CI installs them, and a
check fails when a script imports something undeclared.

## Waiting on

A decision from the owner, asked 2026-09-19: declare and install in CI, or
accept that PDF/image/audio arms cannot be tested here. Not started.

## 2026-09-20 — reframed and answered: two Tools, not one repository-wide yes/no

The owner's call: **set up two Tools in the KG, one stdlib-only and one with
extensions, both satisfying the same skill, each explaining how and why to use
it — so a new agent knows which to reach for.**

That dissolves this bean as posed. "Declare Python dependencies and install
them in CI" is a repository-wide yes/no that **no reader of a skill can see**.
The dependency posture is now a property of a named Tool node.

`ingest-stdlib` — `install: { none: true }`, covers archives, CSV and
spreadsheets, technical metadata, and the content sniff that routes a file
(including the OOXML/ODF container check). Runs in CI.

`ingest-extended` — PyMuPDF, pypdf + Pillow, tesseract. Covers PDF outline,
page text, OCR, images. Does NOT run in CI here.

Both `satisfies: ["library-ingestion"]`, each `alternativeTo` the other, each
carrying `selection` with `when` / `limits` / `cost`.

### What I had to add, and the measurement that changed the design

The `ToolDefinition` schema already supported two Tools on one skill — the
`beans-cli` / `beans-manual` pair is the standing example. What it had no home
for was the **judgement**: which to reach for and what each costs.

My first design derived "these are alternatives" from a shared `satisfies`.
**Measurement refuted it: 12 of this instance's 25 skills already carry more
than one Tool, and nearly all are COMPLEMENTARY** — `workflow-list`, `-start`,
`-next`, `-gate`, `-complete` are five steps of `process-state`, not five ways
to perform it; the five translation tools likewise. Exactly one pair was
genuinely substitutable. A rule keyed on "shares a skill" would have demanded
comparative prose on twelve skills with nothing to compare.

So substitutability is **declared** (`alternativeTo`) and **symmetric**, with
`check-tools.ts` verifying both that each id resolves and that the relation is
mutual — a one-sided declaration means the agent arriving at the silent end
never learns a choice exists, which is the failure occurring half the time.
`selection` is required once `alternativeTo` is non-empty, enforced on the
schema because it needs nothing outside the node.

`selection` is separate from `description` because `description` is projected
VERBATIM as the MCP tool description and into the exported graph: it answers
"what does this do", and comparative install-cost prose there degrades the
surface an agent reads when choosing.

### Also backfilled

`beans-cli` / `beans-manual` now carry the relation and their `selection`,
which moves `skills-and-tools.md`'s two-row prose table onto the nodes where an
agent reading the KG actually finds it.

### A defect the gates caught

Both ingest nodes first used `FilesystemPath` for their input, and
`check:tools` refused it: that type can express a shell payload as an argv
input. `RepoPath` is injection-safe AND more accurate — an upload lives under
the declared `uploads` graph. The gate improved the design rather than just
blocking it.

Three new checks, each mutation-verified to fire: one-sided alternative,
dangling `alternativeTo`, and a declared alternative with no `selection`.

### What this bean still does NOT decide

Whether CI grows a `requirements.txt`. That stays open and is now better
informed: `ingest-extended.selection.cost` states what installing it costs, so
the decision can be read off the node. `d5f1`, `1r0p` and `ktt2` remain blocked
on that, unchanged.

## 2026-09-20 — done. Declared, generated, installed in CI, and checked both ways

`schemas/python-deps.ts` is authoritative; `requirements.txt` and
`requirements-extended.txt` are generated from it; CI installs the lean set.

### The surface was three times what I assumed

I had been saying "PyMuPDF, tesseract, pypdf+Pillow". A real AST scan over
`scripts/**/*.py` found **nine** third-party imports: `pymupdf`, `pypdf`,
`pdfplumber`, `pdfminer.six`, `lxml`, `requests`, `PyYAML`, `cryptography`,
`camelot-py` — plus two transitive (`pillow`, `cffi`).

**The first scan was wrong in a way worth recording.** It reported 13, because
five of them — `translation_config`, `translation_security` and the three
`pull_*_translations` — are FILES BESIDE THE IMPORTER in
`scripts/translation/`, imported flat. Declaring them would have put five
phantom packages in `requirements.txt`. A name is third-party only when it is
not stdlib, not underscore-prefixed, and **not a `.py` in the importer's own
directory**.

**And the checker caught me.** I omitted `cryptography` from the first draft of
the declaration because it is installed system-wide here — which is exactly how
an undeclared dependency is born. `check:python-deps` refused it.

### Two tiers, because one package costs more than the other ten together

Measured by installing each set into a scratch target:

| set | wheels | size | time* |
|---|---|---|---|
| lean | 12 | **144 MB** | 5.6 s |
| lean + extended | 16 | **467 MB** | 15.3 s |

`camelot-py` is 912 KB of that 323 MB difference — the rest is numpy, pandas
and OpenCV, for ONE script. `pdf-tables.py` is live (two skills document it,
`fj94` has 38 tests), so it is declared and kept out of CI with the cost
stated, not dropped.

*Lower bound, not a CI figure: warm index, every wheel cached. Said so in the
module docstring rather than letting the number read as a promise.

### The defect only a working backend could reveal

With the lean set installed, `ingest-document.ts` still refused every PDF —
now with `probe produced no JSON`. Cause: `probe()` imported **`fitz`**, the
deprecated PyMuPDF alias, which imports fine and prints a deprecation warning
**to stdout** before the payload. `JSON.parse` of the whole stream then failed.

My 2026-09-19 retraction ("`apui` is not broken, the message is accurate") was
correct **for that environment** — with neither module installed, `fitz` failed
to import and "no PDF backend" was true. Installing the dependency is what
exposed the real bug underneath it. `pdf-pages.py` and `pdf-structure.py`
already used the canonical name; `probe()` was the holdout.

Fixed twice over: import `pymupdf`, and parse the LAST line that is JSON rather
than assuming the tool is the only thing writing to stdout.

### First end-to-end evidence that the rung selection is right

    milnorlink.pdf          rung: pdf-structure
    9789241548960_eng.pdf   rung: pdf-structure
    WHO_PUB_TPS_93.1.pdf    rung: pdf-ocr+pdf-pages

The router identified the 121-page scan as needing OCR unaided. And it found a
discrepancy: `milnorlink` is committed at PAGE granularity though its PDF has
35 outline entries — bean `8shg`, deliberately not chased here.

With no backend the stdlib arm still routes archives and CSV correctly and the
PDF path refuses honestly, so the `ingest-stdlib` / `ingest-extended` split is
real rather than asserted.

### Also

`ingest-extended.install` now points at the generated requirements instead of a
hand-written pip line — that line was a second spelling of the declaration and
had already drifted, omitting `cryptography`.

Two gates registered and wired: `check:python-deps`, `deps:python:check`. Four
mutations, each verified to fire. `bun run gates --all` is 43 now, up from 41,
picked up with no edit to any list.

### What this unblocks

`d5f1`, `1r0p` and `ktt2` are no longer blocked on a missing backend for their
PDF paths. `ktt2` still needs an independent translator, which is a separate
capability and unchanged.
