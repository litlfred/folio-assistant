---
name: remote-mount
description: >
  Bring a harness, and every instance it depends on, into a checkout that does
  not hold it, from another repository at a pinned commit, as declared
  directories with a lock: `remoteMounts` on the downstream and `mountDefaults`
  on the harness. Covers when to mount and when to subscribe instead, why
  there are no submodules and no `.deps/`, the transitive closure through
  `needs` and gitlinks, overrides by id, the lock, and the three states.
  Bean 0mpw.
adapters: [document, paper, dak]
profiles: [document, paper]
consulted: true
---

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
| the process | [`mount-dependency.bpmn`](../../../processes/kg/mount-dependency.bpmn); the per-subgraph view is the `remote` flow of [`mount-subgraph.bpmn`](../../../processes/kg/mount-subgraph.bpmn) |
| the schema | `cat-harness/schemas/remote-mount.ts`, plus the `remote` member of `SubgraphSource` (`schemas/subgraph-source.ts`) |
| the tool | `bun run cat mount:remote` (`--plan` to resolve without writing), `bun run cat mount:remote:check` (offline), `bun run cat mount:lock` (replay a committed lock on a fresh clone) and `bun run cat mount:update` (move a pin, on consent) |
| the update workflow | [`pinned-remote-dependency`](pinned-remote-dependency.md): status, plan-update, consent, apply, drift, and the git-submodule correspondence |
| the entry point | `bun run cat state:mount`, which the session-start hook already runs |

## Mount, subscribe or associate: choose first

| you want | relation | what arrives |
|---|---|---|
| to **build on** a harness: run its scripts, import its schemas, read its skills as your own | **remote mount** (`remoteMounts`) | the harness's declared directories and those of everything it needs, at one pin |
| to **read** another graph and hold chosen parts of it | **subscription** (`subscriptions`): the [`kg-subscription`](../../library/large-datasets/kg-subscription.md) skill | a snapshot of its declaration, then parts you materialise one at a time through the five gates |
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
  { "harness": "<harness>", "repository": "<owner>/<repo>",
    "ref": "<40-character sha>",
    "overrides": { "cat-harness": { "directories": ["schemas", "skills"] }, "bootstrap": { "skip": true } } }
]
```

`overrides` is keyed by instance name, then by directory id:

- `path` moves an instance.
- `directories` replaces its default list. An id the instance does not declare
  is refused, not dropped.
- `assets` replaces its default asset list (see below), with the same rule.
- `whole` mounts every tracked file at the instance root as one `*` directory.
- `skip` leaves it unmounted, and the lock records it as an answer.

A mount may also carry `track`, a branch name: the `branch =` of
`.gitmodules`. It never moves `ref`; `bun run cat mount:update` reports how
far the branch is ahead and re-pins only on a person's consent
([`pinned-remote-dependency`](pinned-remote-dependency.md)).

## Assets, and a mounted `package.json` (owner, 2026-10-07: "Option A, by reference")

Besides its directories, a mount carries the harness's declared **assets**:
single files named in its own `assets` at instance scope (a
`repository`-scoped asset is the upstream repository's and is never mounted).
`mountDefaults.assets` or an override's `assets` narrows the list by id. Each
asset is locked by sha256 and verified by `mount:remote:check`, the replayer
and the health check like a directory.

That is how a mounted layer's scripts arrive. `bun run cat <name>` reads a
mounted instance's `package.json` `checkoutScripts` **only** when the lock
vouches for its bytes: listed as an asset whose sha256 matches, or, for a
`whole` mount (who-iris, fhir-harness), inside the `*` directory whose digest
matches. Otherwise the manifest is **unresolvable**, a third state: `bun run
cat` exits 3 and names the manifest instead of saying "no such script", and
`check:script-placement` fails could-not-determine. A mounted manifest that
declares no `checkoutScripts` at all (bootstrap-tools keeps its own
`scripts`) hides no script and is not reported. `check:script-placement`
does not POLICE a verified mounted manifest: its repository keeps it (bean
`nn8e`). Nothing is copied into this repository's git: the file is fetched at
the consented pin and hash-locked.

## Adopt if identical (owner, 2026-10-07)

When the target of a planned instance already exists and no lock says this
mount put it there, `mount:remote` fetches the pinned tree and compares, file
by file, every declared directory, every declared asset and the declaration
with what is on disk, and requires no extra file under a declared directory.

- **All identical**: the lock entry is written (`adopted: true`) and the
  instance is `mounted`. Only the lock is written.
- **Anything else**: refused, `refusal: "not-identical"`, with `differing`
  (bytes differ, or the pin has a file the disk lacks) and `extra` (files the
  pin does not have). The same lists go into the lock's `unmounted` entry,
  so the mount report and the `remote-mounts` health check agree.

It never overwrites or deletes anything, and a target holding **tracked**
files stays refused (`refusal: "tracked"`). An instance the checkout already
holds as one of its own (found by `instanceRootsIn`, not by a lock) is still
`local`, not adopted.

## Health

`bun run cat health` carries a `remote-mounts` check reading the declaration,
the lock and the disk. Each mounted instance is one of: mounted and matching
the lock; refused-not-identical (with the differing and extra paths);
refused-other (trust, tracked, absent at the pin); modified-since-mount (the
edited paths); or could-not-determine, which is never clean. A tracked
mount's distance behind its branch is a measurement, not a finding. Every
finding's action is a person's: move the edits upstream to the fork, or
delete or rename the directory and re-mount. The check acts on nothing.

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

## Publishing a remote-mounted downstream — provision `gh-pages` first

A mount brings layers into a checkout; it provisions **nothing** on the
downstream's remote. A downstream that publishes a site needs a `gh-pages`
branch before GitHub Pages can be switched on, exactly as a new repository
does. Owner, 2026-10-01: *"need to create gh-pages branch before can turn
on"*; repeated 2026-10-07: *"need to create gh-pages before can deploy"*
(issue #2417).

The step is `Task_ProvisionGhPages` ("Provision gh-pages") in the
getting-started process ([`getting-started`](../../conduct/conduct-core/getting-started.md)
§5), with the semantics of `A_Provision` in bootstrap-tools'
[`render-kg-to-github-pages.bpmn`](../../../../bootstrap-tools/processes/render-kg-to-github-pages.bpmn).
Run `bun run cat-harness/scripts/pages-bootstrap.ts --provision` (idempotent,
never forced; without the flag it only reports `unprovisioned` and the exact
command), then set Pages to **"Deploy from a branch: gh-pages, / (root)"**.
The worked example is litlfred/test — an overlay with remote mounts, its
`gh-pages` provisioned as `860f9c2` in litlfred/test#5 — written up in
[`repo-conversion`](../../conduct/conduct-core/repo-conversion.md) §5.

## Never

- **Never add a submodule** to get a dependency, and never clone into `.deps/`.
- **Never pin a branch or an abbreviated SHA.** The schema refuses both.
- **Never edit a mounted directory and expect a re-mount to keep the edit, or
  to throw it away.** A re-mount leaves edited bytes untouched and reports them
  as missing. Move the edit upstream, or delete the directory and re-mount.
- **Never mount over tracked files**, or over a directory that no lock says
  this mount made, unless it is byte-identical to the pin (adopted, nothing
  written but the lock). Anything else is refused, with the paths listed.
- **Never pass `mount:update`'s consent flags on an agent's own
  initiative.** They record a person's answer.
- **Never read `missing` or `could-not-determine` as "that layer has nothing
  in it".** A layer that is not mounted is absent from every overlay.

## Not yet

These are tracked on bean `0mpw`:

- `init-folio --link remote`;
- pinning `skill_fetch`'s `REFERENCE_PACKAGES`;
- the pilot (smart-ra drops its submodule);
- the first real consumer, the cutover tracked by bean `g8jp`.
