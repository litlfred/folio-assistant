---
# folio-assistant-8iqc
title: 'Library QA after ingestion: titles, bibliographic metadata, placeholder blocks and summary backlog are never judged'
status: in-progress
type: feature
priority: normal
created_at: 2026-10-01T16:39:43Z
updated_at: 2026-10-01T18:43:42Z
parent: folio-assistant-slw1
---

Issue [#1794](https://github.com/litlfred/folio-assistant/issues/1794).

A library entry is never judged after ingestion or the KG build. Measured on main (59 entries): 24 titles equal the slug, at least 5 are implausible (who-pub-tps-931 is 'Abies', OCR noise off a scanned cover), 0 of 59 carry author or year, and who-pub-tps-931 shows 121 'Page N (no content carried)' blocks over 25,714 OCR words.

## Done when
- `bun run check:library-qa` writes a committed qa-results/v1 sidecar under `cat-harness/test/results/` with one family per criterion of #1794 (title-missing, title-implausible, bibliographic-missing, block-no-content, summary-backlog), each finding naming the entry, its instance and the source field read.
- `check:library-qa:check` is in CI and fails only on a stale sidecar or a could-not-determine entry; findings are advisory.
- The cause of 'Abies' and of the empty blocks is traced to code and reported on the PR.


## 2026-10-01 — withheld rows in the viewer (PR #1818, stacked on #1799)
Owner ruling on #1794, option 1 ("fix the viewer now"): a withheld entry's row shows its summary when it has one, otherwise "Withheld — copyright and restrictions not granted" with a link to the catalogue record. The entry gets a banner (why, which gate, the record link, N of M sections summarised). Other empty blocks keep the neutral "(no content carried)". Withheld is read from withheld.json, which now carries structured gates[] and record{id,page,uri} written by gen-iris-pages. Row and banner code: cat-harness/scripts/lib/library-withheld-view.ts. Tests: library-withheld-view.test.ts and library-withheld-viewer.e2e.ts. Drafting the summaries is folio-assistant-r96p (todo).
