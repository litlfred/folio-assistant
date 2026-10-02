---
# folio-assistant-zacz
title: 'Merge train: a refused member gets a bean, a hand-back with a fail condition, or a dispatch'
status: in-progress
type: task
created_at: 2026-10-02T16:59:06Z
updated_at: 2026-10-02T16:59:06Z
parent: folio-assistant-nok9
---

Owner, 2026-10-02: "update skills: if a merge in queue cannot be merged for some reason, create a new bean (under appropriate epic/story…), hand it back to the sibling (use the agent-to-agent handoff process with a fail condition) for resolution, or dispatch an agent as appropriate."

Until now a merge steward handled a refused train member ad hoc, with a PR comment or a message to the owning session. The examples from 2026-10-02: #1808 and #1819 (bean `ob3m`, sibling navbar PRs), #1804 (`artefact-verification.json`), #1822 (`gen-library-jsonld.ts`, overlapping #1881), #1764 (glossary page budget exceeded in combination), and #1852 (`proposals/index.md`).

Builds on #1884 (agent-handoff), whose format and `## Fails if` this uses, and on #1802 (merge-manager SOP steps 10 and 12).

## Done when
- [ ] `merge-conflict-patterns` carries a section on a refused member: open a bean (deduped, parented), hand back with a fail condition, dispatch when nobody owns it, comment once, close when the PR lands
- [ ] `merge-refusal.bpmn` executes it, and every activity names a skill (and a bean op where it touches the work plan)
- [ ] `skill:register:check`, `readme:subgraphs:check` and `render:bpmn:check` pass

Note: epic `nok9` is copied verbatim from #1887's branch, because it is not on `main` yet.
