---
# folio-assistant-t373
title: readme:audit is in no workflow, and it does not check HTML img src — main carried 8 dead README paths
status: todo
type: bug
priority: high
created_at: 2026-09-19T10:16:09Z
updated_at: 2026-09-19T10:16:09Z
---

Found 2026-09-19 after the site root moved to `docs/<stub>/` (bean `x4a6`).

## What was broken on `main`

Eight paths in `README.md` pointed at `docs/…` locations that moved:

- `docs/guides/agent-onboarding.md` — the link the README uses to send a new
  agent to the onboarding guide, which is its single most load-bearing link
- **seven** workflow SVGs under `docs/assets/img/workflows/`

Verified dead at the old path and present at the new one, all eight.

## Two separate defects, and the second is the one worth keeping

**1. `readme:audit` is in no workflow.** Measured:

    grep -rn "readme:audit\|readme-links" .github/workflows/*.yml   # no matches

`AGENTS.md` describes it as the audited half of the README contract —
"between the two tools no link in a folio README is unaccounted for" — and
nothing runs it. So `main` went red on it and stayed red invisibly. This is
`xom7` (a workflow failing 30 times unseen) and `cnlf` (a workflow that
never runs) in a third form: a check that exists, works, and is wired to
nothing.

Reproduced on a clean worktree of `origin/main`, so it was the base's and
not a branch's.

**2. The audit does not check HTML `<img src>`.** Three of the seven dead
SVGs are `<img src="…">` rather than Markdown image syntax — the three big
BPMN diagrams at the top of the README. `readme:audit` reported **five**
dead links; the true count was **eight**. A reader of the README front page
saw three broken images and the tool that exists to prevent exactly that
was silent about them.

That is worse than the unwired gate, because it would survive wiring it up.

## Done when

- [ ] `readme:audit` runs in CI, or there is a recorded reason it should not
- [ ] it checks HTML `<img src>` and `<a href>`, not only Markdown links —
      or the limit is documented where a reader will meet it, since a link
      checker silent about a whole syntax is worse than none
- [ ] the count it prints distinguishes "checked" from "present but not
      checkable", the third state this repo applies everywhere else

## Already done

The eight paths are repointed, on the branch that found them. That is the
symptom; the two boxes above are the defect.
