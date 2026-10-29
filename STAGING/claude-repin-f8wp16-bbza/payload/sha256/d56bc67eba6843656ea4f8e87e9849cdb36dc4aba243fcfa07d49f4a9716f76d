---
# folio-assistant-ksek
$schema: bean/1.0.0
title: 'CI: green PR must mean green main'
status: in-progress
type: epic
priority: normal
created_at: 2026-10-23T08:42:44Z
updated_at: 2026-10-23T08:42:44Z
---
Owner-approved process fix, 2026-10-23. Two checks ran only after merge (Liquid undefined-variable check, workflow_run on main; Post-merge regen check and repair, push to main), so a PR could be fully green and still turn main red, and every such merge emailed the owner a failure. The rule: whatever can be judged before a merge is judged before it, on the PR's own runs, and merge-guard is the only way in. Children: (a) PR-time Liquid + regen checks, (b) layer PRs need a green folio-assistant run with the change pinned, (c) stop-the-line while a post-merge check is red on main, (d) folio-assistant PRs merge only on merge-guard success. Follow-ups found while doing (a): merge-guard does not WAIT for Feature Staging (NOT_WAITED_FOR_WORKFLOW_FILES, bean gnnj), so the in-run Liquid job is judged only once that run finishes, and closing that needs a cat-harness-tools change. post-merge-regen.yml is red for its own environment, not for main: on 6cf10d9 main's gates were green while it was red (run 39820219694). A local check-mode run on 3a52ac6 reports 13 stale checks because that job lacks publish-pages, qa-working-copy and smart:pages. Give it the gates' inputs, or narrow it to the pairs whose inputs it builds.
