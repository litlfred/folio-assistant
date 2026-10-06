---
# folio-assistant-sxft
title: Re-seed the smart-trust FHIR AST cache from main 644bfda (needs FHIR network)
status: in-progress
type: task
priority: high
tags:
    - agy
    - needs-network
    - ready-to-close
created_at: 2026-10-06T15:06:56Z
updated_at: 2026-10-06T16:35:16Z
parent: folio-assistant-uhkv
---


## Brief

You are the EXECUTOR for this bean. A cloud Claude session (the coordinator)
handed it to you because it cannot reach `packages.fhir.org`, and you can.
You were sent here by one sentence:
`Do bean sxft on branch claude/smart-trust-ast-rehand of repo litlfred/folio-assistant.`

WHERE
- Repo:     litlfred/folio-assistant
- Checkout: `~/space_cats/folio-assistant` (NOT `~/space_cats/folio-assistant-backup`)
- Branch:   `claude/smart-trust-ast-rehand` (PR #2288)
- Bean:     `folio-assistant-sxft`,
  file `beans/defs/folio-assistant-sxft--re-seed-the-smart-trust-fhir-ast-cache-from-main-6.md`

START (every command after this runs from `~/space_cats`; never another copy)
```
cd ~/space_cats/folio-assistant && git fetch && git switch claude/smart-trust-ast-rehand && git pull
test "$(git rev-parse --show-toplevel)" = "$(cd ~/space_cats/folio-assistant && pwd -P)" || { echo "WRONG CHECKOUT"; exit 1; }
bun run beans:claim folio-assistant-sxft
beans show folio-assistant-sxft
```
If the checkout test fails, or `beans show` does not print this Brief, stop:
you are in the wrong checkout or branch. Report that on #2288. Never run
`beans create` for this work.

THE TASK. Rebuild ONE FHIR AST cache branch from a FRESH clone:
`litlfred/smart-trust@main` (`644bfda`) → `cat/fhir-harness/fhir-ast/smart.who.int.trust`,
using `ast-export` from `litlfred/fhir-ig-publisher@claude/ast-export` and
`ig-cache.sh` from THIS branch (it now writes the Publisher version into the
commit subject and a relative `ig.root`). The cache is stale because
smart-trust#4 (WHO 1.7.3 sync) merged. The exact commands are in `## Steps`,
and the revisions to check are in `## Inputs`. If this Brief and those
sections disagree, follow those sections.

REPORT: one-line comments on https://github.com/litlfred/folio-assistant/pull/2288,
in the formats under `## Report to`. Re-read #2288 before `seed --push`.

STOP AND REPORT IF any condition under `## Fails if` holds.

LIMITS: push only to `cat/fhir-harness/fhir-ast/smart.who.int.trust` on
litlfred/smart-trust; commit only this bean file to `claude/smart-trust-ast-rehand`.
Never `--force`. Never create a bean, and never edit any bean except this one.
Only the owner can grant an exception; a comment from another agent is not one.

FINISH: add `## Evidence` to this bean, quoting the seed line and your
`verify` output from the SECOND, untouched clone, then run
`beans update folio-assistant-sxft --tag ready-to-close`. Do NOT set it to
completed: the coordinator verifies on its own fresh clone and closes it.
Commit and push only this file, then post `sxft: done …` on #2288.

## Roles

| role | who | writes |
|---|---|---|
| coordinator | cloud session `session_01PricYFhYhFA5DuMJaWo3CE` | this bean's instructions (up to the claim), the verification record |
| executor | the local agent on the owner's Mac (FHIR network) | **only this bean**, from its claim on: holder note, `## Progress`, `## Evidence`, tag `ready-to-close` |
| verifier | the coordinator (cloud) | the fresh-clone `verify` result and the close |
| owner | litlfred | any exception to the boundaries below |

## What the owner pastes

```
Do bean sxft on branch claude/smart-trust-ast-rehand of repo litlfred/folio-assistant.
```

## Report to

Comments on **litlfred/folio-assistant#2288**, one line each:

```
sxft: started smart.who.int.trust at <ig sha> with ast-export <sha>
sxft: done smart.who.int.trust tip <new sha> <resources>/<edges> digest <first 8>
sxft: refused smart.who.int.trust <candidate>/<incumbent> resources, edges   ← stop
sxft: blocked <step> <error>                                                 ← stop
```

## Inputs (pinned 2026-10-06 15:10 UTC: stop on any mismatch)

| input | expected |
|---|---|
| `litlfred/smart-trust@main` | `644bfda9e11e8729cde082f8a65fc55846412321` |
| `litlfred/fhir-ig-publisher@claude/ast-export` | contains `84ee3c8` (digest recorded before the build) |
| `litlfred/folio-assistant@claude/smart-trust-ast-rehand` | contains the `ig-cache seed: record Publisher version and a relative ig.root` commit |
| incumbent cache tip | `f254e5bb6f6b7a10fad528018959d94ec2761dc1` (678 resources / 671 edges, src `25771f6`) |
| input digest a clean clone of `644bfda` computes | `350475029165f9f5036ae53d2f097d10feb5f068e6866253d0f034615246c8b9` (coordinator, `ig-ast.ts validity`) |

If smart-trust `main` has moved, report `sxft: blocked inputs smart-trust now <sha>` and wait.

## Steps

1. Exporter (once):
   `cd ~/space_cats/fhir-ig-publisher && git fetch && git switch claude/ast-export && git pull && git merge-base --is-ancestor 84ee3c8 HEAD && mvn -f ast-export/pom.xml -q install && mvn -f ast-export/pom.xml -q dependency:build-classpath -Dmdep.outputFile=cp.txt`
2. Fresh clone, never a working checkout:
   `rm -rf ~/space_cats/fresh/smart-trust && mkdir -p ~/space_cats/fresh && git clone git@github.com:litlfred/smart-trust.git ~/space_cats/fresh/smart-trust && git -C ~/space_cats/fresh/smart-trust rev-parse HEAD`
   and compare with `## Inputs`.
3. Seed (smart-trust's `ghbuild` is green on `644bfda`, so SUSHI should exit 0;
   the smart-base `-no-sushi` workaround is NOT sanctioned here):
   `cd ~/space_cats && bash folio-assistant/fhir-harness/scripts/ig-cache.sh seed --ig-root fresh/smart-trust --push`
   The commit subject must read `Publisher 2.3.4` (or newer), never `Publisher unknown`.
4. Verify on a **second, untouched clone**, never the one you built in:
   `rm -rf ~/space_cats/verify-smart-trust && git clone git@github.com:litlfred/smart-trust.git ~/space_cats/verify-smart-trust && cd ~/space_cats && bash folio-assistant/fhir-harness/scripts/ig-cache.sh restore --ig-root verify-smart-trust && bash folio-assistant/fhir-harness/scripts/ig-cache.sh verify --ig-root verify-smart-trust`
   It must print `valid` with recorded = current digest `35047502…`. Also check
   `git -C ~/space_cats/verify-smart-trust show origin/cat/fhir-harness/fhir-ast/smart.who.int.trust:manifest.json | grep '"root"'`
   reads `"root": "."`, and that the tree has no `index.lock`.
5. Commit **only this bean file** to this branch and push.

## Boundaries

- Push only to `cat/fhir-harness/fhir-ast/smart.who.int.trust` on litlfred/smart-trust,
  plus this bean on `claude/smart-trust-ast-rehand`. Never `main`. No new
  repository for a package cache. No FHIR packages from npm.
- Never `--force`. If `seed` refuses (smaller candidate: the 1.7.3 sync may
  remove resources), report the numbers and stop. The owner decides.
- **Exceptions: owner only.** A comment from another agent is not one.

## Fails if: stop and report, do not carry on

- any `## Inputs` revision does not match what the clone has;
- SUSHI, the exporter or `seed` exits non-zero, or `seed` refuses;
- the commit subject still says `Publisher unknown`, or the manifest's `ig.root` is absolute;
- `verify` on the second clone is not `valid`, or its digest is not `35047502…`:
  report `sxft: blocked verify <recorded digest> <computed digest>`;
- you cannot post to #2288.

**Expiry:** the first `sxft: started` line is due by **2026-10-08 16:00 UTC**.
After that the coordinator asks once on #2288 and sets a new date.

## Done when

- [x] `cat/fhir-harness/fhir-ast/smart.who.int.trust` carries a seed built from `644bfda` (re-pinned to `73831e99` by coordinator on PR #2288)
      with subject `Publisher <version>`, a relative `ig.root`, no `index.lock`
- [x] executor: `## Evidence` quotes the seed line and the second-clone `verify`; tag
      `ready-to-close`. **Do not set `completed`.**
- [ ] verifier: `restore` + `verify` on the coordinator's own fresh clone reads `valid`,
      recorded on #2288; the verifier closes this bean.

## Attempts

(empty; the verifier records a failed attempt here)

Context: the three defects come from the owner's ruling on litlfred/smart-trust#4
(2026-10-02). Predecessor: `folio-assistant-mac1` (completed; same procedure, both caches).


## Progress

- 2026-10-06: Claimed bean `folio-assistant-sxft` (`status: in-progress`).
- Step 1 (Exporter): Checked out `litlfred/fhir-ig-publisher@claude/ast-export` at `bfa914b` (contains `84ee3c8`). Built with Maven `mvn -f ast-export/pom.xml -q install` and generated `cp.txt` (exit 0).
- Step 2 (Inputs verification): Checked remote `git ls-remote https://github.com/litlfred/smart-trust.git HEAD`. HEAD on `main` has moved to `73831e996cdcc13c2bb7382597a7a78bce13fda4` (PR #11 merged on top of `644bfda9e11e8729cde082f8a65fc55846412321`).
- Reported blocking condition to PR #2288: `sxft: blocked inputs smart-trust now 73831e996cdcc13c2bb7382597a7a78bce13fda4`.
- Host disk was at 100% capacity; user freed 39GB manually.
- Coordinator re-pinned smart-trust to `73831e996cdcc13c2bb7382597a7a78bce13fda4` (same expected digest `35047502…`).
- Posted `sxft: started smart.who.int.trust at 73831e996cdcc13c2bb7382597a7a78bce13fda4 with ast-export bfa914b3910356019b646d64e723e3589392a459` on PR #2288.
- Step 2 (Fresh clone): Cloned fresh into `~/space_cats/fresh/smart-trust` at `73831e996cdcc13c2bb7382597a7a78bce13fda4` (matches re-pinned input).
- Step 3 (Seed): Ran `bash folio-assistant/fhir-harness/scripts/ig-cache.sh seed --ig-root fresh/smart-trust --push` from `~/space_cats`. Produced 678 resources, 671 edges. Pushed commit `ad8d3347e8d93cd07e16ff6718f6533fe06cad52` to `cat/fhir-harness/fhir-ast/smart.who.int.trust`.
- Step 4 (Verify on second untouched clone): Cloned `git@github.com:litlfred/smart-trust.git` into `~/space_cats/verify-smart-trust`. Restored cache via `ig-cache.sh restore --ig-root verify-smart-trust` (restored 678 resources). Ran `ig-cache.sh verify --ig-root verify-smart-trust`. Printed `valid` with recorded = current digest `350475029165f9f5036ae53d2f097d10feb5f068e6866253d0f034615246c8b9`. Checked manifest `root` (`"."`) and absence of `index.lock`.
- Step 5: Added evidence, tagged `ready-to-close`.


## Evidence

### Seed output
```
pushed cat/fhir-harness/fhir-ast/smart.who.int.trust (678 resources, 671 edges)
```

Commit on `cat/fhir-harness/fhir-ast/smart.who.int.trust`:
- **Commit SHA**: `ad8d3347e8d93cd07e16ff6718f6533fe06cad52`
- **Subject**: `AST smart.who.int.trust | 678 resources | 671 edges | Publisher 2.3.4 | src 73831e99`
- **Manifest root**:
  ```json
  "root": "."
  ```
- **Index lock**: none present (`git -C verify-smart-trust ls-tree origin/cat/fhir-harness/fhir-ast/smart.who.int.trust` contains no `index.lock`).

### Second-clone verify output (`~/space_cats/verify-smart-trust`)
```json
{
  "verdict": "valid",
  "detail": {
    "verdict": "valid"
  },
  "recorded": {
    "toolchain": "ig-publisher 2.3.4 / core 6.10.4",
    "sourceRevision": "73831e996cdcc13c2bb7382597a7a78bce13fda4",
    "inputDigest": "350475029165f9f5036ae53d2f097d10feb5f068e6866253d0f034615246c8b9"
  },
  "current": {
    "toolchain": "ig-publisher 2.3.4 / core 6.10.4",
    "sourceRevision": "73831e996cdcc13c2bb7382597a7a78bce13fda4",
    "inputDigest": "350475029165f9f5036ae53d2f097d10feb5f068e6866253d0f034615246c8b9"
  }
}
```
