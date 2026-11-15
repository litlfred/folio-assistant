---
# folio-assistant-a99o
$schema: bean/1.0.0
title: 'Memory: Platform-only gates report not-applicable in instance joined runs: cat-harness-tools#1701, PR #1705 (thread "Make platform-only gates report not appl...'
status: completed
type: task
priority: low
created_at: 2026-11-08T10:41:27Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `na-gates-1701-2026-11-08.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Platform-only gates report not-applicable in instance joined runs: cat-harness-tools#1701, PR #1705 (thread "Make platform-only gates report not applicable"); Q-NA-1 answered B

Thread cmsg_017WNUkNK8kdDziPK58Pv6G9NJsybGFy4TeHTqCMhAnu8K, 2026-11-08 (user Q-LO-2 B). Motivating case smart-ips-pilgrimage#13 (56 red gates on main, run 42455839636).
- DONE: #1705 merged 2026-11-08 12:47Z (553cef5), #1701 closed; dth-phc thread told to re-pin. Leftovers: cat-harness#1150, smart-ips-pilgrimage#51. Instances need a tools re-pin to get the gates.
- Mechanism: state:mount writes .git/branch-mounts/<key>.absent; gates read absenceAt (by path only, never by shared id like `health`) and exit 78 or print "· … not applicable here". "Content root" = no .github/workflows/code-quality-gates.yml (rootProfile); unconfirmed whether this also relaxes cat-harness-tools' own CI.
- Mount gates now judged in a new `as-mounted` step of layer-pr-checks.yml before derive:publish (takes effect after pilgrimage re-pins).
- Q-NA-1 B (user tap 10:37Z): separation:cutover site condition = not-applicable in an instance root without --site (effc3e6).
- Still red / upstream: pilgrimage undeclared IG Publisher files + README `[issues](issues)` link; cat-harness omg-bpmn-2.0 record, 62 library keywords.json, writers rewriting tracked docs; visualiser titles (fhir-harness ig-ast "IG ASTs", smart-base artifact-index, core bibliography); uml:overview scoped writers; cat-harness editor-checkers visualiser names a sci-only kind.
- Local repro recipe: copy pilgrimage to fa/, `bun cat-harness-tools/scripts/mount-from-lock.ts --root fa`, root-cat-script.py, bun install, mountState({}).
