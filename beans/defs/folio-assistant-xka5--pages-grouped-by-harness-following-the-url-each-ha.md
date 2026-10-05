---
# folio-assistant-xka5
title: Pages grouped by harness, following the URL; each harness owns its sub-doc graphs
status: completed
type: task
priority: normal
created_at: 2026-10-05T14:39:33Z
updated_at: 2026-10-05T21:45:52Z
parent: folio-assistant-9rq1
---

Owner, 2026-10-05, asked how to group the 79 top-level pages: 'dont want additional categorization that will drift, needs maintain. do it by harnesses to follow urls <base>cat-harness/docs/<harness>. each harness is responsible for managing its own sub doc graphs (if any) which then make up the hierarchy'. Also: '(and alphabetization//locale dependent)' — order within a level alphabetical by the page language's collation (Intl.Collator), not by hand-kept nav_order.

Measured today: just-the-docs 0.12, order by nav_order then title; 79 top-level entries, 42 with no nav_order (35 of them proposals/*.md), many ties.

## Done when
- [ ] the Pages list's top level is the harnesses, derived from the URL, never a hand-kept list
- [ ] below a harness, its own declared sub-doc graphs make the hierarchy
- [ ] order within a level is alphabetical in the reader's locale
- [ ] no category exists that someone has to maintain

_2026-10-05T16:20:38Z_ — Claimed by claude/vibrant-darwin-r6im60 — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).

Landed in #2215 (merged, main dca45031b7): pages grouped into start/concepts/guides/process/fhir as named doc-group sub-graphs, locale-sorted nav, no redirects (owner's choice).
