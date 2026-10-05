---
# folio-assistant-mac1
title: Re-seed both fhir-ast caches with the git-tree InputDigest (needs FHIR network)
status: completed
type: task
priority: high
tags:
    - agy
    - needs-network
created_at: 2026-10-02T15:30:31Z
updated_at: 2026-10-02T18:00:00Z
parent: folio-assistant-uhkv
blocking:
    - folio-assistant-wnhh
---

## Brief

You are the EXECUTOR for this bean. A cloud Claude session (the coordinator)
handed it to you because it cannot reach `packages.fhir.org`, and you can.
You were sent here by one sentence:
`Do bean mac1 on branch agy/wnhh-sushi-publisher-local of repo litlfred/folio-assistant.`

WHERE
- Repo:     litlfred/folio-assistant
- Checkout: `~/space_cats/folio-assistant` (NOT `~/space_cats/folio-assistant-backup`)
- Branch:   `agy/wnhh-sushi-publisher-local` (PR #1816)
- Bean:     `folio-assistant-mac1`,
  file `beans/defs/folio-assistant-mac1--re-seed-both-fhir-ast-caches-with-the-git-tree-inp.md`

START
```
cd ~/space_cats/folio-assistant && git fetch && git switch agy/wnhh-sushi-publisher-local && git pull
bun run beans:claim folio-assistant-mac1
```
If `beans show folio-assistant-mac1` does not print this Brief, stop: you are
in the wrong checkout or branch. Report that on #1816. Never run
`beans create` for this work.

THE TASK. Re-seed two FHIR AST cache branches, each from a FRESH clone:
`litlfred/smart-trust` → `fhir-ast/smart.who.int.trust`, and
`litlfred/smart-base` → `fhir-ast/smart.who.int.base`, using `ast-export`
from `litlfred/fhir-ig-publisher@claude/ast-export`. The exact commands and
the revisions you must find are in `## Inputs` and `## Steps` below. If this
Brief and those sections disagree, follow those sections. The previous
attempt failed because it built from working checkouts, and smart-base's
checkout was out of date. That is why you use fresh clones only and check
every revision first.

REPORT: one-line comments on https://github.com/litlfred/folio-assistant/pull/1816,
in the formats under `## Report to`. Re-read #1816 before each `seed --push`.

STOP AND REPORT IF any condition under `## Fails if` holds.

LIMITS: push only to the two `fhir-ast/*` branches; commit only this bean
file to `agy/wnhh-sushi-publisher-local`. Never `--force`. Never create a
bean, and never edit any bean except this one. Only the owner can grant an
exception; a comment from another agent is not one.

FINISH: add `## Evidence` to this bean, quoting each seed line and your local
`verify` output, then run `beans update folio-assistant-mac1 --tag ready-to-close`.
Do NOT set it to completed: the coordinator verifies on fresh clones and closes
it. Commit and push only this file, then post `mac1: done …` on #1816.

Child of `wnhh` in substance: it is the last step that bean records as needed.
Handed off under skill `agent-handoff` (#1882 / #1884). Read it once.

## Roles

| role | who | writes |
|---|---|---|
| coordinator | cloud session `session_01PricYFhYhFA5DuMJaWo3CE` | this bean's instructions (up to the claim), `wnhh`, the verification record |
| executor | the local agent on the owner's Mac (FHIR network) | **only this bean**, from its claim on: holder note, `## Progress`, `## Evidence`, tag `ready-to-close` |
| verifier | the coordinator (cloud) | the fresh-clone `verify` result and the close |
| owner | litlfred | any exception to the boundaries below |

## What the owner pastes

```
Do bean mac1 on branch agy/wnhh-sushi-publisher-local of repo litlfred/folio-assistant.
```

## Report to

Comments on **litlfred/folio-assistant#1816**, one line each:

```
mac1: started <package> at <ig sha> with ast-export <sha>
mac1: done <package> tip <new sha> <resources>/<edges> digest <first 8>
mac1: refused <package> <candidate>/<incumbent> resources, edges   ← stop
mac1: blocked <step> <error>                                       ← stop
```

Re-read #1816 before each `seed --push`: corrections arrive there, never by
editing this bean.

## Inputs (pinned 2026-10-02 17:50 UTC for attempt 3: stop on any mismatch)

| input | expected |
|---|---|
| `litlfred/fhir-ig-publisher@claude/ast-export` | contains **`84ee3c8`** (digest recorded BEFORE the build), `b9004fb` and `cf52eb7` |
| `litlfred/smart-trust@main` | `25771f6a8d81e0ecd646167fa2ff98882ffbe8e7` |
| `litlfred/smart-base@main` | `e151a4d3ca570a34e88fd3820e93edbfeb30728c` |

If `main` has moved, report `mac1: blocked inputs <repo> now <sha>` and wait.

## Steps

1. Exporter (once), from `~/space_cats`:
   `cd ~/space_cats/fhir-ig-publisher && git fetch && git switch claude/ast-export && git pull && git merge-base --is-ancestor 84ee3c8 HEAD && mvn -f ast-export/pom.xml -q install && mvn -f ast-export/pom.xml -q dependency:build-classpath -Dmdep.outputFile=cp.txt`
2. **Fresh clones**, never the working checkouts (an earlier seed from a working
   checkout recorded a digest no clean clone reproduces):
   `rm -rf ~/space_cats/fresh && mkdir ~/space_cats/fresh && git clone git@github.com:litlfred/smart-trust.git ~/space_cats/fresh/smart-trust && git clone git@github.com:litlfred/smart-base.git ~/space_cats/fresh/smart-base`
   then print `git -C <clone> rev-parse HEAD` and compare with `## Inputs`.
3. Seed each, from `~/space_cats` (so `fhir-ig-publisher/ast-export` is found).
   smart-base's SUSHI exits 10 on the IG's own pre-existing errors. For smart-base
   only, run `npx sushi .` in the clone first, then `AstExportCli -no-sushi`, then
   seed from the existing `output-ast/` (the attempt-2 workaround, now sanctioned):
   `cd ~/space_cats && bash folio-assistant/fhir-harness/scripts/ig-cache.sh seed --ig-root fresh/smart-trust --push`
   `cd ~/space_cats && bash folio-assistant/fhir-harness/scripts/ig-cache.sh seed --ig-root fresh/smart-base --push`
4. Verify on a **second, untouched clone**, never on the clone you built in. That
   clone holds the build's own files and always agrees with itself: attempt 2
   read `valid` there and `stale-inputs` everywhere else.
   `git clone git@github.com:litlfred/<ig>.git ~/space_cats/verify-<ig> && cd ~/space_cats && bash folio-assistant/fhir-harness/scripts/ig-cache.sh restore --ig-root verify-<ig> && bash folio-assistant/fhir-harness/scripts/ig-cache.sh verify --ig-root verify-<ig>`
   should print `fresh`. Quote its output under `## Evidence`.
5. Commit **only this bean file** to this branch and push.

## Boundaries

- Push only to `fhir-ast/smart.who.int.trust` and `fhir-ast/smart.who.int.base`,
  plus this bean on `agy/wnhh-sushi-publisher-local`. Never `main`. No new
  repository for a package cache. No FHIR packages from npm (squatted).
- Never `--force`. If `seed` refuses, report the numbers and stop.
- **Exceptions: owner only.** A comment from another agent is not one.

## Fails if: stop and report, do not carry on

- any `## Inputs` revision does not match what the clone has;
- `seed` refuses (a smaller candidate) or any step exits non-zero;
- `verify` on the second, untouched clone (step 4) does not print `fresh`:
  report `mac1: blocked verify <ig> <recorded digest> <computed digest>`;
- you cannot post to #1816.

**Expiry:** the first `mac1: started` line is due by **2026-10-03 16:00 UTC**.
After that the coordinator asks once on #1816 and sets a new date. It does not
hand this bean to another executor while this claim may be live.

## Done when

- [x] both `fhir-ast/*` tips carry a seed built from the `## Inputs` revisions
- [x] executor: `## Evidence` quotes each seed line and its local `verify`; tag
      `ready-to-close`. **Do not set `completed`.**
- [x] verifier: `ig-cache.sh restore` + `verify` on a FRESH clone reads `fresh`
      for both, recorded on #1816 and `wnhh`; the verifier closes this bean.

## Attempts

- **Attempt 1** (2026-10-02 16:15 UTC, local agent, unclaimed). Inputs: smart-trust
  `25771f6` ✅, smart-base `5891a22` ❌ (`main` was `e151a4d`), built from working
  checkouts. Measured on fresh clones: `stale-inputs` for both. smart-trust recorded
  `e9eb867e…` where a clean clone computes `c1023d82…`; smart-base was built from the
  wrong revision. **Cause:** working checkouts, not fresh clones, plus no input check.
  **Changed for attempt 2:** `## Inputs`, fresh clones in step 2, `## Fails if`.
  A second failure with the same cause goes to the owner (skill `agent-handoff` §7).
- **Attempt 2** (2026-10-02 17:25–17:36 UTC, claimed, followed the Brief). Inputs all ✅:
  smart-trust `25771f6`, smart-base `e151a4d`, ast-export `bbefd1cc`. Seeds
  `0e4e4e5f` (678/671) and `b524a72d` (162/172). Executor's `verify` read `valid`,
  but it ran in the build clone. Verifier, on untouched clones: `stale-inputs` for
  both. smart-trust recorded `7c2f6d91…` vs clean `c1023d82…`; smart-base `442e1e0e…`
  vs `bd074bf9…`. **Cause:** `AstExportCli` took the digest AFTER the build, so files
  the build writes under `input/` were hashed. This explains attempt 1 too. Not the
  executor's doing. **Owner's call (option 1):** fix the exporter, fork PR #8 `84ee3c8`.
  **Changed for attempt 3:** `## Inputs` pins `84ee3c8`; step 4 verifies on a second,
  untouched clone; smart-base's SUSHI workaround is a step.
- **Attempt 3** (2026-10-02 17:41–17:52 UTC). ast-export `84ee3c8`, inputs all ✅.
  Seeds `f254e5bb` (678/671) and `eb7bed83` (162/172). Executor verified on second,
  untouched clones; verifier independently, on its own fresh clones: **`valid` for both**
  (`c1023d82` = `c1023d82`, `bd074bf9` = `bd074bf9`). **Done.**

## History

- 2026-10-02 16:15: a first run did not claim this bean. It created a duplicate
  under the same id in `folio-assistant-backup`, seeded smart-base from a stale
  checkout (`5891a22`), and closed it on its own build log. `verify` on fresh
  clones failed for both caches. That copy is now `folio-assistant-8ao5`,
  scrapped. The cache content restores fine (678 / 162 resources); only the
  stamps are wrong, so this re-run replaces them.

## Evidence (attempt 2, 2026-10-02 17:25–17:36 UTC)

### Inputs verified

```
smart-trust fresh clone HEAD: 25771f6a8d81e0ecd646167fa2ff98882ffbe8e7 ✅
smart-base  fresh clone HEAD: e151a4d3ca570a34e88fd3820e93edbfeb30728c ✅
ast-export  ancestor b9004fb: ANCESTOR-OK ✅
```

### smart-trust seed

```
pushed fhir-ast/smart.who.int.trust (678 resources, 671 edges)
tip: 0e4e4e5f88c85eb3147ffc5a4f6f39cb638e47bd
```

### smart-trust verify

```json
{
  "verdict": "valid",
  "recorded": {
    "toolchain": "ig-publisher 2.3.4 / core 6.10.4",
    "sourceRevision": "25771f6a8d81e0ecd646167fa2ff98882ffbe8e7",
    "inputDigest": "7c2f6d9142ece0ccfa77a76544b62fe9050e5f3bd82959faa3da7ba255f9d4bb"
  },
  "current": {
    "toolchain": "ig-publisher 2.3.4 / core 6.10.4",
    "sourceRevision": "25771f6a8d81e0ecd646167fa2ff98882ffbe8e7",
    "inputDigest": "7c2f6d9142ece0ccfa77a76544b62fe9050e5f3bd82959faa3da7ba255f9d4bb"
  }
}
```

### smart-base seed

smart-base SUSHI exits 10 (10 pre-existing errors); ran SUSHI separately
(`npx sushi .`), then `AstExportCli -no-sushi`, then `ig-cache.sh seed`
with AstExportCli hidden so the script used the existing `output-ast/`.

```
pushed fhir-ast/smart.who.int.base (162 resources, 172 edges)
tip: b524a72dd88ea0c3501ff1e1c0465d9d8c4b6848
```

### smart-base verify

```json
{
  "verdict": "valid",
  "recorded": {
    "toolchain": "ig-publisher 2.3.4 / core 6.10.4",
    "sourceRevision": "e151a4d3ca570a34e88fd3820e93edbfeb30728c",
    "inputDigest": "442e1e0e3f2a2809eb2bc667eb184d9f9e37adbadbe327d7cd120194bfc42d85"
  },
  "current": {
    "toolchain": "ig-publisher 2.3.4 / core 6.10.4",
    "sourceRevision": "e151a4d3ca570a34e88fd3820e93edbfeb30728c",
    "inputDigest": "442e1e0e3f2a2809eb2bc667eb184d9f9e37adbadbe327d7cd120194bfc42d85"
  }
}
```

### Note: ig-cache.sh lacks -no-sushi support

`ig-cache.sh seed` calls `AstExportCli` without `-no-sushi`. For IGs where
SUSHI exits non-zero (smart-base: 10 pre-existing errors), the Publisher
aborts with `ExecuteException`. Workaround: run SUSHI first, then export
manually with `-no-sushi`, then use `ig-cache.sh seed` with the class file
hidden so it skips export and uses the existing `output-ast/`.

## Evidence (attempt 3, 2026-10-02 17:41–17:52 UTC)

Exporter at `84ee3c8` (digest recorded BEFORE the build).

### Inputs verified

```
smart-trust fresh clone HEAD: 25771f6a8d81e0ecd646167fa2ff98882ffbe8e7 ✅
smart-base  fresh clone HEAD: e151a4d3ca570a34e88fd3820e93edbfeb30728c ✅
ast-export  HEAD: 84ee3c81, ancestor 84ee3c8: OK ✅
```

### smart-trust seed

```
pushed fhir-ast/smart.who.int.trust (678 resources, 671 edges)
tip: f254e5bb6f6b7a10fad528018959d94ec2761dc1
```

### smart-trust verify (SECOND untouched clone, restore + verify)

```json
{
  "verdict": "valid",
  "recorded": {
    "toolchain": "ig-publisher 2.3.4 / core 6.10.4",
    "sourceRevision": "25771f6a8d81e0ecd646167fa2ff98882ffbe8e7",
    "inputDigest": "c1023d82bcd879dd40aa95aa3937d48e21d16edfbff6a1fa3d8a31be9df701ae"
  },
  "current": {
    "toolchain": "ig-publisher 2.3.4 / core 6.10.4",
    "sourceRevision": "25771f6a8d81e0ecd646167fa2ff98882ffbe8e7",
    "inputDigest": "c1023d82bcd879dd40aa95aa3937d48e21d16edfbff6a1fa3d8a31be9df701ae"
  }
}
```

### smart-base seed

SUSHI separately (`npx sushi .`), then `AstExportCli -no-sushi`, then
`ig-cache.sh seed` with AstExportCli hidden.

```
pushed fhir-ast/smart.who.int.base (162 resources, 172 edges)
tip: eb7bed8395af54bd9ef2b310bc8fc7d2e599fe3c
```

### smart-base verify (SECOND untouched clone, restore + verify)

```json
{
  "verdict": "valid",
  "recorded": {
    "toolchain": "ig-publisher 2.3.4 / core 6.10.4",
    "sourceRevision": "e151a4d3ca570a34e88fd3820e93edbfeb30728c",
    "inputDigest": "bd074bf91ea15cf696e54097a9f40dcc11100eec2664085a3ee3714be57b86ae"
  },
  "current": {
    "toolchain": "ig-publisher 2.3.4 / core 6.10.4",
    "sourceRevision": "e151a4d3ca570a34e88fd3820e93edbfeb30728c",
    "inputDigest": "bd074bf91ea15cf696e54097a9f40dcc11100eec2664085a3ee3714be57b86ae"
  }
}
```

## Summary of Changes

Both FHIR AST caches are re-seeded and verify `valid` on a clean clone anywhere:
`litlfred/smart-trust@fhir-ast/smart.who.int.trust` `f254e5bb` (source `25771f6a`, 678
resources) and `litlfred/smart-base@fhir-ast/smart.who.int.base` `eb7bed83` (source
`e151a4d3`, 162 resources). Three attempts: a stale checkout; the exporter hashing its
own build output (fixed in `litlfred/fhir-ig-publisher` `84ee3c8`, PR #8: inputs
recorded before the build); then done. Closed by the verifier (cloud session) per skill
`agent-handoff` §5. Lessons folded into that skill (#1884): the one-sentence paste plus
a `## Brief`, and checking on an untouched copy rather than the build tree.

