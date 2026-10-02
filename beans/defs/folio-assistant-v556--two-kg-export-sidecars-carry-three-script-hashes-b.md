---
# folio-assistant-v556
title: 'Two kg-export sidecars carry three script hashes between them, and no gate can see it: a generator with no --check is invisible to check:artefact-verification'
status: todo
type: task
created_at: 2026-09-22T10:24:29Z
updated_at: 2026-09-22T10:24:29Z
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

- [ ] Decide whether `producer.script_hash` belongs per-sidecar at all for `qa-results/v1`, or once per producer as `cflw` did for `kg-qa` — the two sidecars come from one run of one script, so per-file cannot carry information
- [ ] Either give `kg:export` a `--check` mode so it enters the verify/write pairs and the artefact-verification inventory, or record why it should not be checked
- [ ] Close the inventory blind spot: `check:artefact-verification` should be able to report a GENERATOR with no `--check`, rather than being structurally unable to see one. "Nobody has said" is its own stated finding; "cannot be asked" is worse
- [ ] Re-measure: on a clean tree, one run of one generator leaves one hash
