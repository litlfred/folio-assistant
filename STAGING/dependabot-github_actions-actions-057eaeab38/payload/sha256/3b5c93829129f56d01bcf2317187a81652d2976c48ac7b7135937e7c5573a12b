---
# folio-assistant-d08l
$schema: bean/1.0.0
title: 'CONNECTED AGENT: fetch WHO''s 2016 antenatal care guideline from IRIS for the L1 evidence sections (0lde network block)'
status: completed
type: task
priority: normal
created_at: 2026-10-24T08:24:20Z
updated_at: 2026-10-24T13:54:00+02:00
parent: folio-assistant-qvxh
---

Owner, 2026-10-24 08:23Z, on the 0lde evidence-source question: *"A but you make bean for agent connected"*. Option A was to ingest WHO's 2016 antenatal care guideline, the one the ANC DAK is built on, as the evidence the four L1 sections compute from: key-questions (PICO), evidence-retrieval-and-synthesis, certainty-of-evidence (GRADE) and evidence-to-decision.

Cloud sessions can't reach iris.who.int: the container proxy refuses it (measured 2026-10-24, along with cochranelibrary.com and ncbi.nlm.nih.gov). The connected agent, the owner's local agent with ordinary internet, does only the download. Everything after it (sectioning into `smart-base/library/`, a declared graph, the four sections' `computedFrom`) needs no network, so 0lde resumes in any session.

Nothing in `smart-base/library/` today is a clinical guideline with GRADE tables (all 12 documents are digital-health handbooks), so this is the first one.

## Steps

1. From WHO IRIS, download *WHO recommendations on antenatal care for a positive pregnancy experience* (WHO, 2016; ISBN 9789241549912) as a PDF.
2. Check whether the main PDF itself carries the GRADE certainty ratings and the evidence-to-decision summaries. If they are in a separate web supplement or annex, download that too. Do not guess: write down what each file holds.
3. Commit the PDF(s) unchanged to litlfred/folio-assistant `fsh-guts/uploads/` (the incoming queue the DIIG figure already reads from). Add a note giving each file's IRIS handle or URL, licence (WHO's IRIS licence, normally CC BY-NC-SA 3.0 IGO), download date and SHA-256.

## Done when
- [x] the guideline PDF, plus any annex holding the GRADE and evidence-to-decision tables, is committed with that note
- [x] 0lde carries a note pointing at the commit and saying which file holds which of the four evidence kinds

Session https://claude.ai/code/session_01Bye99WLJxQpyCxh2eMgW19.

## Results (2026-10-24, connected agent)

Committed all three English PDFs from WHO IRIS handle **`10665/250796`** (`https://iris.who.int/handle/10665/250796`, ISBN `9789241549912`, licence `CC BY-NC-SA 3.0 IGO`, downloaded `2026-10-24`) plus their `folio-fsh-guts/v1` provenance `.md` sidecars to `litlfred/folio-assistant` branch `cat/cat-harness/fsh-guts` at **`cf2b8bd4663cf51435443a1ec4942d260a8060c8`**:

1. `fsh-guts/uploads/9789241549912-eng.pdf` (`3,903,602` bytes, 172 PDF pages / printed pp. `i–xvi, 1–152`, SHA-256 `338300b76172d410b91048209305fac53e1166c3be295a18b3f2c0c7c6b54182`, bitstream `9dccde13-3593-4a22-9237-61abe5a3c6b7`)
2. `fsh-guts/uploads/9789241549912-webannexes-eng.pdf` (`229,714` bytes, 24 PDF pages / printed pp. `i, 1–20`, SHA-256 `2be50b7493beb2bcced1f533aabc11123d40931381a6b449a6ecacc60deb2a0a`, bitstream `76cde7e1-2b67-4318-9b0e-fe3bf9b103e4`)
3. `fsh-guts/uploads/9789241549912-websupplement-eng.pdf` (`7,281,711` bytes, 129 PDF pages / printed pp. `i–viii, 1–120`, SHA-256 `e7b751d90bc6b0ea4aed09718de979dea272241c89300082454c39a0ee73908c`, bitstream `b87b9d47-74bc-4330-a79a-10ee1151a13d`)

Mapping of the four L1 evidence kinds across the three files is recorded in the `.md` sidecars and on `folio-assistant-0lde`.

## Log
- 2026-10-24T13:42:30+02:00 — Claimed (`status: in-progress`) by Antigravity (`44190586-6f7e-4f91-bace-14f09541fa6a`). Fetching WHO 2016 ANC guideline + GRADE/EtD web annexes from WHO IRIS and committing to `fsh-guts/uploads/`.
- 2026-10-24T13:54:00+02:00 — Completed (`status: completed`): committed 3 PDFs + provenance notes to `cat/cat-harness/fsh-guts` (`cf2b8bd466`) and recorded the file/section mapping on `0lde`.
