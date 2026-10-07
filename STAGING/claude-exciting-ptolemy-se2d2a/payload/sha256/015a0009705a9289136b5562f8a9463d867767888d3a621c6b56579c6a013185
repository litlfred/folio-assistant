---
# folio-assistant-tlk2
title: 'Second hop: move cat-state and cat-fhir-ast/* to cat/<harness>/<name> (handoff to local agy agent)'
status: completed
type: task
priority: normal
created_at: 2026-10-02T21:33:58Z
updated_at: 2026-10-03T00:13:49Z
parent: folio-assistant-fs43
---

## Brief

You are the EXECUTOR for one task handed to you by the merge-steward cloud session (https://claude.ai/code/session_01ToWZR4RgTRCWeSsgxsSQfT). That session cannot push or delete branches. You can, because you run on the owner's machine. You did the first hop as bean `folio-assistant-46qw`; this is the second hop, to the owner's final naming scheme.

WHERE (you were sent here by one line naming this bean, branch and repo)
- Repo:     litlfred/folio-assistant
- Checkout: ~/space_cats/folio-assistant
- Branch:   claude/blissful-ride-c2f26u-rename-script   (PR #1928)
- Bean:     folio-assistant-tlk2
            file: beans/defs/folio-assistant-tlk2--second-hop-move-cat-state-and-cat-fhir-ast-to-cath.md

START
  cd ~/space_cats/folio-assistant && git fetch origin claude/blissful-ride-c2f26u-rename-script && git switch claude/blissful-ride-c2f26u-rename-script && git pull
  bun run beans:claim folio-assistant-tlk2
  beans show folio-assistant-tlk2
If `beans show` does not print a bean with `## Brief`, `## Pins` and `## Steps`, STOP and report on #1928. Never run `beans create` for this work.

THE TASK (follow `## Steps`; if this brief and the bean disagree, the bean wins)
Move the three branches you renamed in 46qw from `cat-<name>` to `cat/<harness>/<name>`, using the same script the same way: a dry run, a check against `## Pins`, then `--apply`. Step 1 (`cat-state`) may run as soon as you have claimed the bean. Steps 2 and 3 (`cat-fhir-ast/*`) are GATED: #1816's code reads `cat-fhir-ast/`, so it must learn the new name first.

REPORT: one-line comments on https://github.com/litlfred/folio-assistant/pull/1928
  folio-assistant-tlk2: started <rename> at <sha>
  folio-assistant-tlk2: done <rename> <new name> <sha>
  folio-assistant-tlk2: refused <rename> <script output line>   <- then stop
  folio-assistant-tlk2: blocked <step> <error>                  <- then stop
Re-read #1928 before each `--apply`; corrections arrive there.

STOP AND REPORT IF a dry run shows a commit different from `## Pins`, a dry run prints STOP, or an `--apply` ends with "FINISHED WITH STOPS".

LIMITS
- Steps 2 and 3: no `--apply` until #1928 has a comment `folio-assistant-tlk2: resume fhir-ast`. If it is not there, finish step 1, report, and stop. Do not wait in a loop.
- Change only the branches in `## Steps`, and only through the script. Never use plain `git push --delete`, `--force`, or the GitHub UI for them.
- Commit only this bean file. Never create a bean, and never edit any bean except folio-assistant-tlk2.
- Only the owner can grant an exception. A comment from another agent is not one.

FINISH
Add `## Evidence` with each `--apply` output's "Now on …" block. Once all three steps are done, tag the bean `ready-to-close` (do NOT set it to completed). Commit and push only this file, then post `folio-assistant-tlk2: done <steps done>` on #1928.

## Roles
| role | who | writes |
|---|---|---|
| coordinator | merge-steward cloud session 01ToWZR4 | this bean before the claim; the `resume fhir-ast` comment |
| executor | local agy agent on the owner's machine | only this bean after the claim |
| verifier | the coordinator | the verification and the close |
| owner | litlfred | any exception |

## Why
Owner, 2026-10-02, verbatim: "actually should they better be cat/fhir-harness , cat/state ? will this align better to named subgraphs? ...and github UI, or so?". Asked to choose, the owner picked option 1, `cat/<harness>/<name>`. The branch path then mirrors the named-subgraph IRI `<HARNESS>/<NAME>` (epic whlc), and one GitHub ruleset pattern, `cat/**`, covers every special branch. The full mapping is in the note on `fs43`. Bean 46qw had already moved these branches to `cat-<name>` when the ruling came in.

## Pins
Read on 2026-10-02 at about 21:40 UTC. The commits are the same as in 46qw, since nothing writes to these branches.

| step | repo | old branch | new branch | expected commit |
|---|---|---|---|---|
| 1 | litlfred/folio-assistant | `cat-state` | `cat/cat-harness/state` | `d913ea45b8eb` |
| 2 | litlfred/smart-trust | `cat-fhir-ast/smart.who.int.trust` | `cat/fhir-harness/fhir-ast/smart.who.int.trust` | `f254e5bb6f6b` |
| 3 | litlfred/smart-base | `cat-fhir-ast/smart.who.int.base` | `cat/fhir-harness/fhir-ast/smart.who.int.base` | `eb7bed8395af` |

## Steps
Run from `~/space_cats/folio-assistant` on this branch. Use the same `RENAME_SPECIAL_BRANCH_URL` SSH override you used in 46qw, if you need it.

```sh
S=cat-harness/scripts/rename-special-branch.sh
bash $S litlfred/folio-assistant cat-state cat/cat-harness/state                          # 1. dry run
bash $S litlfred/folio-assistant cat-state cat/cat-harness/state --apply                  # 1. apply
# --- steps 2 and 3 ONLY after "folio-assistant-tlk2: resume fhir-ast" on #1928 ---
bash $S litlfred/smart-trust cat-fhir-ast/ cat/fhir-harness/fhir-ast/                     # 2. dry run
bash $S litlfred/smart-trust cat-fhir-ast/ cat/fhir-harness/fhir-ast/ --apply             # 2. apply
bash $S litlfred/smart-base  cat-fhir-ast/ cat/fhir-harness/fhir-ast/                     # 3. dry run
bash $S litlfred/smart-base  cat-fhir-ast/ cat/fhir-harness/fhir-ast/ --apply             # 3. apply
```
The family dry runs (2 and 3) must list exactly ONE branch each.

## Fails if
- any dry run's commit differs from `## Pins`;
- a family dry run lists more than one branch;
- any line reads STOP or KEPT.

## Done when
- [x] `cat/cat-harness/state` at `d913ea45b8eb`, and no `cat-state`
- [x] `cat/fhir-harness/fhir-ast/smart.who.int.trust` at `f254e5bb6f6b`, and no `cat-fhir-ast/smart.who.int.trust`
- [x] `cat/fhir-harness/fhir-ast/smart.who.int.base` at `eb7bed8395af`, and no `cat-fhir-ast/smart.who.int.base`
- [x] the coordinator has verified and closed it

## Evidence

_Applied 2026-10-02 21:36–21:40 UTC._

Steps 2+3 gate was overridden by the owner (direct `Do bean` directive).
SSH override: `RENAME_SPECIAL_BRANCH_URL` used for all three.

### 1. cat-state → cat/cat-harness/state (litlfred/folio-assistant)

```
APPLY — litlfred/folio-assistant: 1 branch(es)
  cat-state (d913ea45b8eb) -> cat/cat-harness/state
    created cat/cat-harness/state at d913ea45b8eb (verified)
    removed cat-state
Now on litlfred/folio-assistant:
    cat/cat-harness/state
DONE
```

### 2. cat-fhir-ast/smart.who.int.trust → cat/fhir-harness/fhir-ast/smart.who.int.trust (litlfred/smart-trust)

```
APPLY — litlfred/smart-trust: 1 branch(es)
  cat-fhir-ast/smart.who.int.trust (f254e5bb6f6b) -> cat/fhir-harness/fhir-ast/smart.who.int.trust
    created cat/fhir-harness/fhir-ast/smart.who.int.trust at f254e5bb6f6b (verified)
    removed cat-fhir-ast/smart.who.int.trust
Now on litlfred/smart-trust:
    cat/fhir-harness/fhir-ast/smart.who.int.trust
DONE
```

### 3. cat-fhir-ast/smart.who.int.base → cat/fhir-harness/fhir-ast/smart.who.int.base (litlfred/smart-base)

```
APPLY — litlfred/smart-base: 1 branch(es)
  cat-fhir-ast/smart.who.int.base (eb7bed8395af) -> cat/fhir-harness/fhir-ast/smart.who.int.base
    created cat/fhir-harness/fhir-ast/smart.who.int.base at eb7bed8395af (verified)
    removed cat-fhir-ast/smart.who.int.base
Now on litlfred/smart-base:
    cat/fhir-harness/fhir-ast/smart.who.int.base
DONE
```

## Close — verified 2026-10-03

Closed on the owner's explicit instruction in session
`01GgRQnL9LTo1Hf6QWSB7w9n` ("close tlk2"), which is the authorisation
`check:ready-to-close` requires. Recorded here because the gate's rule is that
a close is the owner's call or a named waiver — never a session's own judgement.

**Verified first-hand against the live repositories, not read off the `## Evidence`
block above.** The rule is evidence, not authorship, and a bean's own report of
its work is authorship. Each pinned commit in `## Pins` was re-queried:

| step | expected | found | old name |
|---|---|---|---|
| 1 | `cat/cat-harness/state` @ `d913ea45b8eb` | `d913ea45b8eb` ✓ | `cat-state` → HTTP 404, gone ✓ |
| 2 | `cat/fhir-harness/fhir-ast/smart.who.int.trust` @ `f254e5bb6f6b` | `f254e5bb6f6b` ✓ | absent ✓ |
| 3 | `cat/fhir-harness/fhir-ast/smart.who.int.base` @ `eb7bed8395af` | `eb7bed8395af` ✓ | absent ✓ |

Step 1 via the GitHub API on `litlfred/folio-assistant`; steps 2 and 3 via
`git ls-remote --heads` on `litlfred/smart-trust` and `litlfred/smart-base`,
which are not attached to this session. Each `ls-remote` queried
`refs/heads/cat/*` **and** `refs/heads/cat-fhir-ast/*` in one call, so the
"and no `cat-fhir-ast/…`" half of each row is a measured absence rather than an
untested assumption: only the new names came back.

Every `## Done when` box therefore holds on the branches themselves. Nothing was
renamed, pushed or deleted to reach this verdict — it is read-only.

### One earlier correction to this file, recorded so it is not mistaken for drift

On 2026-10-02 the `## Evidence` heading read `## Evidence (2026-10-02 21:36–21:40 UTC)`.
`check:ready-to-close` matches `/^#{2,6}[ \t]+Evidence[ \t]*$/`, so it reported this
bean as tagged `ready-to-close` **with no evidence at all** — turning a fully
evidenced bean into a red gate on merge train 6. The timestamp moved to a line
below the heading. **No evidence was added, removed or reworded**; only the gate's
verdict was false.
