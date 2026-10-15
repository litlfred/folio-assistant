---
name: index-config
description: >
  `index.config.json` at an instantiation root says which harnesses the
  checkout instantiates, where each one comes from (local, or a remote mount
  pinned to a SHA), each instance's config INLINE in its entry (a legacy
  `<name>.config.json` is only imported until `--inline` retires it), and
  which harness `/` is. Covers instantiated against declared, landing
  resolution and its error case, `index.lock.json` and its legacy fallback,
  the reserved `index` stem, the generated `.gitignore` block and its gate,
  and `index-config:migrate` (with `--inline`) for separated repositories.
adapters: [document, paper, dak]
profiles: [document, paper]
consulted: true
---

# `index.config.json`: what this checkout instantiates

The owner, 2026-10-07: *"migration to index.config.json
importing `<harness>.config.json` information as needed"*, and later that day *"go ahead
and start the migration NOW"*. The schema is `folio-index-config/v1` in
`cat-harness/schemas/index-config.ts`, and the proposal with the full
argument is `cat-harness/docs/proposals/index-config.md`.

**The index is the ONE config.** Owner, bean `ymvt`, restated 2026-10-14:
*"i thought ONLY index.config.json"*. Each instance's config is written inline
in its `instances[]` entry. A `<name>.config.json` is a legacy file: imported
only as a migration step, then retired with `index-config:migrate --inline
--write`. **Never create one** — not to make a tool find a recipe, not for a
new instance. If a reader only finds config in the file, that reader is the
bug; fix it to read the index entry first.

A checkout has one `<base>/index.html`. Before this file, three facts about
how a checkout is instantiated sat in N+1 places:

- which harnesses are instantiated: every root `*.config.json`, re-scanned by
  five scripts;
- which one is `/`: a `site.landing` flag that could be in any of those files;
- where each one comes from: `remoteMounts` on the root declaration.

`index.config.json` holds all three. **When it exists at the root it is
authoritative.** When it is absent, every reader falls back to the old
behaviour, unchanged.

```json
{
  "$schema": "folio-index-config/v1",
  "instances": [
    { "name": "folio-assistant", "source": { "local": { "at": "." } } },
    { "name": "cat-harness" },
    { "name": "my-ig", "source": { "remote": { "repository": "owner/my-ig", "ref": "<40-char sha>",
        "overrides": { "my-ig": { "whole": true } }, "trust": { "consent": { "...": "..." } } } } },
    { "name": "my-guide", "contentType": "document", "site": { "build": { "sourceSteps": ["site:document"] } } }
  ],
  "site": { "landing": "cat-harness" }
}
```

## Instantiated is a different fact from declared

> only the instiatiated harnesses (not all dependent ones) in teh folio

A declaration (`<name>.json`) says what an instance **declares**. It travels
with the harness into every checkout that uses the harness. An
`index.config.json` entry says the instance is instantiated **in this
checkout**. Without an index, a `<name>.config.json` at the root says the
same thing. Tiles, the landing and the hub listing are all drawn from the
instantiated set, which `instantiatedHarnessNames(root)` returns. Never
derive that set from declarations or from a directory listing.

The dependencies of an instantiated harness are not instantiated just
because a mount's closure brought them in. They keep a group of their own
rather than disappearing.

A harness that a KG subscription chose is instantiated the same way:
`kg:instantiate` adds its entry, with its config inline, when the checkout
has an index (and only without one writes a root `<name>.config.json`).
Issue #1719.

## Inline, over a legacy import while one remains

Each entry's effective config is built like this:

1. Start from a legacy imported file, while one remains. That is `import`
   when it is given, else `<name>.config.json`, and only if the file exists.
   The target state is that no such file exists.
2. Overlay every other key of the entry (everything except `name`, `import`,
   `source` and `_comment`) as an inline `HarnessConfig` field. Objects merge
   key by key, and arrays and scalars are replaced. Inline fields win.

`effectiveInstanceConfig(root, name)` computes it. `readHarnessConfig(dir)`
returns it for any instance that an index lists, walking outward from the
instance root and stopping at the first directory that holds either the index
or the instance's own config. An instance the index does not list is read
exactly as before. Readers that are handed a root and a name (the site
recipe in `build-instance-site.ts`) use `readInstanceConfig` in
`cat-harness-tools/scripts/instance-config.ts`, which reads the same way and
REPORTS every legacy file it reads.

**Retiring the files** is `index-config:migrate --inline --write`: each
imported file is folded into its entry by exactly the overlay above, so no
effective config changes, and the file is deleted.
`index-config:inline:check` fails while one remains.

## Local or remote

- `source` absent: local, at `<name>/`.
- `source.local.at`: local, at that path. Use `.` for the instance declared
  at the root.
- `source.remote`: a remote mount. It is a `remoteMounts` entry minus
  `harness`, which is the entry's `name`. It **reuses** `RemoteMountSchema`
  instead of restating it, so it has `ref` (not `pin`), `overrides.<name>.whole`
  and `.path`, `note` and `trust.consent`, and every field a later change adds
  there (such as `track`) arrives with no edit here.

There is **one read path and one write path** for remote mounts:

- **Read:** `readDeclaredMounts(instanceRoot)` returns the index's remote
  entries when an index exists, else the declaration's `remoteMounts`. If both
  carry mounts it **throws and names both files**. It never picks one.
- **Write:** `writeDeclaredMounts(instanceRoot, mounts)` always writes
  `index.config.json`, seeding the index from the checkout first if there is
  none. It refuses while the declaration still carries `remoteMounts`. Nothing
  writes `remoteMounts` on a declaration any more.

## Which harness `/` is

`resolveLandingInstance(root)` is the only reader. It applies these rules in
order:

| condition | `/` is |
|---|---|
| the index is unreadable | **`invalid`**: the gate fails. There is no fallback to the flags, because the index was written to override them |
| the index's `site.landing` names an instance it lists | that instance (`by: "index"`) |
| the index's `site.landing` is `"hub"` | the neutral hub: the harness listing and the todo panel |
| the index's `site.landing` names an instance it does not list | **`invalid`**: the gate fails, and it is never a silent fallback |
| no `site.landing` (or no index), one instance | that instance (`sole`) |
| no `site.landing`, several instances, exactly one config flags `site.landing: true` | the flagged one |
| several flagged | the hub |
| none flagged | `ambiguous`: `check:landing-instance` fails, because the answer is never guessed |
| nothing instantiated | `none`: a state of its own, not a default |

The owner's 2026-10-02 ruling still holds where no index exists: *"If exactly
one harness is instantiated, it is the landing page and no flag is needed …
If there are several and none is flagged, a gate fails. If more than one is
flagged, then neutral hub."* The index makes the choice explicit, in one
place. `gen-landing-data.ts` and `sync-docs-harness.ts` ask this resolver.
They do not use their own location.

`check:landing-instance` also checks that the index and the root
`*.config.json` files **agree**:

- A root config that the index does not import **fails the check**. Under the
  old rule that config instantiates a harness and under the index it does not,
  and nothing should pick between them silently.
- An `import` that names a missing file also fails the check.
- An entry with no config file at all is the target state, and passes.
- A legacy file an entry still imports is reported every time. It passes
  while it is a **pending migration** (every key it holds is either not inline
  or inline with the same value). It **fails** when the entry overrides one of
  its keys with a different value: the file's value is then dead text that a
  reader of the file alone takes for the config.

## A harnessed repository runs its checks on its own pull requests

Instantiating a harness in a repository includes turning its checks on there.
**Owner, 2026-10-14:** "There should be CI running", through **one** reusable
workflow the harness owns, never a copy per repository. Before this ruling,
seven layers were judged by nothing until an index re-pinned them: the
2026-10-06 "defined, not run on events" ruling for the WHO forks switched off
their harness gates along with their IG builds, and no initialization step
turned the gates back on.

The workflow is cat-harness-tools' `.github/workflows/layer-pr-checks.yml`. A
repository calls it from a workflow of about fifteen lines that runs on
`pull_request`:

```yaml
jobs:
  checks:
    uses: litlfred/cat-harness-tools/.github/workflows/layer-pr-checks.yml@main
    with:
      mode: layer              # or `index`: the repository is its own index
      instance: smart-base     # layer mode: its directory in the folio-assistant index
      path-in-repo: smart-base # where the instance sits in the repository ('.' at the root)
```

- **`layer` mode** is for a repository that an index mounts, such as
  cat-harness or smart-base. The workflow checks out folio-assistant and puts
  the PR in place of the locked mount.
- **`index` mode** is for a repository that is its own index: an IG
  repository over smart-base, smart-ra, or a folio. Its own `index.lock.json`
  is replayed.
- **The gates** are the harness's graph checks over the repository's own
  instance, plus every `check:*` / `*:check` script of that instance **and
  its whole dependency harness** (its transitive `needs`). Each is named
  `<owning-instance>:<script>`. **Owner, 2026-10-14:** "A harnessed repo should
  run not just core but all of the checks in the dependency harness."
- **A PR fails only on what it newly breaks.** Each gate and test runs on main
  and on the PR. Anything already red on main is listed, never hidden, and
  never counted against the PR.

**Disabling a repository's automatic builds is not disabling its checks.**
When an IG repository's automatic gh-pages or IG Publisher triggers are
switched off (the onboarding question in fhir-harness's `ig-build-pipeline`),
the harness caller stays on.

## The exemptions of the index's own workflows

`.github/workflows/` belongs to the index, so the steps CI runs there that the
local gate set does not are exempted HERE, under `gateExemptions.steps`, each
with a `kind` and a `reason` (`GateExemptionsSchema`, the same shape an
instance declaration carries). They land in the same change as the workflow
step, never ahead of it in a layer: an exemption a layer declared for a step
still on an unmerged branch matched nothing CI ran on the next re-pin
(`qa:publish --add`, 2026-10-14), and `gates-workflows.test.ts` refuses a stale
exemption as it refuses an unclassified step.

```jsonc
"gateExemptions": {
  "steps": [
    { "match": "bun run cat state:push -- --id health", "kind": "ci-only", "reason": "…" }
  ]
}
```

An instance still exempts its OWN scripts and steps in its own declaration.

## `index.lock.json`, and the legacy name

The lock records what the declared mounts resolved to. It is generated by
`mount:remote` and kept as a **separate file**. It was
`<root-instance>.mount-lock.json` until 2026-10-07. The rules for each reader
and writer:

- **Writers** write `index.lock.json`. `mount:remote` first renames a legacy
  lock onto the new name, so the old file is moved, never dropped.
- **Readers** take `index.lock.json` first, then fall back to the legacy
  `*.mount-lock.json`. Downstream folios and old branches keep replaying
  through that fallback. The readers are:
  - `mount-from-lock.ts`
  - `mountedInstanceRoots`
  - `mountedUnder` in `git-corpus.ts`
  - `mount:remote:check`
- **Both files present is an error that names both.** Two locks are never
  merged.

`mount-from-lock.ts` imports only `node:*`, so it restates the rule inline
and its test holds it to `lockFilesIn`.

## The reserved `index` stem

`index.config.json` ends in `.config.json`, so a scan that treats "each root
`*.config.json` is a harness" would find a harness called `index`. The
`index` stem is therefore reserved across the board:

- `rootConfigStems` skips every `index.*` file. It is the one root scan, and
  the five scripts that re-implemented it now call it or
  `instantiatedHarnessNames`.
- `findDeclarationFile` skips every `index.*` file too.
- The index schema refuses an instance named `index`, and `hub`, because that
  is the landing keyword.

Do not add a sixth copy of the scan. A new copy is how the reserved name
leaks back in.

## The generated `.gitignore` block

```
# BEGIN index mounts (generated from index.config.json — do not edit)
/my-ig/
# END index mounts
```

The block holds one `/<path>/` line per remote instance in the index, where
the path is `overrides.<name>.path`, else `<name>/`. After those it lists
every further instance root the lock records, because a mount's closure can
land instances that the index never names. Three things write the block:

- `mount:remote`
- `writeDeclaredMounts`
- `index-config:migrate --write`

`check:index-ignores` fails when the block is missing or disagrees with the
index. When an index exists, `mount:remote` **no longer appends to
`.git/info/exclude`**. A local exclude rule is invisible to every other clone,
so a path the committed block does not cover is reported as not ignored.
Checkouts without an index keep the old behaviour.

## Converting a checkout: `index-config:migrate`

```sh
bun run cat index-config:migrate                 # print the index it would write, and its findings
bun run cat index-config:migrate --write         # write it; move remoteMounts; write the block; rename the lock
bun run cat index-config:migrate --check         # exit 1 when --write would change anything (a gate here)
bun run cat index-config:migrate --inline --write  # also fold each <name>.config.json into its entry, and delete it
bun run cat index-config:inline:check            # exit 1 while any imported <name>.config.json remains
bun run cat index-config:migrate --root <clone>  # a separated repository's standalone checkout
```

The converter reads only the files under `--root`, so it runs on a
standalone clone of any separated repository.

- **Which root configs it imports:** a root `<name>.config.json` is imported
  only when `name` is an instance the checkout declares (at the root or one
  level down) or mounts. Anything else becomes an **`unmatched-config`
  finding** and is not imported. A repository cut from a fork, for example,
  can carry the fork's own `<fork>.config.json`. Importing that file would
  instantiate a harness the
  repository does not hold.
- **Re-runs:** it is idempotent. A re-run moves only the `remoteMounts`
  entries that the declaration has gained since the last run. An entry the
  index already holds identically is dropped from the declaration. An entry
  the index holds differently **throws**, and you reconcile it by hand.
