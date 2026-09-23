---
# folio-assistant-zzar
title: 'SCRAPPED (false): I tested the wrong gate — harness:dirs:check does catch it'
status: scrapped
type: task
priority: high
created_at: 2026-09-20T08:49:49Z
updated_at: 2026-09-20T08:55:39Z
---

Found while testing whether a methodology sub-graph is genuinely extractable.

## The experiment, and the result

From a **clean baseline** (all gates green, sidecars regenerated), one entry was
added to `cat-harness/harness.json` naming a directory that does not exist and
never has:

```json
{ "id": "never-existed", "path": "methodologies-that-do-not-exist/",
  "graphs": ["methodology"] }
```

| gate | exit |
|---|--:|
| `kg:audit:check` | 0 |
| `check:harness-dirs` | 0 |
| `check:declared-paths` | 0 |
| `check:partition` | 0 |
| `check:schema-nodes` | 0 |

**Nothing noticed.**

## Why this is the `dh4f` defect, named by AGENTS.md and unguarded

`AGENTS.md` says it outright:

> **Declare only what exists** — a declared-but-absent directory is the bean
> `dh4f` defect, where a consumer scans nothing and reports a clean run over it.

The rule is written down. No gate enforces it. A consumer walking the declaration
finds nothing at that path, scans nothing, and reports a clean run — which is
indistinguishable from a real empty directory and from a real clean result.

## The confounder that nearly hid it

The first run of this experiment showed `kg:audit:check` exiting 1, which looked
like the gate catching it. It was not: the tree had uncommitted regeneration
pending and the failure was **"34 sidecar(s) are stale"** — the same number with
and without the phantom declaration. Re-run from a clean baseline, the exit is 0.

Worth recording because the wrong conclusion was one glance away, and it is the
third time in one session that a composed or incidental signal nearly passed for a
real one (the others: `echo`'s exit status read as a script's, and a correct
refusal read as a broken command).

## Why it matters more now than before

The `methodology` graph kind makes directory declarations a **routine** operation
rather than a rare one: adopting a methodology is declaring a directory, and
extracting one is removing a declaration. An unguarded declaration is a footgun in
proportion to how often it is handled.

## Done when

- [ ] a gate fails on a declared path that does not exist
- [ ] **could-not-determine is distinguished from absent** — an unreadable path is
      not the same finding as a missing one, and neither is clean
- [ ] the existing empty-but-real case still passes: `AGENTS.md` is explicit that
      "an empty directory is still a determined empty", so emptiness must not be
      conflated with absence
- [ ] a test pins the phantom declaration failing, so the guard cannot regress to
      exit 0

---

## SCRAPPED 2026-09-20 — the claim is FALSE. I tested the wrong gate.

**`harness:dirs:check` catches it.** Declaring `phantom-dir-xyz/` produced:

```
MISSING  phantom-dir-xyz        folio-assistant
harness dirs: 18 declared, 2 missing.
EXIT=1
```

The experiment above ran `check:harness-dirs` — `scripts/check-harness-dirs.ts`,
which checks that the two *unavoidable configuration duplicates* (`.beans.yml` and
`WORKFLOW_DIR`) still agree with the declaration. That is a **different script**
from `harness:dirs:check` (`scripts/harness-dirs.ts --check`), which is the one
that walks every declared directory and reports `MISSING`.

Two gates whose names differ by word order, doing unrelated jobs. I ran one,
concluded the other did not exist, and opened this at **high priority** asserting a
gap in a defect class `AGENTS.md` names by bean id. Wrong, and confidently so.

## Kept rather than deleted, because the mistake is the content

Fourth confounded measurement in one session, and the worst of them. The others
read a composed exit status as a script's, an incidental staleness failure as a
gate catching something, and a correct refusal as a broken command. This one
invented a hole in the repository's own guard rails.

The pattern across all four: **I confirmed an absence without enumerating what
would have shown presence.** The fix is not care, it is method — before reporting
that nothing checks X, list the candidate checkers and run each. Here that list was
one `grep -i dirs package.json` away.

## What is genuinely true, and much smaller

`check:harness-dirs` and `harness:dirs:check` are near-homographs for unrelated
gates, which is what made the error available. If that is worth fixing it is a
rename with an alias, not a new guard. Not opened as work; noted here.

**No action. Nothing was missing.**
