---
# folio-assistant-apui
title: 'INGEST: one pipeline entry point — uploads/ to library/ through a single documented path'
status: in-progress
type: task
priority: normal
created_at: 2026-09-16T06:43:50Z
updated_at: 2026-09-19T12:31:11Z
parent: folio-assistant-slw1
---

## What

`uploads/` and `library/` are two stages of ONE pipeline, but there is no single
entry point that takes a file across. Today the move is done by
`scripts/migrate-uploads-to-library.py` plus whatever the ingesting agent
remembers to run.

## Why it matters more than it looks

**The corpus-grep checklist searches `library/` only.** Anything still in
`uploads/` is invisible to every "has the corpus already got this?" check — so
an un-ingested paper does not merely sit unread, it makes a *clean grep* mean
"nobody has done this" when the source is right there. That is exactly how a
held result gets re-derived.

## Done when

One documented command takes a file from `uploads/` to `library/<bib-slug>/`
with structure, derived content, the Dublin Core record and the manifest, and
every other path is a wrapper around it or is deleted.

Diagram: `processes/document-ingestion.bpmn` (`Process_Ingestion`).

_2026-09-19T12:23:13Z_ — Claimed by claude/ecstatic-goldberg-eroyaz — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).

_2026-09-19T12:12:22Z_ — Re-measured 2026-09-19 before starting. The bean's description of TODAY is stale in three ways, and the third changes the size of the job.

1. It names scripts/migrate-uploads-to-library.py as the current path. That file DOES NOT EXIST.

2. It says the move is done by that script 'plus whatever the ingesting agent remembers to run'. Measured: NOTHING in the repo writes library/ at all. A grep for writeFile/mkdir/copy/move targeting library/ across scripts/, content/ and src/ returns zero. The files that mention library/ are readers — harness-dirs, repo-partition, scan-repo-content, check-declared-paths — plus two PDF helpers. git log on library/milnorlink/structure.json shows it was created by an ordinary content commit ('The Milnor voice is derived from Milnor...'), i.e. hand-authored.

3. Its motivating harm is not currently live. All four files in uploads/ already have matching library/ slugs (9789241548960_eng.pdf -> 9789241548960-eng, WHO_PUB_TPS_93.1.pdf -> who-pub-tps-931, WPR-RDO-2020-003-eng.pdf -> wpr-rdo-2020-003-eng, milnorlink.pdf -> milnorlink). So there is no un-ingested source making a clean corpus-grep lie right now. The RISK the bean describes is real; the instance is not.

So this is not 'consolidate several scattered paths into one entry point'. It is 'write the pipeline, which does not exist' — with PDF extraction, sectioning, derived content, a Dublin Core record and a manifest all to be designed, and it is the spine nine sibling beans in the INGEST epic hang off. Left unclaimed rather than started, because that is a materially bigger and more design-heavy job than the bean advertises and the owner should price it before I build it.

_2026-09-19T12:14:45Z_ — CORRECTION to the note above, same day. Point 2 of that re-measurement is WRONG and I am retracting it.

I wrote 'NOTHING in the repo writes library/ at all'. False. scripts/pdf-pages.py and scripts/pdf-structure.py both ingest into library/, and milnorlink/structure.json says so in its own structure_note: 'Ingested at PAGE granularity by scripts/pdf-pages.py'. I had that file in front of me in the grep output and dismissed it as a PDF helper.

Why the grep could not have found it, because the method is the lesson: I searched for (writeFile|mkdir|open..w|copy|move|rename) and library/ ON THE SAME LINE. pdf-pages.py writes via secdir.mkdir(...) and (secdir / f'{id}.md').write_text(...), where secdir descends from the -o library argument. The literal 'library' never appears on a write line, so a same-line pattern structurally could not match. I asserted a strong negative from a pattern that could not have produced the positive.

What is actually there — four rungs, each with a stated reason to exist:
  pdf-structure.py  primary; reads an EMBEDDED outline into real sections (--ocr, --no-sections, --json)
  pdf-pages.py      fallback when there is no outline: PAGE granularity, refusing to infer a chapter tree (bean 6xaz records two measured cases where inference was confidently wrong)
  pdf-ocr.py        recovers text where extraction fails entirely (scanned, image-only)
  pdf-tables.py     tables and figures, which pdf-structure/v1's Section does not carry at all

So the bean's ORIGINAL description was closer to right than my correction: the script name it gives is wrong, but 'scripts plus whatever the ingesting agent remembers to run' is exactly the situation — the agent must choose between pdf-structure and pdf-pages on whether an outline exists, decide whether OCR is needed first, and remember pdf-tables separately.

That makes apui tractable and small after all: ONE entry point that sequences these four with the decision rules made mechanical, and the rules written down as a skill rather than carried in an agent's head. Point 3 of the previous note stands (all four uploads have library slugs; the risk is real, the instance is not).

_2026-09-19T12:31:11Z_ — DONE (first cut). One entry point: bun run ingest uploads/FILE.pdf [--dry-run].

It CHOOSES a rung and runs it; it re-implements nothing. The rule is read off the four entries already in library/, not invented:
  toc_source: outline                       -> pdf-structure
  toc_source: none, text_source: text-layer -> pdf-pages
  toc_source: none, text_source: ocr        -> pdf-ocr, then pdf-pages --from-ocr
Verified: all four uploads resolve to the slug their existing library entry already has.

Third state: a PDF that cannot be probed is 'undetermined', exit 2, ingests NOTHING. Never 'no outline' -- a document filed under the wrong rung reads as ingested while its structure is wrong, which is 6xaz's failure mode. This container has no PyMuPDF, so all four currently report undetermined, which is the behaviour working rather than a gap.

The decision rules are a SKILL, per the owner: skills/folio-core/library-ingestion.md, in the HARNESS layer. Not folio-assist-core: uploads and library are both harness-declared graph kinds (folio is core's), so putting ingestion in core would make the harness's own library graph writable only from above it -- a wrong-direction dependency, and after the split a circular one between repos. That is what zlmp exists to drain.

Two things the gates caught in my own work, both the same defect as the bean-store one earlier today: I hardcoded '-o library' four times (check:declared-paths refused it; now read via directoryForGraph from harness.json), and I reimplemented slugify in TypeScript (it got WPR-RDO-2020-003-eng wrong; scripts/_pdf_doc_id.py is the one definition, and bean rlp5 records that three copies already existed and drifted -- mine would have been a fourth).

NOT done: --dry-run cannot be verified end-to-end here without a PDF backend, and no upload was actually re-ingested (all four already have entries). 12 tests cover the decision against fixtures.
