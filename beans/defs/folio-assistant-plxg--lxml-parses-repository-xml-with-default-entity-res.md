---
# folio-assistant-plxg
$schema: bean/1.0.0
title: 'lxml parses repository XML with default entity resolution (smart-base)'
status: todo
type: bug
priority: normal
created_at: 2026-10-31T04:20:00Z
updated_at: 2026-10-31T04:20:00Z
parent: folio-assistant-33iz
tags:
    - security
    - security-review-2026-10-31
---

**Category:** security · **severity:** minor (inputs are repository-authored) · **rule:** scz-every-input-is-suspect

**Where:** litlfred/smart-base `.github/skills/bpmn_author/validators/bpmn_xml_validator.py:37`, `swimlane_validator.py:48`, `bpmn_import/validators/swimlane_actor_validator.py:42` (`etree.fromstring`), `input/scripts/extract_translations.py:452,501` and `inject_translations.py:473,545` (`XMLParser(recover=True)`), plus `dmn_questionnaire_generator.py`, `installer.py`, `transform_dmn.py`.

**Evidence:** none of these sets `resolve_entities=False` (or uses defusedxml). lxml >= 5 resolves only internal entities by default and blocks network access, so the remaining exposure is entity expansion (billion laughs) on a crafted BPMN/DMN/translation file in a PR. The BPMN import skill is meant to take files from outside authors.

## Done when
- [ ] these parsers are built with `resolve_entities=False, no_network=True, huge_tree=False` (one shared helper)

_2026-10-31T04:20Z_ — Filed by the group C security review, session https://claude.ai/code/session_01Qmmkt67jRwiqwomTe2Sw4b
