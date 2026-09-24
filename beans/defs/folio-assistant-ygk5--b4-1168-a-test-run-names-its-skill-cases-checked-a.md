---
# folio-assistant-ygk5
title: 'B4 (#1168): a test run names its skill; cases checked against the skill''s contract'
status: in-progress
type: task
created_at: 2026-09-24T05:34:30Z
updated_at: 2026-09-24T05:34:30Z
parent: folio-assistant-tr05
---

Part of s4sp (plan B4). TestRun.skill (required, SkillName) and optional cases[{input,output}]. crdm-detect gets input/output contracts (owner chose 'Also write a contract'); the eval records skill + all 27 cases. scripts/test-run-conformance.ts validates cases with Zod fromJSONSchema (no second schema, bean 319n). kg-audit: test-run-skill-resolves, test-run-conforms, test-run-checkable. tool-coverage reads contracts through the skill.
