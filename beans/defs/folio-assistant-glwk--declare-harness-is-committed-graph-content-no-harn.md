---
# folio-assistant-glwk
title: 'DECLARE: .harness/ is committed graph content no harness.json mentions'
status: todo
type: task
priority: normal
created_at: 2026-09-20T06:46:56Z
updated_at: 2026-09-20T06:47:01Z
parent: folio-assistant-zzmr
---

Measured 2026-09-20 while building the session-context record (bean `s8mo`). `.harness/` holds `interaction.json` (a person's interaction preferences, read at session start by every agent) and `issue-comments/`. Neither `cat-harness/harness.json` nor `bootstrap/harness.json` declares it.

That is the `dh4f` defect in REVERSE — committed graph content no declaration mentions, so every declaration-driven consumer scans past it. The same shape as `src/skills/` before bean `osbo`, and as the five translation subtrees before #351.

By the axis settled in `mhh9`, `interaction.json` is `context`: read during a process, never written by one, changed only when a human states a preference. So it is not a candidate for a `state` kind, and a new `interaction` kind may be the answer — or the file may belong beside the other context content rather than in a dot-directory nobody declares.

Note the history before moving anything: `.beans/` and `.harness/workflow/` were relocated out of dot-directories on 2026-09-18 (beans `8xzw`, `x89g`) because the two artefacts a person looks for first were the two hardest to find. `.harness/` is what remained.

## Done when

- [ ] decide whether `interaction.json` gets a kind, or moves
- [ ] declare whatever stays, so a consumer stops scanning past it
- [ ] `issue-comments/` answered too — it is the other half and has had no analysis at all
