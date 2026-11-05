---
# folio-assistant-dkqd
$schema: bean/1.0.0
title: Say 'work item', not 'bean', in prose; generate a glossary of node kinds and harnesses
status: completed
type: feature
priority: normal
tags:
    - vocabulary
    - glossary
created_at: 2026-11-04T06:55:38Z
updated_at: 2026-11-05T06:32:47Z
parent: folio-assistant-yj32
---

## Asked (2026-11-04)

"Instead of saying Bean in the documentation text can we instead Work Item and make sure it's in the glossary somewhere. I don't think we have a auto-generated glossary of node kinds and harness yet, That should probably be added."

Answers to the two cards: **prose only** (literal names `beans` CLI, `beans/`, `beans:claim`, `cat/<harness>/beans`, Tool ids stay, in code font) and **build the generator here** (cat-harness-tools attached).

Follows the #991 review (bean-blind runs: harness vocabulary must stay out of content KGs).

## What is known

- `glossary/glossary-ledger.json` holds 61 concepts, all `role/…`. No node-kind or harness terms.
- All 55 `schemas/kinds/*.schema.json` carry title + description; `bean-defs` already says "Work items".
- Glossary generation is cat-harness-tools `scripts/glossary-export.ts` / `gen-auto-docs.ts`.

## Plan

1. cat-harness-tools: generate glossary terms for node kinds (kind schemas) and harnesses (instance declarations) alongside roles.
2. cat-harness: kind titles say "Work item(s)"; prose "bean" → "work item"; a check that refuses prose "bean" outside code spans.

## Not doing

Renaming identifiers (CLI, paths, branches, Tool ids); the #991 sub-graph move.

## Falsified if

The generated glossary lacks a "Work item" entry, or the prose check passes a file that says "bean" outside code.

_2026-11-04T06:57:32Z_ — Claimed by claude/work-item-vocabulary — pushed to cat/cat-harness/beans so sibling sessions see it before this branch has a PR (bean 35nj).

## Progress (2026-11-04 21:00Z)

- cat-harness-tools#1478 (merge first): glossary of graph kinds, node kinds (Work item narrower than Memory record) and harnesses; check:retired-prose-words.
- cat-harness#1030: glossary data, 266 files of prose renamed, retired-prose-words code list, todo-manager/agent-memory say a work item is a memory record.
- Not done: BPMN names/documentation; the work plan ↔ process instance model (owner decision pending).


## Done (2026-11-05)

Merged by the owner's go-ahead: litlfred/cat-harness#1030 (538b895) then litlfred/cat-harness-tools#1478 (ec4be2c). Follow-ups split out: BPMN names/documentation still say "bean"; the work plan model is folio-assistant work item opened below (owner chose "the epic is the plan").
