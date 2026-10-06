---
layout: default
generated: scripts/gen-skill-docs.ts — do not hand-edit; edit the skill
title: 'Remote-mount a harness'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/kg/kg-core/remote-mount.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/kg/kg-core/remote-mount.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/kg/kg-core/remote-mount.md){: .fa-edit-source }

{% raw %}
# Remote-mount a harness

The owner, 2026-10-06, ruled on how a downstream folio gets the layers it is
built on:

- **no git submodules, ever**;
- **no `.deps/`**, because a dot directory collides with GitHub's conventions
  and with this repository's own dot-prefix guard;
- a remote mount is a **declared directory with a remote source**, pinned to
  a full 40-character SHA;
- the **defaults live in the harness's own declaration**, so a downstream
  never restates the paths;
- a downstream **may override** them **by id**, never by path;
- mounts are resolved **transitively** across the dependency closure;
- code arrives through the mounted code directories.

| | where |
|---|---|
| the process | [`mount-dependency.bpmn`](../../processes/mount-dependency.html); the per-subgraph view is the `remote` flow of [`mount-subgraph.bpmn`](../../processes/mount-subgraph.html) |
| the schema | `cat-harness/schemas/remote-mount.ts`, plus the `remote` member of `SubgraphSource` (`schemas/subgraph-source.ts`) |
| the tool | `bun run mount:remote` (`--plan` to resolve without writing), and `bun run mount:remote:check` (offline) |
| the entry point | `bun run state:mount`, which the session-start hook already runs |

## Mount, subscribe or associate: choose first

| you want | relation | what arrives |
|---|---|---|
| to **build on** a harness: run its scripts, import its schemas, read its skills as your own | **remote mount** (`remoteMounts`) | the harness's declared directories and those of everything it needs, at one pin |
| to **read** another graph and hold chosen parts of it | **subscription** (`subscriptions`): the [`kg-subscription`](kg-subscription.md) skill | a snapshot of its declaration, then parts you materialise one at a time through the five gates |
| to **know of** a harness and link to it | **association** (`associatedHarnesses`): the [`associate-harness`](associate-harness.md) skill | nothing |

The test is whether **your code imports theirs**. If it does, mount. If you
only read their content, subscribe: a subscription gates every part through
copyright and purpose, and a mount does not, because the code it brings is the
platform you are built on.

## The two halves of the declaration

**The harness side** goes in the harness's own `<name>.json` and is written
once by the harness's owner:

```json
"mountDefaults": { "path": "cat-harness", "directories": ["schemas", "scripts", "skills"] }
```

Both fields are optional, and each absence has a meaning:

- `path` absent means the instance's **home path** (`livesAt.path`, else its
  directory in its own repository).
- `directories` absent means **every declared directory whose content is in the
  checkout**. A `branch`, `family` or `remote` source is somebody's state, not
  part of the harness.

**The downstream side** goes in the folio's own `<name>.json`:

```json
"remoteMounts": [
  { "harness": "folio-assistant-core", "repository": "litlfred/folio-assistant",
    "ref": "<40-character sha>",
    "overrides": { "cat-harness": { "directories": ["schemas", "skills"] }, "bootstrap": { "skip": true } } }
]
```

`overrides` is keyed by instance name, then by directory id:

- `path` moves an instance.
- `directories` replaces its default list. An id the instance does not declare
  is refused, not dropped.
- `skip` leaves it unmounted, and the lock records it as an answer.

## Why the default path is the home path

At its home path, a mounted instance keeps its position relative to its
siblings. Two things then follow with no extra machinery:

- `instanceRootsIn` scans one level deep, so it finds every mounted sibling and
  `needs` resolves exactly as it does in the monorepo.
- A relative import such as `../../cat-harness/schemas/…` finds the file it
  names.

Moving an instance by override is allowed, and the overlay still finds it
through the lock (`mountedInstanceRoots`, `mountScopeFor`). The override is
then responsible for any import that climbs out of the moved instance.

## The closure

1. The harness's declaration is read **from the pinned tree**, not from this
   checkout.
2. Each `needs` name is looked for in the same tree.
3. If it is not there, the planner looks for a **gitlink** at that tree's root.
   A submodule entry is itself a pin, so a need on `bootstrap` resolves to
   `litlfred/bootstrap` at the gitlink's SHA. The downstream gets the bytes and
   never a submodule.
4. A need the downstream already holds as a local instance is `local`: it is
   supplied by the checkout and never mounted over.
5. A need found nowhere is `missing`. It is never dropped.

## The lock, and the three states

`<name>.mount-lock.json` sits beside the downstream's declaration and is
**committed**. It records:

- the pins it was written for;
- for each instance: the repository, the SHA, how the pin was found
  (`declared` / `same-tree` / `gitlink`), the declaration's digest and each
  directory's tree digest;
- what was **not** mounted, and why.

The mounted bytes are **not** committed. If the checkout's own rules do not
already ignore a mount path, it goes into this worktree's `info/exclude`. A
folio that wants the rule visible commits it to `.gitignore`.

Every instance ends in exactly one state:

| state | means | exit |
|---|---|---|
| mounted | on disk, hashing to the lock | 0 |
| missing | not on disk, edited since mounting, not in the tree, refused, or the lock is for other pins | 1 |
| could-not-determine | the fetch failed, a declaration or lock is unreadable, or an instance is reached at two pins | 2 |

Could-not-determine outranks missing, and missing outranks mounted. **A fetch
that failed is never an empty layer.**

## Never

- **Never add a submodule** to get a dependency, and never clone into `.deps/`.
- **Never pin a branch or an abbreviated SHA.** The schema refuses both.
- **Never edit a mounted directory and expect a re-mount to keep the edit, or
  to throw it away.** A re-mount leaves edited bytes untouched and reports them
  as missing. Move the edit upstream, or delete the directory and re-mount.
- **Never mount over tracked files**, or over a directory that no lock says
  this mount made. Both are refused.
- **Never read `missing` or `could-not-determine` as "that layer has nothing
  in it".** A layer that is not mounted is absent from every overlay.

## Not yet

These are tracked on bean `0mpw`:

- `init-folio --link remote`;
- pinning `skill_fetch`'s `REFERENCE_PACKAGES`;
- the pilot (smart-ra drops its submodule);
- the who-iris cutover (bean `g8jp`), which is the first real consumer.
{% endraw %}

## Processes that run this skill

| process | step(s) that name it |
|---|---|
| [Remote-mount a dependency](../../processes/mount-dependency.html) | Declare the mount: harness, repository, pin; Resolve the closure at the pin; Mount each instance at its declared path; Write the lock; Check disk against lock against declaration |
| [Mount a declared subgraph](../../processes/mount-subgraph.html) | Mount the remote tree at its pin |

