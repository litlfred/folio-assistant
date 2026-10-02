---
# folio-assistant-nso8
title: 'INGEST: technical file metadata — fileinfo, sizes, hashes, timestamps, mimetype'
status: completed
type: task
priority: normal
created_at: 2026-09-16T06:43:50Z
updated_at: 2026-09-19T15:13:13Z
parent: folio-assistant-slw1
---

## What

Capture the mechanical facts about every ingested asset: file name, size,
SHA-256, mtime, and the **sniffed** mimetype rather than the one the extension
claims.

## Why the checksum is the load-bearing one

The `assets[]` decision lets a bibliography entry point at a **remote URL**
instead of a local binary. A remote asset with no checksum is an assertion; one
with a checksum is verifiable, and can be re-fetched and compared later.

## Done when

Every asset in `manifest.jsonld` carries these fields, and they are produced by
the ingest path rather than backfilled.

Diagram: `processes/ingest-derive-content.bpmn`, `Task_TechMeta`.

_2026-09-19T15:02:07Z_ — Claimed by claude/ecstatic-goldberg-eroyaz — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).

## 2026-09-19 — technical metadata, one definition

Done. `scripts/_tech_meta.py` is the one definition, shared by both rungs.

**What was actually broken.** `pdf-structure.py` already wrote a `source`
block; `pdf-pages.py` wrote none and merely merged into whatever file was
already there. So `library/milnorlink/` — the only entry `pdf-structure` never
touched — carried **no technical metadata at all**, and the other two
page-granularity entries had it only because `pdf-structure` happened to run on
them first. The no-outline rung was second-class by accident, not by design.

**The mimetype is sniffed from magic bytes and never falls back to the
extension.** Unrecognised bytes give `mimetype_sniffed: null` with
`mimetype_source: "unrecognised"` — the file was looked at, which absence alone
does not say. A guess that agrees with the filename is indistinguishable from a
real sniff, which would make the field worthless for the one case it exists to
catch: a `.pdf` that is really an HTML error page.

**`technical-metadata` moved out of `NOT_DERIVABLE` in `check:l1-complete`**
into a checked requirement (`file, sha256, bytes, mtime, mimetype_source`).
`not-derivable` is now 5, not 6: `twqe, d5f1, 1r0p, p67i, iqim`. All four
entries pass. `milnorlink/manifest.jsonld` gained `source_file` and
`source_sha256`, which it could not carry before.

**A defect this caught in my own work.** The first `--refresh-meta` reformatted
`9789241548960-eng/structure.json` from indent 1 to indent 2: a **4 349-line
diff to add three fields**. `pdf-structure.py` writes `indent=1`,
`pdf-pages.py` writes `indent=2`, and hardcoding either reformats every entry
the other rung authored. `refreshMeta` now reads the indent off the file. Three
tests pin it, and they were checked against the old behaviour — the indent-1
case fails when the width is hardcoded back.

`gen:jsonld:check` was the gate that caught the stale derived manifest.

Tests: 12 in `scripts/tests/tech-meta.test.ts`, plus two added cases in
`ingest-and-l1.test.ts` for a missing and a PARTIAL `source` block. 2 739 pass,
0 fail; tsc, eslint and all 28 CI gate lines green with an empty
`PLAYWRIGHT_BROWSERS_PATH`.
