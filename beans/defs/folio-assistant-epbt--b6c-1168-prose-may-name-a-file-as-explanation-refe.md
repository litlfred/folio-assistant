---
# folio-assistant-epbt
title: 'B6c (#1168): prose may name a file as explanation, references go in data — rule + advisory stale-name criterion'
status: in-progress
type: task
priority: normal
created_at: 2026-09-24T18:07:57Z
updated_at: 2026-09-24T18:07:57Z
parent: folio-assistant-tr05
---

## Owner decision 2026-09-24
"Rule + stale check": keep explanations; state the rule in data-modelling.md; add an advisory (minor, not gated) kg-audit criterion that flags a file named in a general node's prose that no longer resolves.

## Measured
22 diagrams' <bpmn:documentation> name 29 implementation files; GraphKindDef's field docs name 4 modules.

## Done when
- data-modelling.md states the rule (arrow rule governs data/references; prose may name a dependent as explanation).
- kg-audit criterion `prose-names-resolve` (minor) over processes' documentation and @general declarations' doc comments; three states (resolves / not a path / does not resolve), could-not-determine never a pass.
