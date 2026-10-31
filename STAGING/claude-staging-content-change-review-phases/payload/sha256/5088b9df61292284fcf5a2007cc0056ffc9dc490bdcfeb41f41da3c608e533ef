---
# folio-assistant-75c5
$schema: bean/1.0.0
title: 'INGEST: volume-separation acceptance run on the GDZ Invent. Math. volume'
status: in-progress
type: task
priority: low
created_at: 2026-10-30T12:45:00Z
updated_at: 2026-10-31T02:41:00Z
parent: folio-assistant-slw1
---

Bean for cat-harness-tools#132. The arm and its scoring are merged (cat-harness-tools#801, `scripts/volume-separation.py`), and its 7 tests pass on main 9434d65.

## Done when
- [x] at least 3 voter model runs over the GDZ Invent. Math. volume, scored against qou's hand cut. This needs qou access, and qou PRs wait for the owner.
- [x] a span a person has confirmed becomes one entry per article, with `container` / `container_children`.

Opened on the owner's card "A. Apply all", 2026-10-30 12:39Z (thread "Finish leftovers from closed lanes"). (https://claude.ai/code/session_01Qmmkt7iaCtGYwZbW9x7eYe)

_2026-10-30T19:45Z (thread "Drain ingest beans", https://claude.ai/code/session_01Qmmkt7JwQ9cqR2roBLdqKQ)_. State of both items:
- **Item 1, on a stand-in volume.** cat-harness-tools#132 (comment 2026-10-30 11:37Z) ran 3 Claude voters on qou `library/ant-v14-n7-s` (Algebra & Number Theory 14:7, 336 pp.) because GDZ is refused here and qou `c61cfb205d` did not commit the volume. Result: 10/10 exact spans against the corrected cut (`-p10` ends at p. 333; pp. 334–336 are back matter). Files: project files `volume-separation/`. Born-digital and single-vendor, so it tests the plumbing, not scans.
- **Item 2 is already met for that volume.** qou `library/ant-v14-n7-s/structure.json` has `container: true` and `container_children` p01–p10 (hand cut). The proposal agrees with it.
- **GDZ itself** needs agy (network) and must not copy the scan anywhere (GDZ terms, recorded in `c61cfb205d`). Prompt: project files `ingest-drain-2026-10-30/agy-prompts.md` §2 (local OCR, mixed-vendor voters, commit votes/proposal/score only).
- Owner asked whether the stand-in run closes this bean (card in the thread).

_2026-10-31T02:02:00Z_ — Claimed by agy (`44190586-6f7e-4f91-bace-14f09541fa6a`).

_2026-10-31T02:41:00Z_ — Completed the GDZ *Invent. Math.* 106 (`PPN356556735_0106`, 673 PDF pages) acceptance run in `agy` (`dbe0020f-787b-4c92-b6d6-4edb17cb2aed`):
- **PR**: `litlfred/cat-harness-tools#1060` (`test/fixtures/volume-separation/gdz-invent-math-106/` + acceptance test in `scripts/tests/volume-separation.test.ts`; no scan pages, PDFs, or OCR texts copied).
- **Issue comment**: https://github.com/litlfred/cat-harness-tools/issues/132#issuecomment-6537917226
- **Results**: 3 blind voters (`gemini-2.5-flash-lite`, `gemini-2.5-flash`, `gemini-2.5-pro`) over the 673-page GDZ OCR queue (`GDZOCR` XML + `tesseract` blank-page verification). Majority vote (`>= 2/3`) quarantined all 9 of `flash-lite`'s journal-page vs PDF-page drift starts into `undetermined` and proposed **26/26 exact spans** (`starts P/R = 1.0/1.0`, `ends P/R = 1.0/1.0`) against the 26-article content-page cut (11 trailing blank verso pages excluded), **4/4 exact spans** on `qou` `c61cfb205d`'s 4 hand-cut articles (`traczyk1991-periodic-knots` PDF 80–91, `schechtman-varchenko1991-arrangements` PDF 146–201, `cherednik1991-kz-dunkl` PDF 418–438 omitting blank PDF 439, `ram1991-frobenius-formula` PDF 468–495), and `26/26` starts / `15/26` ends against the raw GDZ METS/IIIF outline (`LOG_0007`..`LOG_0049`, which attaches the 11 trailing blank verso pages to the preceding article).
