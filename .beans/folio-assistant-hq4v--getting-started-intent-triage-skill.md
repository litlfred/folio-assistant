---
# folio-assistant-hq4v
title: 'GETTING STARTED: intent-triage skill for "create a folio"'
status: completed
type: task
priority: normal
created_at: 2026-09-18T14:49:11Z
updated_at: 2026-09-18T14:49:11Z
---

## What

`skills/folio-core/getting-started.md` — the agent protocol for a user who asks
to create a folio. Computes repository facts mechanically, routes them through
the intent decision table, and asks a **structured** question only for what the
filesystem cannot answer.

Five intents: new folio in a new repo; overlay folio-assistant onto an existing
repo; add a folio to a repo that already is an instance; create a new content
object inside the current folio (the misspeak case); ambiguous.

## Done when

Skill exists, is listed in `skills/folio-core/package-manifest.json`, names the
DMN table (`n7bz`) and the follow-on skills, and `bun run scripts/gen-skill-docs.ts --check`
passes.

Issue: https://github.com/litlfred/folio-assistant/issues/232
