---
# folio-assistant-mac1
title: Re-seed both fhir-ast caches with the git-tree InputDigest (needs FHIR network)
status: todo
type: task
priority: high
tags:
    - agy
    - needs-network
created_at: 2026-10-02T15:30:31Z
updated_at: 2026-10-02T17:10:00Z
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

## Inputs (pinned 2026-10-02 16:45 UTC: stop on any mismatch)

| input | expected |
|---|---|
| `litlfred/fhir-ig-publisher@claude/ast-export` | contains `b9004fb` (InputDigest) and `cf52eb7` (optional deps) |
| `litlfred/smart-trust@main` | `25771f6a8d81e0ecd646167fa2ff98882ffbe8e7` |
| `litlfred/smart-base@main` | `e151a4d3ca570a34e88fd3820e93edbfeb30728c` |

If `main` has moved, report `mac1: blocked inputs <repo> now <sha>` and wait.

## Steps

1. Exporter (once), from `~/space_cats`:
   `cd ~/space_cats/fhir-ig-publisher && git fetch && git switch claude/ast-export && git pull && git merge-base --is-ancestor b9004fb HEAD && mvn -f ast-export/pom.xml -q install && mvn -f ast-export/pom.xml -q dependency:build-classpath -Dmdep.outputFile=cp.txt`
2. **Fresh clones**, never the working checkouts (an earlier seed from a working
   checkout recorded a digest no clean clone reproduces):
   `rm -rf ~/space_cats/fresh && mkdir ~/space_cats/fresh && git clone git@github.com:litlfred/smart-trust.git ~/space_cats/fresh/smart-trust && git clone git@github.com:litlfred/smart-base.git ~/space_cats/fresh/smart-base`
   then print `git -C <clone> rev-parse HEAD` and compare with `## Inputs`.
3. Seed each, from `~/space_cats` (so `fhir-ig-publisher/ast-export` is found):
   `cd ~/space_cats && bash folio-assistant/fhir-harness/scripts/ig-cache.sh seed --ig-root fresh/smart-trust --push`
   `cd ~/space_cats && bash folio-assistant/fhir-harness/scripts/ig-cache.sh seed --ig-root fresh/smart-base --push`
4. Before pushing the bean: `ig-cache.sh verify --ig-root fresh/<ig>` should
   print `fresh`; quote its output under `## Evidence`.
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
- your local `verify --ig-root fresh/<ig>` does not print `fresh` after seeding:
  report `mac1: blocked verify <ig> <recorded digest> <computed digest>`;
- you cannot post to #1816.

**Expiry:** the first `mac1: started` line is due by **2026-10-03 16:00 UTC**.
After that the coordinator asks once on #1816 and sets a new date. It does not
hand this bean to another executor while this claim may be live.

## Done when

- [ ] both `fhir-ast/*` tips carry a seed built from the `## Inputs` revisions
- [ ] executor: `## Evidence` quotes each seed line and its local `verify`; tag
      `ready-to-close`. **Do not set `completed`.**
- [ ] verifier: `ig-cache.sh restore` + `verify` on a FRESH clone reads `fresh`
      for both, recorded on #1816 and `wnhh`; the verifier closes this bean.

## Attempts

- **Attempt 1** (2026-10-02 16:15 UTC, local agent, unclaimed). Inputs: smart-trust
  `25771f6` ✅, smart-base `5891a22` ❌ (`main` was `e151a4d`), built from working
  checkouts. Measured on fresh clones: `stale-inputs` for both. smart-trust recorded
  `e9eb867e…` where a clean clone computes `c1023d82…`; smart-base was built from the
  wrong revision. **Cause:** working checkouts, not fresh clones, plus no input check.
  **Changed for attempt 2:** `## Inputs`, fresh clones in step 2, `## Fails if`.
  A second failure with the same cause goes to the owner (skill `agent-handoff` §7).

## History

- 2026-10-02 16:15: a first run did not claim this bean. It created a duplicate
  under the same id in `folio-assistant-backup`, seeded smart-base from a stale
  checkout (`5891a22`), and closed it on its own build log. `verify` on fresh
  clones failed for both caches. That copy is now `folio-assistant-8ao5`,
  scrapped. The cache content restores fine (678 / 162 resources); only the
  stamps are wrong, so this re-run replaces them.
