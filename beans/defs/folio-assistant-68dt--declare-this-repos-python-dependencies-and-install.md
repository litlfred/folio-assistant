---
# folio-assistant-68dt
title: Declare this repo's Python dependencies, and install them in CI
status: todo
type: task
created_at: 2026-09-19T16:19:49Z
updated_at: 2026-09-19T16:19:49Z
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
