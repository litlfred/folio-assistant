---
# folio-assistant-v556
title: 'Two kg-export sidecars carry three script hashes between them, and no gate can see it: a generator with no --check is invisible to check:artefact-verification'
status: in-progress
type: task
priority: normal
created_at: 2026-09-22T10:24:29Z
updated_at: 2026-09-23T17:20:54Z
parent: folio-assistant-1swy
---

MEASURED 2026-09-22 on main at `f4de6c1e20`, clean tree, by running `bun run kg:export` and reading both committed sidecars back.

`scripts/kg-export.ts` writes two `qa-results/v1` sidecars. Between them and the script actually in the tree there are **three different hashes for one script**:

| file | committed `producer.script_hash` |
|---|---|
| `cat-harness/test/results/kg-export.qa-results.json` | `c18f56d374e0` |
| `cat-harness/test/results/kg-export.bootstrap.qa-results.json` | `bc6ea7492239` |
| what `kg-export.ts` in the tree hashes to | `66bad125d600` |

One script cannot have three hashes. **Both committed sidecars are stale, by different amounts, and they disagree with each other as well as with the tree.**

## Why nothing reports it — and this is the part worth fixing

`bun run gates` passes **121/121** over this state. `bun run regen` reports **"38 current, 0 regenerated"**. Neither is malfunctioning:

- `regen-after-merge` works on **verify/write pairs**. `kg:export` has **no `--check` mode** (`package.json` has `kg:export` and nothing else), so it has no pair and regen correctly ignores it.
- `check:artefact-verification` — the gate added under `jfr6` *specifically* to ask whether generated artefacts are valid for a consumer — derives its inventory from `package.json` and, in its own words, *"a check counts as generated-artefact currency when its script is invoked with `--check`."* So an artefact whose generator has **no `--check` at all** is not in the 45 declared entries and never will be. Confirmed: `kg:export declared? False`.

**That is the finding.** The gate written to catch artefacts nobody verifies has a blind spot shaped exactly like an artefact nobody verifies — a `dh4f` in the `dh4f` catcher. It is not that the declaration is missing; it is that the inventory *cannot* contain it.

## Against its neighbours — it is neither

- **NOT `nytj`** (staleness: an artefact recorded but not in force). That family is about a verdict that exists and is ignored. Here the verdict is present and current in content; only its producer stamp is wrong, and nothing reads it.
- **NOT `cflw`** (collision: 218 sidecars rewritten by one auditor edit). `cflw` shipped a fix by moving the auditor's identity into `skills/kg-qa.manifest.json` for the `kg-qa` family, and explicitly left a named residue — the 20 `qa-witness/v1` docs witnesses — saying it *"wants its own bean"*. **This is a THIRD family, `qa-results/v1`, which `cflw` does not name at all.** Same root cause (a per-file copy of a once-per-run value), different file shape, different remedy surface.

Worth recording that `cflw`'s own analysis predicts this: *"the per-file auditor hash never added precision the generator could deliver."* Two sidecars from one run of one script should carry one hash; they carry two, which is that sentence proven twice over.

## Also corrected here

An earlier reading of mine in session `017PqeiS` said `kg-export.test.ts` writes the sidecar it validates, making a vacuous check. **That was wrong.** The test's `writeFileSync` calls all target a temp directory; the writer is `kg-export.ts`'s own CLI via `writeQaResult`. There is no check that cannot fail — there is **no check at all**, which is a different and larger problem, and the corrected version is the one above.

## Done when

*One checklist, edited in place. An earlier pass here appended a SECOND
`## Done when` carrying the ticks while this one still read open, and
`check:bean-bodies` reported the `shadow-checklist` shape for it — the same
defect that held `hfkl` open for two days, and the second time this session has
committed it. Two lists over one set of requirements is two answers to what is
left.*

- [ ] Decide whether `producer.script_hash` belongs per-sidecar at all for
      `qa-results/v1`, or once per producer as `cflw` did for `kg-qa`. **The
      stakes are smaller than they read**: the host writes ONE sidecar and a
      foreign instance one more, so the churn is 1–2 files rather than `cflw`'s
      218. Still a real question — two sidecars from one run of one script
      should carry one hash — but not urgent.
- [x] Either give `kg:export` a `--check` mode so it enters the verify/write
      pairs and the artefact-verification inventory, or record why it should
      not be checked — **done**, 42→43 pairs and 45→50 inventory entries
- [ ] Close the inventory blind spot. **Half done**: the gate now states the
      bound of its own derivation on every run, and its false premise is
      corrected. Enumerating generators with no `--check` needs a definition of
      "generator" that nobody has ruled on — owner's.
- [x] Re-measure: on a clean tree, one run of one generator leaves one hash —
      **confirmed**, all three agree, and `kg:export:check` now says so if they
      ever stop
## 2026-09-23 — re-derived on claiming, and HALF THIS BEAN'S EVIDENCE NO LONGER HOLDS

Claimed under stream 4 (`kpcl`), whose first rule is to re-derive a bean's
numbers rather than quote them. This one did not survive intact, and the part
that died is the part that made it look urgent.

### The three hashes are one hash

| file | `producer.script_hash` today |
|---|---|
| `test/results/kg-export.qa-results.json` | `c8706b340ea1` |
| `test/results/kg-export.bootstrap.qa-results.json` | `c8706b340ea1` |
| `sha256(scripts/kg-export.ts)` in the tree | `c8706b340ea1` |

**All three agree.** Somebody regenerated them between 2026-09-22 and today.

**And that is the finding, not the refutation.** They agree *by a regeneration*,
not because anything checked — the state was repaired by accident of somebody
else's commit, and nothing would have said if it had not been. A corpus that is
clean while nothing is watching is the `1xhc` case exactly, and it is worth more
than the dirty corpus this bean was written against: a defect you can see is
cheaper than a silence you cannot.

### Box 2 closed — `kg:export --check`, and it fired on its first run

`kg:export:check`, registered in `package.json` and in
`code-quality-gates.yml`. Measured immediately after:

- `regen-after-merge`: **42 → 43** verify/write pairs.
- `check:artefact-verification`: **45 → 50** entries. `kg:export` is now *in*
  the list it is judged against, instead of being structurally absent from it.

`checkQaResult` shares `writeQaResult`'s comparison key (`withoutTimestamp`), so
the verifier and the writer cannot disagree about what *unchanged* means — the
`nytj` family, where a writer and a reader with different keys are each correct
alone. A test pins it: a later timestamp over identical findings is `current`.

**Four states, not two.** `missing` and `unreadable` are kept apart from
`stale`: a generator that never ran and one whose output moved need different
answers, and telling somebody to re-run a generator when the file on disk is not
a result at all is the wrong instruction. 6 tests, against temp stores, because
the real sidecar is current and a test asserting only *"the repo passes"* would
go on passing if `checkQaResult` were gutted to `return "current"`.

**The document is deliberately not checked**, and the declaration says so rather
than leaving it implied: `_kg/<stub>.jsonld` is a gitignored build output with no
committed copy, so checking it would compare a build to itself.

**A correction I am keeping.** On its first run `kg:export:check` reported the
sidecar stale, and I read that as this bean's defect still live. It was not —
**I had just edited `kg-export.ts`**, so its own hash had moved. The check was
working; my reading of it was the defect. Recorded because "the gate fired, so
the bug is real" is exactly the inference this stream exists to distrust.

### Box 3, half closed — and the half that is left is a design decision

The premise the blind spot hid behind was written down in the gate's own header:

> *"Every generated artefact in this repository has a `--check` mode"*

**False since before this bean was filed.** If every generator has a check, then
a list derived from checks is a list of every generator — and the derivation is
complete. It is not. The sentence is corrected in place, with why it mattered.

The gate now prints its own **bound**, every run:

```
· derived from `--check` invocations in package.json: a generator with no
  `--check` cannot appear above, and is neither verified nor unverified here
```

That is this bean's *"'Nobody has said' is its own stated finding; 'cannot be
asked' is worse"* answered at the level that can be answered honestly today.
**Enumerating the generators that have no check is NOT done**, and deliberately:
it needs a decision about what counts as a generator, and inventing that
heuristic here would ship an inventory nobody measured — the defect this gate
exists to report, committed inside it. That is the owner's call, and it is the
third box in §"Done when" above.
