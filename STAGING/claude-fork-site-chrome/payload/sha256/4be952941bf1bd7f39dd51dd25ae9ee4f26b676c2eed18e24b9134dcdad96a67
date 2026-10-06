---
# folio-assistant-yc74
title: 'arXiv licence vocabulary: ingest arXiv''s licence pages and make archiving-arxiv able to fill a licence.json'
status: in-progress
type: task
priority: normal
created_at: 2026-10-02T23:38:48Z
updated_at: 2026-10-02T23:42:50Z
parent: folio-assistant-zzmr
---


## Brief

Owner, 2026-10-02: *"ingest docs and add to doc ingestion skills for arxiv papers"*,
with arXiv's two licence pages attached. Queued beside the train-6 rebuild rather
than pivoting, per the standing instruction.

## Why it was worth doing

`archiving-arxiv` already said the right thing — *"arXiv hosting does not imply a
redistributable licence"* — and then stopped, naming no licence, no identifier and
no way to tell the cases apart. An agent at intake could read that, agree with it,
and still have no idea what to put in `licence.json`.

## What was measured first, not assumed

- `schemas/source-licence.ts` is `{status, id, basis, searched[], note}`; `stated`
  requires `id` + `basis`, `unknown` requires `searched`. Read, not recalled.
- `IntakeSchema.licence` carries the SAME record by deliberate design — bean
  `7bg9`'s own rule, *read the existing vocabulary before designing a field*.
- Beans `7bg9` and `i2kp` are both **completed**: the licence subprocess and the
  `--check` mode already exist. So this needed **no code**, and a second
  arXiv-shaped licence vocabulary is precisely what `7bg9` forbids.
- This checkout has a tracked `uploads/` governed by `document-ingestion`, and no
  `library/` — so the captures queue, and nothing lands as an L1 entry here.

## What landed

Two captures under `uploads/`, each in its own directory so one intake record
covers one file, both validated against `IntakeSchema`. Both record their own
licence as `unknown` with a `searched` list: arXiv's CC0 dedication covers article
**metadata**, not arXiv's website text, and recording the licence a page
*describes* as the licence that page *carries* is a category error.

`archiving-arxiv` gains the licence set with the id to record for each, and the
four readings that look right and are not:

- an **arXiv licence is not an open licence** — the grant runs to arXiv;
- **absence is not permission** — pre-2004 is an assumed licence, so the record is
  `stated`, never `unknown`;
- the **licence belongs to the version**, which sharpens the page's own opening
  argument: v1 and v4 may differ, and no gate can catch the mismatch because both
  facts are individually true;
- the **metadata field may understate the rights** — page one of the PDF can carry
  the operative statement.

Plus two facts that unblock work rather than restrict it: article metadata is
always CC0, so a source that cannot be redistributed can still carry a complete
`dcterms` layer; and the choice being irrevocable per version means a recorded
licence never needs re-checking.

Two of the identifiers have **no SPDX id**, which is what the schema's "SPDX where
one exists" was written for — the licence URI is recorded rather than a
plausible-looking string no registry resolves.

## Done when
- [x] both captures carry an `intake.json` that validates against `IntakeSchema`
- [x] `archiving-arxiv` states the id to record for each licence arXiv offers
- [x] no new licence vocabulary, no change to `check:source-licence`
- [ ] gates green and the PR merged
