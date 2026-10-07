---
layout: default
generated: scripts/gen-skill-docs.ts — do not hand-edit; edit the skill
title: 'Pinned remote dependency'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/kg/kg-core/pinned-remote-dependency.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/kg/kg-core/pinned-remote-dependency.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/kg/kg-core/pinned-remote-dependency.md){: .fa-edit-source data-fa-link="edit" data-src="cat-harness/skills/kg/kg-core/pinned-remote-dependency.md" data-repo="litlfred/folio-assistant" }

{% raw %}
# Pinned remote dependency

A dependency that lives in another repository is held at **one commit**, and
that commit moves only when a **person** says so. This skill is the
workflow; each mechanism is a Tool that implements it (owner, 2026-10-07,
#2467 / PR #2468):

| Tool | when |
|---|---|
| `kg-remote-mount` | the dependency is a harness (a KG instance); this repository since #2470 |
| `git-submodule` | another repository that keeps git submodules |

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

## A future mechanism, not declared

A **remote graph database** could implement the same workflow: pin = a
snapshot or version id, plan-update = a graph diff between two versions,
apply = re-point and re-verify. It is named here as an example only. There
is no Tool node for it, because a declared-but-absent mechanism is the
`dh4f` defect: a consumer would scan it and report a clean run over nothing.

## Related

- [`remote-mount`](remote-mount.md): the `kg-remote-mount` mechanism itself,
  the lock, assets, adopt-if-identical and the manifest rule.
- [`deletion-requires-confirmation`](deletion-requires-confirmation.md):
  why drift is reported and never resolved by the tool.
{% endraw %}
