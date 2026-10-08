---
title: "index.config.json: who controls index.html"
kind: proposal
issue: 2483
summary: >-
  One root file, index.config.json (folio-index-config/v1), declares which
  harnesses a checkout instantiates, where each comes from (local, or a remote
  mount pinned to a SHA), how each imports and overrides its
  <name>.config.json, and which one controls <base>/index.html. It replaces an
  inference from every root *.config.json, a landing flag spread across those
  files, and remoteMounts on the root declaration. Decided and being built,
  2026-10-07.
---

# `index.config.json`: who controls `index.html`

The owner, 2026-10-07: *"migration to index.config.json
importing `<harness>.config.json` information as needed"*. Later that evening: *"go
ahead and start the migration NOW to index.config.json, /coordinate as
needed"*. Issue #2483, bean `ymvt` under the separation epic `7x5n`. The
governing skill is
[`index-config`]({{ '/reference/skill-instructions/index-config.html' | relative_url }}).

## 1. The problem

A checkout that instantiates several harnesses has **one** `<base>/index.html`.
Until now, three facts about one checkout's instantiation lived in N+1 files,
and none of those files could be read as the whole answer:

| fact | where it lived | how it went wrong |
|---|---|---|
| which harnesses are instantiated | inferred: every root `*.config.json` except `harness.config.json` | five scripts re-implemented the scan; one did not exclude the legacy name |
| which one is `/` | a `site.landing: true` flag, in any of those files | a reader has to open every config to learn the answer |
| where each comes from | `remoteMounts` on `folio-assistant.json`, the root **declaration** | a declaration travels with the harness; *where its mounts come from* is a fact about one checkout |

`gen-landing-data.ts` also hard-wired its instance as the directory it sits
in (`instanceRootFor(import.meta.dir)`), so the landing stickies were
cat-harness's because of where the script lived, not because of any
decision.

The separation makes this urgent. The separated repositories (`bootstrap`,
`bootstrap-tools`, and every harness cut out of this monorepo) each need a
defined landing and mount set. Two forks carry a `<fork>.config.json` they
inherited, and under the old rule each of those forks instantiates a harness
it does not hold.

## 2. How the old resolution worked (still the fallback)

- `instantiatedHarnessNames(root)` returned the stem of each root
  `<name>.config.json`.
- `resolveLandingInstance(root)` returned:
  - the sole instance, when there was one;
  - the single flagged config;
  - a hub, when two or more configs were flagged;
  - `ambiguous`, when none was flagged (`check:landing-instance` fails on
    this).
- `rootInstanceName(root)` used the root declaration, then the landing.
- Remote mounts came from the root declaration's `remoteMounts`. The lock was
  `<root-instance>.mount-lock.json`.

**All of this still applies when there is no `index.config.json`.** A folio
that has not migrated sees no change.

## 3. The schema: `folio-index-config/v1`

`cat-harness/schemas/index-config.ts`:

```json
{
  "$schema": "folio-index-config/v1",
  "instances": [
    { "name": "folio-assistant", "source": { "local": { "at": "." } } },
    { "name": "cat-harness" },
    { "name": "my-ig", "source": { "remote": {
        "repository": "owner/my-ig", "ref": "<40-char sha>",
        "overrides": { "my-ig": { "whole": true } },
        "note": "…", "trust": { "consent": { "by": "…", "on": "…", "ref": "…", "evidence": "…" } } } } }
  ],
  "site": { "landing": "cat-harness" }
}
```

- `name`: an instance name. `index` (the reserved stem) and `hub` (the
  landing keyword) are refused. Each name appears once.
- `import?`: a root `<file>.config.json`. When absent, the entry imports
  `<name>.config.json` if that file exists. A harness need not have a config.
- `source?`: absent means local at `<name>/`. Otherwise it takes one of two
  forms:
  - `{ local: { at } }`, where `at` may be `.` for the root instance.
  - `{ remote: … }`, which is **`RemoteMountSchema.omit({ harness })`**. It is
    reused, not restated, so it keeps `ref`, `overrides.<name>.whole` and
    `.path`, `note` and `trust.consent` exactly as the separation's cutovers
    write them today. Any field a later PR adds (such as `track`, #2468) needs
    no edit here.
- Any other key in an entry is an inline `HarnessConfig` field. It overrides
  the imported one: objects merge key by key, and arrays and scalars are
  replaced.
- `site.landing?`: an instance the file lists, or `"hub"`. A name the file
  does not list is refused.

The brief named the remote fields `pin`, `path` and `whole` at the top level.
They are spelled `ref` and `overrides.<name>.{path,whole}` here, because those
are the fields of the existing schema. A second spelling would need a
converter in both directions, and it would be another place for the two to
drift apart.

## 4. Resolution order

Every reader below goes through a shared resolver in
`schemas/harness-config.ts`, `schemas/index-config.ts` or
`schemas/instance-roots.ts`:

1. **Instantiated set**:
   - If `index.config.json` exists, its `instances[].name`.
   - If it is unreadable, the reader **throws**. It never falls back to the
     scan the index replaced.
   - Otherwise, `rootConfigStems(root)`, which is the one root scan.
2. **Effective config** of an indexed instance: the imported file, overlaid by
   the inline fields (`effectiveInstanceConfig`).
   - `readHarnessConfig(dir)` returns this when the nearest index, walking
     outward from the instance root, lists the instance.
   - The walk stops at the first directory that holds either the index or the
     instance's own config.
3. **Landing**:
   - Index unreadable: **`invalid`**.
   - Index `site.landing` names a listed instance: that instance
     (`by: "index"`).
   - `"hub"`: the hub.
   - An unlisted name: **`invalid`**. This is an error, never a silent
     fallback.
   - No `site.landing`: today's sole/flag/hub/ambiguous rules, applied to the
     index's instances and their **effective** configs, so an inline `site`
     counts.
4. **Remote mounts**: `readDeclaredMounts(instanceRoot)`.
   - With an index: its `source.remote` entries.
   - Without one: the declaration's `remoteMounts`.
   - **Both carrying mounts throws, naming both files.**
   - The single writer is `writeDeclaredMounts`, which always writes the
     index.
5. **Lock**: `index.lock.json` first, then the legacy `*.mount-lock.json`.
   **Both present is an error naming both.**

`check:landing-instance` reports the landing **and** whether the index agrees
with the root `*.config.json` set:

- A root config the index does not import fails the check.
- An `import` of a missing file fails the check.
- An entry with no config is reported and does not fail.

## 5. The mount lock: `index.lock.json`

The lock stays a **separate, generated** file. It records what the declared
mounts resolved to, it is written only by `mount:remote`, and it is never
hand-edited. That is why it is not folded into the index.

The owner renamed it from `folio-assistant.mount-lock.json` to
`index.lock.json`, the companion of `index.config.json`. To keep the rename
safe:

- **Writers** write the new name. `mount:remote` renames a legacy lock onto
  the new name before rewriting it.
- **Readers** accept both names and refuse when both exist. The readers
  changed are:
  - `mount-from-lock.ts` (which uses only `node:*`, so it restates the rule
    inline; a test holds the two together);
  - `mountedInstanceRoots`, `mountLockFilename` and `mountLockPathFor` in
    `remote-mount.ts`;
  - `mountedUnder` in `git-corpus.ts`;
  - `mount:remote` and `mount:remote:check`;
  - the `publish.yml` replay guards;
  - the `paths:` filters in `docs-site`, `feature-staging` and
    `jsonld-gen-check`.
- The lock schema (`cat-harness-mount-lock/v1`) is **unchanged**. Only the
  file is renamed.

## 6. The reserved `index` stem

`index.config.json` ends in `.config.json`, so every "root `*.config.json` is
a harness" scan would read a harness called `index`. The stem is reserved
across the board:

- `isReservedIndexFile` covers `index.config.json`, `index.lock.json` and
  `index.json`.
- `rootConfigStems` and `findDeclarationFile` skip those files.
- The schema refuses an instance named `index`.

The five re-implemented scans are folded into the shared helpers:

| script | now uses |
|---|---|
| `check-avatar-instances.ts` | `instantiatedHarnessNames` |
| `check-folio-mount.ts` | `instantiatedHarnessNames` (which also fixes its missing legacy exclusion) |
| `check-instance-config.ts` | `rootConfigStems` |
| `scan-repo-content.ts` | the shared `CONFIG_SUFFIX` + `isReservedIndexFile` (it had a duplicate `CONFIG_SUFFIX`) |
| the site builder in the layer above | the same pair |

## 7. The generated `.gitignore` block

The root `.gitignore` carries a marked block:

- It starts with `# BEGIN index mounts (generated from index.config.json — do not edit)`.
- It ends with `# END index mounts`.
- Between the markers it holds one `/<path>/` line per remote instance, using
  `overrides.<name>.path` or else `<name>/`, followed by every further
  instance root the lock records. A mount's closure can land instances that
  the index never names, and those have to be ignored too.

The block is written by:
- `mount:remote` (from the planned closure before anything lands, and again
  from the lock afterwards);
- `writeDeclaredMounts`;
- `index-config:migrate --write`.

**With an index, `mount:remote` no longer appends to `.git/info/exclude`.** A
local exclude is invisible to every other clone, so a path the committed block
does not cover is reported as not ignored. Checkouts without an index keep
today's behaviour. `check:index-ignores` is the gate, and it is wired into
`code-quality-gates.yml` beside `check:landing-instance`.

## 8. Migration

**This repository, in this PR:**

1. Write `index.config.json` with `bun run cat index-config:migrate --write`.
   It contains:
   - every configured instance (`folio-assistant` at `.`, `cat-harness`, the
     local harnesses above it, and the remote `bootstrap` and the separated
     harnesses that have a root config);
   - the remote `bootstrap-tools` and the other separated harnesses, which
     have no root config — `index.config.json` itself is the list;
   - `site.landing: "cat-harness"`.
2. Move every `remoteMounts` entry losslessly into `source.remote`, and remove
   it from `folio-assistant.json`.
3. Rename the lock: `git mv folio-assistant.mount-lock.json index.lock.json`.
   `bun run cat mount:lock` replays from the new name, and a test replays from
   each name.
4. Replace the hand-written mount lines in `.gitignore` with the generated
   block, keeping the explanatory comment above it.
5. **Keep every `<harness>.config.json`.** Each one is imported. Removing them
   is a later step taken **per harness**, once its content has moved inline or
   it is clear that it never will. `cat-harness.config.json` still carries
   `site.landing: true`, which agrees with the index.

**Re-run before merge.** The separation keeps appending `remoteMounts` entries
during its cutovers (core is the next mount). The converter is idempotent:

- On a re-run it moves only the entries added since the last run.
- An entry the index already holds identically is dropped from the
  declaration.
- An entry the index holds **differently** throws, and you reconcile it by
  hand.

The plan is to merge `main` at the last moment, re-run
`index-config:migrate --write`, and hold cutovers for that window.

**The separated repositories, in follow-up PRs, one per repository:** run
`bun run cat index-config:migrate --root <clone> --write`. It reads only that
clone's files. In one step it:
- writes the index;
- writes the empty or populated ignore block;
- moves any `remoteMounts`;
- renames a legacy lock.

A root config whose stem names no instance the clone declares or mounts is
reported as an `unmatched-config` finding and is **not imported**. That covers
a `<fork>.config.json` that a repository inherited from the fork it was cut
from. The decision about the stray file is a person's.

**New folios:** `init-folio` writes an index listing its one instance at `.`.
It writes no `site.landing`, because a sole instance needs none. It also
writes the empty ignore block, so `check:index-ignores` holds from the first
commit. `kg:instantiate` adds the harness it instantiates to an existing
index.

## 9. Out of scope

- **Moving the landing stickies** (bean `1yd7`). `gen-landing-data.ts` now
  asks the resolver which instance lands, instead of using its own location.
  It falls back to its own instance for a hub, and throws when the landing is
  undecided. That makes `1yd7` a data move with no wiring left to do.
- **Route namespacing and mount-path collisions** (bean `t4xb`). The index is
  where a per-instance path would be declared (`overrides.<name>.path`), and
  the ignore block follows it. The URL scheme itself is `t4xb`'s.
- **A gate that no tracked file sits under a mount path.** That belongs to
  #2468, which also adds `track`, `mount:update` and consent. Its writes go
  through `writeDeclaredMounts`.
- **Retiring `<name>.config.json` files.** This is per harness and comes
  later, as described above.
- **`resolveHarnessConfigPath` honouring a custom `import` filename.** The path
  resolver still answers `<name>.config.json`, while `readHarnessConfig` and
  `effectiveInstanceConfig` honour `import`. No entry in this repository uses
  a custom `import`.
- **The BPMN prose in `mount-dependency.bpmn`**, which still names
  `<instance>.mount-lock.json`. That name is still read, so the text is not
  wrong. Changing it would regenerate the translations and the glossary, which
  is a separate change.
