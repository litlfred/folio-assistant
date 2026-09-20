---
# folio-assistant-3psh
title: check:l1-complete cannot see an ORPHAN directory inside a library entry
status: todo
type: task
priority: normal
created_at: 2026-09-20T15:28:09Z
updated_at: 2026-09-20T15:28:22Z
parent: folio-assistant-slw1
---


Found 2026-09-20 by causing it, then fixing the cause and finding the
artefact still there.

`pdf-images.py` derived the doc id differently from `pdf-structure.py`, so for
three arXiv papers it wrote `images.json` into a SIBLING directory of the entry
it belonged to. That is fixed. But the same shape can arrive by any arm taking
`-o <library-root>` with a doc id the entry does not have, and **nothing
reports it**:

- `check:l1-complete` walks a library's children and treats each as an entry.
  The orphan has no `structure.json`, so it is not an entry — it is skipped, and
  a skip looks exactly like a clean pass.
- When the orphan lands INSIDE a real entry (which is what happened after the
  entry was renamed to the canonical id) the entry itself passes every
  requirement, because no requirement says what an entry may NOT contain.

Both duplicates were byte-identical to the entry's own `images.json` apart from
`doc_id`, and both were committed before anyone noticed.

## Done when

- [ ] An entry's directory contents are CLOSED: `sections/`, `blocks/`, `ocr/`,
      `images/` and the known sidecars. Anything else is a finding, not a file
      to ignore.
- [ ] A directory directly under a declared `library/` with no `structure.json`
      is REPORTED rather than skipped — today it is indistinguishable from
      "nothing is wrong here".
- [ ] Both fire on a fixture built to have the defect, so the guard is not
      vacuous.

## Why a closed set rather than a denylist

The orphan was named `260725032v1` — a perfectly plausible doc id. Nothing
about the NAME was wrong; what was wrong was that it was there at all. A
denylist would have to predict the next arm's spelling, which is the drift this
whole cluster of defects is made of.
