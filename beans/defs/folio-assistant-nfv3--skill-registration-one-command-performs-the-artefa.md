---
# folio-assistant-nfv3
title: 'SKILL REGISTRATION: one command performs the artefact chain, and a gate refuses a skill that arrives without it — 7 merges have paid for its absence'
status: in-progress
type: task
priority: high
created_at: 2026-09-26T07:38:20Z
updated_at: 2026-09-26T07:38:38Z
parent: folio-assistant-1xhc
---

## What this is

`v625`'s open item, both halves: *"the chain is written down somewhere an author
adding a skill will find it — or, better, one command performs it."* Neither
existed. `#1383`'s author reached the same conclusion and left it deliberately —
*"a pre-merge gate … is the actual fix, and it's a separate decision I have not
taken here"* — and the owner took it on 2026-09-26.

## The defect, measured

Seven merges between 2026-09-24 and 2026-09-26 each broke the gate set by adding
a skill without its manifest entry, its reference page and its `kg-qa` sidecar.
Two were repaired on this branch (`#1365`'s six skills, `#1373`'s
`release-epic-planning`); the rest by five other sessions. Three of the seven also
reintroduced the retired `roles:` key.

**Detection was never the gap.** The gates named the files exactly, every time.
The gaps were that an author had nowhere to look up what to run, and that running
it once is not enough — CI judges the MERGE of each head into the base, so the
cost lands on whoever opens the next PR.

## Shipped

- `scripts/register-skills.ts` — `skills:register` performs, `skills:register:check`
  gates. Wired into `code-quality-gates.yml`; subject resolved from the instance's
  declarations via `kgDirectories`, never a hardcoded `skills/`.
- `skills:docs` / `skills:docs:check` — `gen-skill-docs.ts` had no package script,
  which is the gap `check:ci-invocations` exists to report. Closed on the way past.
- `skills/folio-core/skill-registration.md` — the discipline, registered by the
  command it documents (267 → 268 skills).
- `tests/register-skills.test.ts` — 19 tests, every finder falsified on a synthetic
  package, anti-vacuity floor on the real corpus.

## Three things the gates corrected in my own work, and one I found by breaking it

- `join(instance, "skills")` was a declared-path literal, refused by
  `check-declared-paths`. Asking the declaration is not merely compliant: ids are
  stable across a relocation and paths are not (`iwtn` moved this id), and it
  reaches a dependent instance's packages.
- `@covers kg` names no kind — `kg` is a graph LAYER. Narrowed to `skills`, and
  only that: the derived pages and sidecars are judged by `skills:docs:check` and
  `kg:audit:check`, so claiming them would report coverage this gate does not give.
- Sorted insertion, not append. `#1383` appended believing the lists unsorted;
  they are sorted, and `kfkh` records the convention as *unenforced* — which is
  what let two sessions insert one name at two indices and keep both.
- **Deleting a probe skill exposed the direction I had not designed for**: the
  manifest entry the command had just written now pointed at nothing, and
  `kg:audit` raised `manifest-skill-exists` at **critical**. `dangling()` reports
  it and deliberately does not prune.

I also polluted the `audit-coverage` sidecar by running its WRITING form in this
container to read a list of kind names — bean `xd1g`, the trap I had written into
my own check-in note three times that day. Regenerated in a clean worktree.

## Done when

- [x] one command performs every declaration and derived artefact a skill owes
- [x] convergence ASSERTED against the `:check` forms, not a fixed pass count
- [x] a gate refuses an undeclared skill, and its message names the command
- [x] both orphan directions reported; neither silently pruned
- [x] falsified in both directions, and the clean tree still exits 0
- [x] the discipline written where an author will meet it, and registered by the
      command it documents
- [x] The merge-time half is **already decided and already covers this gate** —
      I left it here as an open question for the owner and it was answered on
      2026-09-23, before this bean existed. `nytj` owns the subject, is
      `in-progress` under a holder, and the owner chose both halves: `merge_group:`
      on the gating workflows plus `bun run check:merged`. Its only open box is a
      repository SETTING — switching the merge queue on for `main` — which is the
      owner's to flip, not a decision to take.

      **And it needs nothing from this bean.** `check-merged.ts` runs
      `bun run gates` on the merged tree, and `gates.ts` derives its list from
      `code-quality-gates.yml`, where `skills:register:check` is now wired. So the
      moment the merge queue is on, an unregistered skill cannot reach `main` —
      automatically, with no further change here. Read rather than assumed:
      `check-merged.ts:133`.

      Recorded as my error rather than dropped. I put a settled question to the
      owner as though open, which spends the one thing their accessibility
      constraints make expensive. `nytj`'s own commit message names the guard that
      would have caught it — *"'Check before you create' is why I did not"* — and
      the same check applies to a QUESTION, not only to a bean

