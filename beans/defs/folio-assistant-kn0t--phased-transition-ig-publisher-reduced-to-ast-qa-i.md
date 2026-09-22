---
# folio-assistant-kn0t
title: 'PHASED TRANSITION: IG Publisher reduced to AST + QA, in five phases with a stated exit criterion each'
status: todo
type: feature
priority: high
created_at: 2026-09-22T19:07:23Z
updated_at: 2026-09-22T19:23:57Z
parent: folio-assistant-uhkv
---

Reduce the IG Publisher to **AST + QA**, in phases with a stated exit criterion
each, so that publication and iteration stop depending on a full build.

Owner: *"i want to slowly get rid of IG publisher in the publication/iteration
pahse… we can use this for iterative delta's (if we dont care about
indexing/versioning so much in STAGING, we need full IG AST rereun)"*, and on
smart-immunizations: *"i dont want the /html generated... just the calculated
versions, dependcies and such the AST end"*.

## Proposed phases — NOT yet approved

| phase | does | exit criterion |
|---|---|---|
| P0 | lift `generate_smart_liquid.py`'s metadata→variables bridge, render one IG's `input/pages/` | one IG's pages render with Publisher metadata populating the variables |
| P1 | LHS navbar + menu derived from `sushi-config.yaml`'s `pages:`/`menu:` | navigation matches the Publisher's for one IG, derived not authored |
| P2 | JSON-only representations; XML/TTL dropped from the render path, refusals recorded | no representation silently dropped |
| P3 | AST dump behind a flag on the fork; staging renders from cached AST | indices/deps marked stale-until-full-run, and the mark is visible to a reader |
| P4 | Publisher invoked for AST + QA only | a release still cut from a full build, and provably so |

## The measurement that constrains P3

From `nsbb`: nothing exports dependencies among Libraries, PlanDefinitions or
Measures — 458 artefacts, 61% of smart-immunizations, the CQL/decision-logic
core, zero dependency edges. **An AST that stops at terminology does not
support the staging story.**

## Open, deliberately
- `transform_dmn.py` emits HTML, which the JSON-only contract does not take.
  Structured output, or embedded asset? Not settled.
- What "parity-ish" means as a checklist — the ceiling is a data limit.

## Done when
- [ ] the phases are approved by the owner, or replaced
- [ ] each phase has an exit criterion that is measured, not asserted
