---
name: pinned-remote-dependency
description: >
  The workflow for a dependency held in another repository at a pinned
  commit, whatever the mechanism: the five operations every mechanism
  provides (status, plan-update, consent, apply, drift), the rule that
  consent is always a person's and never an agent's, the three-state rule,
  and the git-submodule ↔ remote-mount correspondence. Two Tools implement it:
  `kg-remote-mount` and `git-submodule`. Read before updating a pin, before
  answering "is this dependency up to date", and before choosing a mechanism.
adapters: [document, paper, dak]
profiles: [document, paper]
consulted: true
---

# Pinned remote dependency

A dependency that lives in another repository is held at **one commit**, and
that commit moves only when a **person** says so. This skill is the
workflow; each mechanism is a Tool that implements it (owner, 2026-10-07,
#2467 / PR #2468):

| Tool | when |
|---|---|
| `kg-remote-mount` | the dependency is a harness (a KG instance); this repository since #2470 |
| `git-submodule` | another repository that keeps git submodules. Available mechanism; not used by folio-assistant (migrated to KG remote mounts in #2470) |
| `mount-relocate` | a mount's path collides with something the downstream has (see below) |

Mounts are declared in `index.config.json` (`source.remote`), read and
written only through `readDeclaredMounts` / `writeDeclaredMounts`
(`schemas/index-config.ts`); the lock is `index.lock.json`.

The worked example of switching mechanisms under the same workflow is this
repository: `bootstrap` and `bootstrap-tools` were git submodules until #2470
made them whole-instance remote mounts. The pins did not move; the gitlink
SHAs became `ref`s, consented by the owner, and the workflow below did not
change.

## The five operations

| operation | what it answers or does | `kg-remote-mount` | `git-submodule` |
|---|---|---|---|
| **status** | pinned at what; tracking which branch; behind by N; drifted; or could not determine | `bun run cat mount:remote:check` (disk against lock, offline) and `bun run cat mount:update` (how far `track` is ahead); the `remote-mounts` health check reports both | `git submodule status`, then `git fetch` in the submodule and `git rev-list --count <gitlink>..origin/<branch>` |
| **plan-update** | pin → tip: commits, files changed under what is mounted, the declaration diff, and the manifest's scripts added, removed and changed with old and new commands | `bun run cat mount:update [--instance <harness>]`: prints the plan and the question, writes nothing, exits 4 (awaiting consent) | `git log` and `git diff <gitlink>..origin/<branch>` in the submodule |
| **consent** | a person approves this exact commit | `--yes-consent-by <login> --evidence <where>`, recorded as `trust.consent` {by, on, ref, evidence} | a person commits the moved gitlink; the commit is the record |
| **apply** | re-pin and re-lock | the same `mount:update` call with the consent flags: writes `ref` and `trust.consent`, re-mounts, re-locks; a fresh clone then replays the lock with `bun run cat mount:lock` | `git submodule update --remote <path>`, then commit the gitlink |
| **drift** | the mounted bytes are not the pin's | a mounted file that no longer hashes to the lock: `mount:update` refuses and lists the edited paths | a dirty submodule (`git status` inside it) |

The remedy for drift is the same in every mechanism: **upstream first**. Move
the edits to the dependency's own repository as a pull request to the fork,
then update to the commit that contains them. Nothing in this workflow
overwrites or deletes local edits.

## Consent is a person's, never an agent's

An agent runs **status** and **plan-update**, shows the plan to the person,
and asks the one question the plan ends with ("Update <harness> <pin7> →
<tip7>?"). It passes `--yes-consent-by` only to **record** the answer the
person gave, with `--evidence` pointing at where they gave it. It never
passes the flags on its own initiative, never infers consent from silence,
and never carries consent for one commit over to another: a moved pin asks
again (rule H8, `schemas/mount-trust.ts`). The `--help` of `mount:update`
says the same.

## Three states, never two

Every status is one of a determined answer or **could not determine**. A
fetch that failed is not "up to date"; a lock that cannot be read is not
"mounted"; a health row that could not be judged makes the `remote-mounts`
check `unknown` and is never rendered clean. `update-available` is not a
failure: a pin behind its branch is the pin doing its job until a person
moves it. The health check reports it as a measurement and acts on nothing.

## git submodule ↔ remote mount

| git submodule | remote mount |
|---|---|
| gitlink (the SHA in the superproject's tree) | `ref`, the 40-character pin in `remoteMounts` |
| `branch =` in `.gitmodules` | `track` |
| `git submodule update --remote` | `bun run cat mount:update` |
| committing the moved gitlink | consent: `--yes-consent-by` + `--evidence`, recorded as `trust.consent` |
| dirty submodule | drift: a mounted file that no longer hashes to the lock |
| `git submodule update --init` on a fresh clone | `bun run cat mount:lock` (replays the committed lock) |
| `.git/modules/<name>` | `<downstream>.mount-lock.json` (committed; the bytes are not) |

## Mount path collisions and relocation

Bean `t4xb` (owner, 2026-10-07). A remote instance lands at its effective
path: `overrides.<name>.path`, else `<name>/`, in the downstream root, which
also holds the downstream's own directories. Before anything is laid down,
`mount:remote` (and so `mount:update`) checks every effective path against:

- a directory the downstream **declares**;
- a **reserved root name**, from the one declared list
  `cat-harness/schemas/reserved-root-names.json` (it includes `index`);
- **another mount's** path.

A collision is refused with `refusal: "path-collision"`. The refusal names both
claimants and gives the fix. A populated directory that no lock accounts for
goes through adopt-if-identical first: an identical tree is adopted, and
anything else is refused with the differing and extra paths and the same fix.
The `remote-mounts` health check reports `path-collision` as a finding.

The fix is to move the mount, never the other claimant:

```sh
bun run cat mount:relocate <instance> --to <dir> --plan   # what would change; writes nothing
bun run cat mount:relocate <instance> --to <dir>
```

The `mount-relocate` Tool checks `<dir>` the same way and writes the path
through `writeDeclaredMounts` (index.config.json). Then it does one of three
things:

- **mounted and clean**: moves the directory and rewrites its lock entry;
- **drifted**: refuses and changes nothing; move the edits upstream first;
- **not mounted yet**: declares the new path and mounts there.

**The mount path and the route are separate concerns.** Every visualiser is
reachable at the canonical `<base>/<harness>/<visualizer>/`. A shorter
`<base>/<visualizer>/` exists only as an opt-in alias. Relocating the bytes
on disk does **not** change the harness's URL namespace: the route follows
the harness's name, not where its bytes sit in a checkout.

## Mounted code is git-ignored

Mount paths are git-ignored. `index.config.json` generates a `.gitignore`
block for them, and the mounted bytes are never committed. Three consequences:

- **ripgrep, editor search and git-based scanners skip mounted
  directories.** Search them with `rg --no-ignore`, or in the source
  repository.
- **A scanner that must cover mounts reads the lock, not git**: the lock
  names every mounted instance, its path and its digest.
- **An edit inside a mount is never committed.** A re-mount refuses it as
  drift, so move it upstream as a pull request to the fork.

`bun run cat check:mount-tracked` is the gate: no tracked file may sit under
any mount's effective path, read from the declared mounts and the lock. The
health check reports the same as `tracked-under-mount`.

## A future mechanism, not declared

A **remote graph database** could implement the same workflow: pin = a
snapshot or version id, plan-update = a graph diff between two versions,
apply = re-point and re-verify. It is named here as an example only. There
is no Tool node for it, because a declared-but-absent mechanism is the
`dh4f` defect: a consumer would scan it and report a clean run over nothing.

## Related

- [`remote-mount`](remote-mount.md): the `kg-remote-mount` mechanism itself,
  the lock, assets, adopt-if-identical and the manifest rule.
- Bean `t4xb`: mount path and route collisions, `<base>/<harness>/<visualizer>/`
  canonical and `<base>/<visualizer>/` an opt-in alias.
- [`deletion-requires-confirmation`](../../conduct/conduct-core/deletion-requires-confirmation.md):
  why drift is reported and never resolved by the tool.
