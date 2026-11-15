---
# note on folio-assistant-2h76 from claude/festive-galileo-s7ibx0
$schema: folio-bean-note/v1
bean: folio-assistant-2h76
branch: "claude/festive-galileo-s7ibx0"
created: "2026-10-03"
---
## Owner ruling: D4 option (b), a branch per graph

## Owner ruling 2026-10-03 — D4 **option (b)**: a branch per graph, and a mount per branch

The owner, in this session, asked for the per-graph shape and then stated the
principle behind it:

> "Keep per-graph branches"

> "i dont think we need a speciifc "state" branch or mount, several potnential
> subgraphs can be a part of state"

This **reverses the D4 default** ruled on 2026-10-02 (bean `laqs`, *"go with
defaults for D1-D4"*), which chose one `state` branch with the graphs as
directories inside it. D1 (what moves) is untouched: beans, workflow
instances, todos, issue-marks and health results all still move. What changes
is **where each lands** — its own `cat/<harness>/<name>` branch — and
therefore what the mount has to do.

`state-mount.ts` already names this case as the one it cannot serve. Measured
on `main@26441a1da33`, `mountState` refuses with:

> `${branches.length} different state branches are declared (…), and this
> mounts ONE directory. Decision D4 chose one \`state\` branch with graphs as
> directories inside it; a branch per graph (D4 option b) needs a mount per
> branch, which is not built.`

So the refusal is not a defect to work around — it is this bean's mechanism
stopping exactly where the decision had not been taken. It has been taken now.

## What this makes true, and what it does not

**Does not block on a single branch.** `cat/cat-harness/state` (1269 files,
seeded from `main@85b9578b630e`) holds `beans/`, `todos/`, `issue-marks/` and
health results together. Under option (b) it is superseded rather than the
target. Retiring the name is already bean `oycs`'s job; **nothing here deletes
it** (`deletion-requires-confirmation`).

**The per-graph branches that exist**, measured 2026-10-03:

| branch | holds | state |
|---|---|---|
| `cat/cat-harness/beans` | `beans/` — 1375 files | refreshed today to `c0f226808db`; `beans` tree **bit-identical** to `main@3484f1d`'s |
| `cat/cat-harness/todos` | `todos/` — 13 files | seed |
| `cat/cat-harness/qa-reports` | QA evidence | arc `3fva`, and `keyedBy: commit` — NOT a tip mount, by the schema refinement that refuses `keyedBy: "tip"` on a `qa` directory |
| `cat/cat-harness/fsh-guts` | archived PDFs | bean `9c7h` |

So the tip-mount set is `beans` and `todos` today — two branches, which is
precisely the count the current mount refuses.

## Why the refresh went to the per-graph branch, and why that is now right

It was dispatched before this ruling, against `cat/cat-harness/beans`, on the
reading that the branch had to carry `main`'s beans before Phase 6 could touch
them. Under D4 (a) that was the wrong home; under (b) it is the right one. The
copy is verified either way and nothing was risked: 0 paths existed on the
branch and not on `main`, the old tip is still an ancestor (no force-push),
and `main` was untouched.

## What is still NOT true

**`storage.keyedBy: "tip"` is declared nowhere.** Measured across every
`<instance>.json` on `main`: no directory declaration carries the field, so
the session-start mount reports *"no declared directory sets
`storage.keyedBy: \"tip\"`, so `main` is still authoritative; nothing to
mount"* on every run. Until a declaration names a branch, the mechanism is
complete and inert — which is the `1xhc` shape, and is why this note states it
rather than leaving the green sweep to imply otherwise.

## Done when

- [ ] `mountState` becomes a mount **per declared tip-keyed directory**, each
      from the branch its own declaration names, at its own declared path —
      and the `branches.length > 1` refusal goes with it
- [ ] the multi-branch case has a test that FAILS against today's code
- [ ] `state:push` splices back per branch, not to one
- [ ] a mount that fails for ONE graph is still a loud finding and does not
      report the others clean (`1xhc`)
- [ ] this note's ruling is reflected in the proposal's §6 D4 row, as an
      amendment with its date rather than a rewrite
