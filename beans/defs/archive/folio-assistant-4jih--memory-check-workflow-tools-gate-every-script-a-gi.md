---
# folio-assistant-4jih
$schema: bean/1.0.0
title: 'Memory: check:workflow-tools gate (every script a GitHub workflow runs is a Tool linked to a BPMN process) — tools#1761, cat-harness#1192'
status: completed
type: task
priority: low
created_at: 2026-11-10T18:34:24Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `workflow-tools-gate-2026-11-10.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: check:workflow-tools gate (every script a GitHub workflow runs is a Tool linked to a BPMN process) — tools#1761, cat-harness#1192

User 2026-11-10 18:20Z: "is each github action a skill (so also available under MCP or CLI)?" then "A. make sure linked to processes". Thread cmsg_017WNUkNK8kdDziPK58Pv6G9GNoutbFEkQcDun1pouuzLM.

- cat-harness-tools#1761 (issue #1760, branch claude/workflow-tools-gate): gate `check:workflow-tools` (scripts/check-workflow-tools.ts), baseline scripts/workflow-tools-baseline.json keyed PER LAYER. Layer with no list = report only (IG repos not seeded). Fixed entries reported, not failed (pin skew). Process link = Tool.satisfies skill named by a `<…processes:skill ref>` in any .bpmn, or Tool.subprocesses. Also keys `pages:publish`, `site:shared-assets`; publish-gh-pages.sh takes flags.
- cat-harness#1192 (issue #1191): Tool nodes publish-gh-pages (satisfies render-kg-to-cdn) and shared-assets (docs-generation). Merge after #1761.
- ig-cache already had a Tool linked to ig-ast-cache.
- Backlog measured 11-10: fa index 311, cat-harness-tools 32 (mostly .github/scripts/layer-pr-checks plumbing), who-iris 7, bootstrap-tools 6, fhir-harness 1 (ig-release no process).
- Local run recipe: clone folio-assistant to w/fa, `bash fa/.github/mount-from-lock.sh --root fa`, bun install, replace layer dirs with `git archive HEAD` of main clones.
- 18:40Z user: "we dont need Tools/Skills for QC checks actions", asked to consolidate. Pushed: QC exempt (gate keys, --check/--verify, check-/audit-/validate-/verify- names, tests), a script a Tool's own code runs counts as covered, and .github/ CI machinery counts as QC (card option A, rec, proceeding while card open). Baseline now: index 57 (17 stale fa paths), cat-harness-tools 5.
- 18:45Z user rejected B (invoke.workflow schema field: "custom? no thanks"); card closed as A. No custom schema arms for workflows.
- 18:46Z user: "i like B.... just didnt want custom schemas". Done: Tool with invoke.shell `gh workflow run <file>` covers that workflow + reusable ones it calls; 10 ci-* Tools in cat-harness#1192 (ed4c590); .github exemption removed (tools 6142c99). After #1192: index 26 (17 stale fa paths), tools 3.
- 11-10 ~19:30Z user card: "A. Move 4 to qou, delete 8". Done as draft PRs, merge together: fa#3066 (issue #3065, branch claude/move-qou-workflows, deletes 8 + test updates) and qou#7815 (issue #7814, branch claude/qou-workflows-from-platform-2026-11-10, adds deploy-folio, discussions-maintain, atomic-mass-gen-check, witness-refresh; dispatch-only). Clears the 17 stale index paths.
- core#714? public-comment-changesets Tool (issue core#713), operation typed ChangeSetAction added in tools#1761 (61e9211). Only who-iris 3 scripts remain unlinked (WHO-adjacent; needs owner OK).
- 11-10 22:48Z: all merged (tools#1761, cat-harness#1192, fhir#337, fa#3066, qou#7815, core#714). Only who-iris 3 scripts remain; card pending in thread …GNoutbFEkQcDun1pouuzLM.
