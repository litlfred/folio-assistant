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

---

## 2026-09-26, later: a sibling built the same command, and theirs is right about the chain

`main` gained `skill:register` → `cat-harness/scripts/skill-register.ts` (bean
`v625`, 183 lines). Mine is `skills:register` → `register-skills.ts`. **Two
commands one letter apart**, found in a merge conflict on `package.json` rather
than by looking — the sixth sibling collision this session, and the only one where
both artefacts survived into one tree.

### Their chain is MEASURED; mine was inferred, and mine was wrong

Theirs is five steps, each measured red-then-green **in isolation**:

    gen-skill-docs · glossary:page · docs:auto · kg:audit · kg:detangle

Mine was nine. The four extras — `glossary:export`, `uml:overview`, `prov:qaqc`,
`tools:viz` — staled in the runs I watched because that branch *also* added three
Tool nodes and merged 20 translated pages. Their docblock names this exact
failure, three times over: *"they had gone red in the same sessions for unrelated
reasons and were attributed here."* I used the method they had already proved
wrong.

Two further corrections I took from them:

- **`bun run gates` cannot derive the chain.** `bun test` runs the detangle and
  kg-audit writers, so those checks read green by the time they execute — bean
  `ymsu`'s blind spot. Only an isolated run of one check against a known tree
  measures anything.
- **The five are NOT order-dependent** — they ran them in reverse and re-checked
  green. I had asserted order-dependence from watching `docs:auto` stale behind
  `glossary:page`, a real observation on a tree changing for four reasons at once.

`CHAIN` is now their five. The convergence loop stays, with its purpose corrected:
not to shuffle a dependency, but so the command can say the chain **landed**
rather than that it **ran**.

And a test of mine had to change with it — it asserted `CHAIN.length > 5`,
encoding my wrong nine, so a correct change failed it. That is the trap the
neighbouring test warns about in prose (*"a count in a test goes stale exactly as
a count in prose does"*). I wrote the warning and then wrote the count. It asserts
properties now.

### Where they differ, and the one where theirs is the better default

| | `skill:register` (theirs) | `skills:register` (mine) |
|---|---|---|
| chain | **5, measured** | 5, now taken from theirs |
| wired into CI | no | **yes** — `skills:register:check` in `code-quality-gates.yml` |
| adds the manifest entry | **refuses, deliberately** | yes |
| strips a retired `roles:` | no | yes |
| reports a dangling entry | no | yes |
| tests | 1 file | 19 tests |

**Their refusal to add the manifest entry is a real argument against my
default**, and I think they are right: *"that is the author's assertion that the
file is a skill of that package, not a derivable fact, and a command that guessed
it would register files someone was still drafting."* Mine would register a
half-written skill the moment somebody ran it.

### Not consolidated here, and that is deliberate

`skill-register.ts` is a sibling's **merged** work. Deleting or absorbing it is
not an agent's call —
[`deletion-requires-confirmation`](../../cat-harness/skills/folio-core/deletion-requires-confirmation.md) — and two
commands one letter apart is a defect that should be closed by a decision rather
than by whoever pushes next. Both are green side by side, so nothing is broken
while it waits.

## Done when

- [x] ~~the chain~~ — replaced by the measured five from `skill-register.ts`
- [ ] **ONE command, not two.** Recommended shape, for the owner: keep
      `skill:register`'s chain and its refusal to write manifest entries, keep
      `skills:register:check`'s CI wiring, the dangling report and the retired-key
      strip, under a single name. Whichever file survives, the other's docblock
      evidence has to move with it — the measured chain and the
      `gates`-cannot-derive-it finding are the most valuable things either file
      contains

