---
# folio-assistant-d08l
$schema: bean/1.0.0
title: 'CONNECTED AGENT: fetch WHO''s 2016 antenatal care guideline from IRIS for the L1 evidence sections (0lde network block)'
status: todo
type: task
priority: normal
created_at: 2026-10-24T08:24:20Z
updated_at: 2026-10-24T08:24:20Z
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
- [ ] the guideline PDF, plus any annex holding the GRADE and evidence-to-decision tables, is committed with that note
- [ ] 0lde carries a note pointing at the commit and saying which file holds which of the four evidence kinds

Session https://claude.ai/code/session_01Bye99WLJxQpyCxh2eMgW19.
