---
# folio-assistant-hhkw
$schema: bean/1.0.0
title: 'smart-base: delete the dead parts of .github/skills/ and repair or remove the workflows that cannot fire'
status: completed
type: task
priority: normal
tags:
    - smart-base
    - github-skills
created_at: 2026-11-13T12:07:20Z
updated_at: 2026-11-13T22:15:00Z
parent: folio-assistant-95e7
---

## Why

Parent: `folio-assistant-95e7`. Measured on litlfred/smart-base@f369501: nothing in `ghbuild.yml` or any build path calls `.github/skills/`. The five workflows that do (`classify-issue`, `skill-l1-review`, `skill-l2-dak`, `skill-l3-review`, `skill-translation`) are `workflow_dispatch`-only but gate on `github.event.label` / `github.event.issue`, so they never do work. `pr-validate-slash.yml` is `workflow_dispatch`-only with an `issue_comment` `if:`, so it is always skipped; the README's claim that `/validate` runs structural validation is false.

## Done when

- [x] Deleted (no caller, or superseded): `cli/`, `Dockerfile`, `docker-compose.yml`, `skills_registry.yaml`, every `*/skills.yaml`, empty `labels/*.json`, `l1_review/`, `l3_review/`, `translation/`, `bpmn_import/actions/`, `ig_publisher/actions/strip_elm_action.py` (fhir-harness owns the ELM strippers), `common/safe_xml.py` (byte-identical to `input/scripts/safe_xml.py`).
- [x] The five label workflows and `pr-validate-slash.yml`: either given the triggers their `if:` expects, or removed. Owner's call; default is remove, since `folio-assistant-tgaj` brings validation into the KG.
- [x] `.github/requirements/build-scripts.{in,lock}` moved beside `input/scripts/` with `ghbuild.yml` and `commit-pot.yml` updated.
- [x] What remains under `.github/skills/` is listed in `folio-assistant-tgaj` / `folio-assistant-14un` as moving, not staying.
- [x] `input/pagecontent/authoring-skills.md` no longer links to `.github/skills/bpmn_layout/skills.yaml` (the IG site does not serve it).

## Resolution

Completed in https://github.com/litlfred/smart-base/pull/376 (merged `92f3881`).
