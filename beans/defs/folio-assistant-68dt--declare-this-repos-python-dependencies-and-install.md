---
# folio-assistant-68dt
title: Declare this repo's Python dependencies, and install them in CI
status: in-progress
type: task
priority: normal
created_at: 2026-09-19T16:19:49Z
updated_at: 2026-09-20T03:32:31Z
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
