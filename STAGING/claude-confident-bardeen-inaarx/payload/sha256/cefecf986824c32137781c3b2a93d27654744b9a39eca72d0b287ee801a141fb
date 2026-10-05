---
# folio-assistant-hxi9
title: regen input-hash cache must see the --against baseline
status: in-progress
type: task
priority: normal
created_at: 2026-10-05T05:59:45Z
updated_at: 2026-10-05T06:00:06Z
parent: folio-assistant-xpcu
---

Eight gates run `--check --against main` and judge against the latest main entry on the qa-reports branch. That entry moves on every main publish while the working tree does not, so the input-hash fingerprint (files only) could SKIP a pair whose verdict the moved baseline changes. Fix: hash the resolved baseline identity (entry key + verified payloadTree) into the fingerprint; an unresolvable baseline is undetermined, so the pair runs.

## Done when
- fingerprint() includes every --against ref's resolved identity; RECIPE_VERSION bumped
- unresolvable baseline / no resolver => undetermined (pair runs)
- tests in scripts/tests/task-pool.test.ts cover moved / unresolved / unaffected

Issue: https://github.com/litlfred/folio-assistant/issues/2156 — holder: session_01VfkKocGaQW7Msro2t5S66U, branch claude/zealous-gates-3o9ma2-against-cache
