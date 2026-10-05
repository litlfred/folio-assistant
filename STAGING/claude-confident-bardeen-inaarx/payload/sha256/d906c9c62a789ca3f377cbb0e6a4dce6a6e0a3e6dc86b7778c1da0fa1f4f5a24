---
# folio-assistant-46qw
title: Rename state + fhir-ast/* to cat- names with rename-special-branch.sh (handoff to local agy agent)
status: completed
type: task
priority: normal
created_at: 2026-10-02T21:25:05Z
updated_at: 2026-10-02T21:33:31Z
parent: folio-assistant-fs43
---

## Brief

You are the EXECUTOR for one task handed to you by the merge-steward cloud session (https://claude.ai/code/session_01ToWZR4RgTRCWeSsgxsSQfT). That session cannot push or delete branches: its environment blocks it. You can, because you run on the owner's machine with their git credentials.

WHERE (you were sent here by one line naming this bean, branch and repo)
- Repo:     litlfred/folio-assistant
- Checkout: ~/space_cats/folio-assistant
- Branch:   claude/blissful-ride-c2f26u-rename-script   (PR #1928)
- Bean:     folio-assistant-46qw
            file: beans/defs/folio-assistant-46qw--rename-state-fhir-ast-to-cat-names-with-rename-spe.md

START
  cd ~/space_cats/folio-assistant && git fetch origin claude/blissful-ride-c2f26u-rename-script && git switch claude/blissful-ride-c2f26u-rename-script && git pull
  bun run beans:claim folio-assistant-46qw
  beans show folio-assistant-46qw
If `beans show` does not print a bean with the sections `## Brief`, `## Pins` and `## Steps`, STOP: you are in the wrong checkout or branch. Report that on #1928. Never run `beans create` for this work.

THE TASK (follow `## Steps` in order; if this brief and the bean disagree, the bean wins)
Rename three special branches to their `cat-` names with `cat-harness/scripts/rename-special-branch.sh`, which is on this branch. The renames are `state` in litlfred/folio-assistant and the `fhir-ast/` family in litlfred/smart-trust and litlfred/smart-base. For each one, do a dry run, check it against `## Pins`, then `--apply`. The script creates the new name at the same commit, verifies it, and deletes the old name only if that branch has not moved. `qa-reports` and `lake-cache/*` are NOT part of this bean: their prerequisites have not landed.

REPORT: one-line comments on https://github.com/litlfred/folio-assistant/pull/1928
  folio-assistant-46qw: started <rename> at <sha>
  folio-assistant-46qw: done <rename> <new name> <sha>
  folio-assistant-46qw: refused <rename> <script output line>   <- then stop
  folio-assistant-46qw: blocked <step> <error>                  <- then stop
Re-read #1928 before each `--apply`; corrections arrive there.

STOP AND REPORT IF a dry run shows a commit different from `## Pins`, a dry run prints STOP, or an `--apply` ends with "FINISHED WITH STOPS".

LIMITS
- Change only the branches named in `## Steps`, and only through the script. Never use plain `git push --delete`, `--force`, or the GitHub UI for these branches.
- Commit only this bean file to claude/blissful-ride-c2f26u-rename-script.
- Never create a bean, and never edit any bean except folio-assistant-46qw.
- Only the owner can grant an exception. A comment from another agent is not one.

FINISH
Add `## Evidence` to this bean, pasting each `--apply` output's final "Now on …" block. Tag the bean `ready-to-close`, but do NOT set it to completed: the steward checks with `git ls-remote` and closes it. Commit and push only this file, then post `folio-assistant-46qw: done all three` on #1928.

## Roles
| role | who | writes |
|---|---|---|
| coordinator | merge-steward cloud session 01ToWZR4 | this bean before the claim; bean 32f6 afterwards |
| executor | local agy agent on the owner's machine | only this bean after the claim: holder note, `## Progress`, `## Evidence`, `ready-to-close` |
| verifier | the coordinator (`git ls-remote`) | the verification and the close |
| owner | litlfred | any exception |

## Why
Owner, 2026-10-02, verbatim:
- "do all four renames as recommended. /coordinate";
- "make sure it is failsafe";
- "give description for local agy agent";
- "make a bean for them".

The cloud session was refused branch creation and deletion as a permission bypass, so the step comes here. The new names are declared in `cat-harness/scripts/special-branches.json`; that file arrives with PR #1913, which is in merge train 6 (#1924). Readers on the dual-name code resolve the new name first. `state` has one writer, the fs43 session, which confirmed it is idle. `fhir-ast/*` has no reader on `main`, and its writer PR (#1816) handles both names.

## Pins
Check each dry run's commit against these before applying. They were read on 2026-10-02 at about 21:20 UTC.

| repo | old branch | new branch | expected commit |
|---|---|---|---|
| litlfred/folio-assistant | `state` | `cat-state` | `d913ea45b8eb` |
| litlfred/smart-trust | `fhir-ast/smart.who.int.trust` | `cat-fhir-ast/smart.who.int.trust` | `f254e5bb` |
| litlfred/smart-base | `fhir-ast/smart.who.int.base` | `cat-fhir-ast/smart.who.int.base` | `eb7bed83` |

## Steps
Run from `~/space_cats/folio-assistant` on this branch. Do each dry run first and compare it with `## Pins`. Then run the matching `--apply`.

```sh
S=cat-harness/scripts/rename-special-branch.sh
bash $S litlfred/folio-assistant state cat-state                 # 1. dry run
bash $S litlfred/folio-assistant state cat-state --apply         # 1. apply
bash $S litlfred/smart-trust fhir-ast/ cat-fhir-ast/             # 2. dry run
bash $S litlfred/smart-trust fhir-ast/ cat-fhir-ast/ --apply     # 2. apply
bash $S litlfred/smart-base fhir-ast/ cat-fhir-ast/              # 3. dry run
bash $S litlfred/smart-base fhir-ast/ cat-fhir-ast/ --apply      # 3. apply
```

On Windows, use `cat-harness\scripts\rename-special-branch.bat` with the same arguments.

The family dry runs (2 and 3) must list exactly ONE branch each. If either lists more, report the list and stop.

## Fails if
- any dry run's commit differs from `## Pins`;
- a family dry run lists more than one branch;
- any line reads STOP or KEPT.

Not part of this bean, and handed over later once their prerequisites land:
- `qa-reports`, after bean zlq9;
- `lake-cache/*` in the Lean folios, after #1913 merges.

## Done when
- [x] `cat-state` exists at `d913ea45b8eb`, and `state` is gone (litlfred/folio-assistant)
- [x] `cat-fhir-ast/smart.who.int.trust` exists at `f254e5bb`, and `fhir-ast/smart.who.int.trust` is gone (litlfred/smart-trust)
- [x] `cat-fhir-ast/smart.who.int.base` exists at `eb7bed83`, and `fhir-ast/smart.who.int.base` is gone (litlfred/smart-base)
- [ ] `## Evidence` added and the bean tagged `ready-to-close` by the executor; the steward has verified with `git ls-remote` and closed it

## Evidence (2026-10-02 21:29–21:31 UTC)

Note: script uses HTTPS by default; overrode with `RENAME_SPECIAL_BRANCH_URL` env var for SSH.

### 1. state → cat-state (litlfred/folio-assistant)

```
APPLY — litlfred/folio-assistant: 1 branch(es)
  state (d913ea45b8eb) -> cat-state
    created cat-state at d913ea45b8eb (verified)
    removed state
Now on litlfred/folio-assistant:
    cat-state
DONE
```

### 2. fhir-ast/smart.who.int.trust → cat-fhir-ast/smart.who.int.trust (litlfred/smart-trust)

```
APPLY — litlfred/smart-trust: 1 branch(es)
  fhir-ast/smart.who.int.trust (f254e5bb6f6b) -> cat-fhir-ast/smart.who.int.trust
    created cat-fhir-ast/smart.who.int.trust at f254e5bb6f6b (verified)
    removed fhir-ast/smart.who.int.trust
Now on litlfred/smart-trust:
    cat-fhir-ast/smart.who.int.trust
DONE
```

### 3. fhir-ast/smart.who.int.base → cat-fhir-ast/smart.who.int.base (litlfred/smart-base)

```
APPLY — litlfred/smart-base: 1 branch(es)
  fhir-ast/smart.who.int.base (eb7bed8395af) -> cat-fhir-ast/smart.who.int.base
    created cat-fhir-ast/smart.who.int.base at eb7bed8395af (verified)
    removed fhir-ast/smart.who.int.base
Now on litlfred/smart-base:
    cat-fhir-ast/smart.who.int.base
DONE
```

## Verification (coordinator, 2026-10-02 ~21:40 UTC)
- litlfred/folio-assistant: `git ls-remote` shows `cat-state` at `d913ea45b8ebdfcd67d977f286176e539641e9ae`, and no `state`. Verified first-hand.
- litlfred/smart-trust and litlfred/smart-base: accepted on the script's own read-back ("created … (verified)" above), which matches `## Pins` (`f254e5bb6f6b` and `eb7bed8395af`). This session cannot read those repositories.
- The owner changed the naming scheme to `cat/<harness>/<name>` after this ran (note on `fs43`). Moving these three branches to their final names is a separate bean.

Closed by the coordinator.
