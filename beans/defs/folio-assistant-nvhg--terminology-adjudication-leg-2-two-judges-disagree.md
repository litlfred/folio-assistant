---
# folio-assistant-nvhg
$schema: bean/1.0.0
title: 'TERMINOLOGY / adjudication leg 2: two judges disagree about a mapping (from 2i5f)'
status: todo
type: task
priority: normal
created_at: 2026-10-24T08:35:00Z
updated_at: 2026-10-24T09:55:00Z
parent: folio-assistant-npuo
---

Split out of `2i5f` on the owner's 2026-10-24 ruling (Q7, "A + B"). Leg 1 of `2i5f` is built (#1846). This is leg 2: two judges (for example an automated matcher and a person, or two terminologies) disagree about whether a candidate term maps to a concept.

## Waits on
Non-zero `mapped` on either target of `bun run cat check:term-mapping`. On 2026-10-24 it reported 3,751 candidates, with 0 mapped on `skos` and `fhir`. A disagreement about a mapping needs a mapping. Bean `q7ds` (the connected agent runs the FHIR target against OCL) is the first thing that could produce one.

_2026-10-24 (`q7ds` connected-agent run)_ — Ran `bun run cat check:term-mapping` on the current graph (**3,989 candidates**) and probed `https://api.openconceptlab.org` over open internet:
- `api.openconceptlab.org` (`v2.3.234-3e606025`) is reachable over TLS (`GET /version/` returns `200`), but all anonymous collection/source/concept queries (`/orgs/`, `/sources/`, `/collections/`, `/concepts/`, `/mappings/`, `/orgs/WHO/*`) return **`HTTP 403` (`{"detail": "Authentication required. Anonymous API access is disabled."}`)**.
- Against the declared & pinned `who-smart-base@v1.0.0` snapshot (`cat-harness/external-schemas/who-smart-base.terminology.json`, 12 CodeSystems, 585 concepts) — and also verified against all 33 published CodeSystems (1,892 concepts) across `smart.who.int/{base,trust,immunizations}` — the determined counts are:
  - **`skos`: `0 mapped, 3989 unmapped, 0 undetermined`**
  - **`fhir`: `0 mapped, 3989 unmapped, 0 undetermined`**
- Entry condition (non-zero `mapped` on either target) remains **not met**: all 3,989 candidates are harness meta-assets rather than clinical concepts in the pinned WHO SMART Base / DAK CodeSystems (see [`litlfred/cat-harness-tools#722`](https://github.com/litlfred/cat-harness-tools/pull/722) and [`litlfred/cat-harness#535`](https://github.com/litlfred/cat-harness/pull/535)).

## Done when
- [ ] case 2 CALLS `adjudication` and `untainted-verification`, restating neither (from `2i5f`)
- [ ] the owner rules whether a term mapping keeps its dissent or collapses (from `2i5f`)

Session https://claude.ai/code/session_01FABZmtqnNeBaTcHsXrtyK7.

_2026-11-01T20:50Z_ — Moved under folio-assistant-npuo: the old epic closes (owner card Q-DQ-1 A). Session https://claude.ai/code/session_01Qmmkt7h4RWc6UwiBW5kbZ2
