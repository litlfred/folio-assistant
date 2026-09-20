---
# folio-assistant-07p7
title: the fr catalogues are stale on main, no gate compares them, and every sweep dirties the tree
status: todo
type: bug
priority: normal
created_at: 2026-09-20T09:26:40Z
updated_at: 2026-09-20T09:27:48Z
parent: folio-assistant-1xhc
---

## Measured 2026-09-20, on main at `d953f5da`

A clean checkout, one `bun run gates --all`, and `git status` is dirty:

```
 M cat-harness/translations/fr/agent-onboarding.po    190 +++---
 M cat-harness/translations/fr/agent-onboarding.pot   194 +++---
?? cat-harness/translations/fr/agent-onboarding.md
?? cat-harness/translations/fr/status.json
```

**Every hunk is a line reference.** No `msgid` and no `msgstr` changes — only
`#: agent-onboarding.md:8` becoming `#: agent-onboarding.md:10`, ~190 times,
because `docs/guides/agent-onboarding.md` gained lines and the committed
catalogue still points at the old ones. The translations themselves are fine.

Two facts, and the second is why it has survived:

1. **The committed catalogues are stale.** `.po` and `.pot` are tracked for
   every language (`git ls-files cat-harness/translations/`), so they are
   meant to be current, and `fr/agent-onboarding` is not.
2. **Nothing compares them.** There is a writer and no `:check`. Contrast
   `readme:sync` / `readme:sync:check` and `render:bpmn` / `render:bpmn:check`,
   which both exist precisely so a generated artefact cannot drift unnoticed.
   So CI is green over a stale catalogue, and the only symptom is a dirty tree
   in front of whoever ran the sweep — who reasonably reverts it as somebody
   else's churn. I did, three times, across this session.

That is bean `xom7`'s shape again: *a red workflow looks exactly like a green
one from in here*, one level down. A generated file with no staleness check is
a generated file nobody can tell is wrong.

`translate-kg-viewer:check` (bean `ot9a`) DOES compare catalogues and passes —
it checks the kg-viewer strings, not the docs catalogues. Two different
artefacts; the gate for the second does not exist.

## Also: two generated files are neither tracked nor ignored

`translations/fr/agent-onboarding.md` and `translations/fr/status.json` are
written by the sweep, appear as untracked, and `git check-ignore` matches
neither. Either they are outputs (ignore them) or they are artefacts (commit
them) — today they are a third thing that makes every tree dirty.

## Done when

- [ ] the `fr/agent-onboarding` catalogues are regenerated and committed
- [ ] a `:check` exists that fails on a stale catalogue, and it is in the
      gate set — the point is a gate that can FAIL, not a regeneration
- [ ] `agent-onboarding.md` and `status.json` are tracked or ignored, decided
      rather than left
- [ ] it is verified against every language, not only `fr` — `fr` may simply
      be the one whose source moved

## Not this bean

Fixing the churn by committing the regeneration alone. That makes the tree
clean today and stale again the next time the source file gains a line, which
is exactly how it got here.
