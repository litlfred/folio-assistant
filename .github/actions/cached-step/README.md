# `cached-step` — the one cache primitive

**Every CI step is a pure function of its inputs.** Derive the inputs, hash
them into a key; on a hit restore the output (or the verdict) and skip; on a
miss run, then save. The full set still runs on `main` and nightly, which is
what catches a key that missed an input.

This action is that rule, once. A step that caches anything goes through it,
so every cache has the same key shape, the same trust policy, the same
hit/miss/why line in the job summary, and shows up in the daily hit-rate
report. The bespoke caches that predate it (the mount cache, the prepared
image, the layers ref, `bundle-cache.sh`, the derived-input cone,
verdict-reuse by tree) are ported onto it one at a time, by their owners.
The first port is the mount cache in `jsonld-gen-check.yml`. A pull request
that adds a private cache scheme instead is held and returned to its author
with a pointer here.

## Usage

```yaml
- uses: ./.github/actions/cached-step          # restore
  id: c
  with:
    step: cat-mount                            # [a-z0-9-]+, namespaces the key
    key: ${{ hashFiles('index.lock.json') }}   # DERIVED — see "The key"
    paths: ~/.cache/cat-mount
    trust: exact
    verify: bash .github/mount-from-lock.sh --root .
- if: steps.c.outputs.hit != 'true'
  run: bash .github/mount-from-lock.sh --root .
- if: success() && steps.c.outputs.hit != 'true'
  uses: ./.github/actions/cached-step          # save
  with: { phase: save, step: cat-mount, key: ..., paths: ~/.cache/cat-mount, trust: exact }
```

Outputs: `hit` (`true` only for an exact-key entry that passed every check),
`why`, `key` (namespaced `cs1-<step>-<key>`), `matched-key`.

A restore is one of three results, and the summary says which:

| result | meaning | the step |
|---|---|---|
| `hit` | an entry under THIS key, verified (`exact`) or carrying its record (`verdict`) | skipped |
| `warm` | an older entry by prefix (`exact` only): a head start, not an answer | runs over it |
| `miss` | nothing, an entry that failed `verify`, or an undetermined key | runs |

## The key

**Inputs are DERIVED, never hand-declared** (owner ruling, bean `4rbc`).
A key comes from one of (`cache:key` and `cache:publish` are
cat-harness-tools `scripts/cache-key.ts`, offered upstream with this action;
until that is pinned here, use the other two):

- `bun run cat cache:key <script>` — the `f017` fingerprint of a package
  script: its import closure audited for every environment, network, clock
  and git read (`input-sites.ts`), the `bun` and `git` versions, `bun.lock`,
  and its `task-io` declaration (`{tracked}` = the whole tree). It prints
  `undetermined: <why>` when it cannot know, and the action treats that as a
  miss that is never saved.
- a lock's digest, when the lock pins every input (`index.lock.json` for the
  mounts);
- a digest script that hashes the tree and the tool versions
  (`bundle-cache.sh digest`).

Could-not-determine is never a hit. An empty key, or one starting
`undetermined`, runs the step and saves nothing.

## The trust policy

GitHub scopes the Actions cache by ref: an entry saved on `main` is readable
by every branch; an entry saved by a PR (on `refs/pull/<n>/merge`) is
readable only by that PR's own runs. The policy is built on that:

| trust | restore | who may save | a committer may publish |
|---|---|---|---|
| `exact` | exact key, or warm by prefix; a hit only after `verify` passes | main; a PR or branch into its own scope | **yes** — `cache:publish`, accepted only through `verify` |
| `verdict` | exact key only | main; a PR into its own scope | no — see below |
| `main-only` | exact key only | main only | no |

`pull_request_target` never saves (it runs base code over a PR's inputs).
A save is only ever called after a green step (`if: success()`).

### The three classes of entry (owner, 2026-11-05)

Committers — people and agents — produce entries locally where CI can verify
them cheaply, so CI only verifies.

- **(a) Exactly verifiable** — `verify` checks the output against a
  reference derived from THIS tree, so a bad entry is only a miss and the
  entry is safe to take from anyone: the mounts and the layers ref against
  the lock's tree digests. A committer may run `bun run cat cache:publish
  <step>`, which pushes the output to `refs/cache/cs1-<step>-<key>`;
  `cached-step` with `committer-refs: true` fetches it and accepts it only if
  `verify` passes. Never on main, which is the backstop.
- **(a′) Verifiable with provenance** — a bundle checked only against the
  manifest it carries. A manifest proves the bundle is intact, not that it
  was built from these inputs: a poisoner ships a matching manifest. So it
  ALSO needs a source rule: an Actions-cache entry saved on main (no PR can
  write main's scope), or `bundle-cache.sh`'s rule (the source run's head is
  this head, a parent of this commit, or a commit with this tree). Its
  producer must also be deterministic (the determinism audit) for a hit
  across commits. Committers do not publish these.
- **(b) Verdicts** — "this gate passed on these inputs". CI cannot verify one
  without re-running it, so a committer's verdict goes through the deferred
  or sampled re-verification of the local gate records (#2957, #2958), not
  through this action. CI's own verdicts use `trust: verdict`, and a hit is
  reported **SKIPPED, not passed**, naming the run that recorded it.
- **(c) Everything else** — `trust: main-only`.

### What a committer runs before pushing

`bun run cat cache:publish <step>` for each class-(a) step their change
moves the key of. None is listed yet. The mounts have their own committer
path, the layers ref (`refs/cat/layers/<key>`, `layers:publish`), whose
replayer verifies per layer and reuses every layer that did not move. It is
live (cat-harness-tools#1506, folio-assistant#2971) and reports through this
action as step `layers`, so no workflow ports the mounts onto it separately.

## Budget

GitHub holds **10 GB of Actions cache per repository** and evicts the
least-recently-used entries beyond it; an entry nobody reads for 7 days is
evicted too.

- **Big bundles** (the prepared image, the QA working copy, the publish-time
  pages) go to GHCR or to git refs, not to the Actions cache: one of them can
  push every small entry out.
- **Small outputs and verdicts** go to the Actions cache, under a namespaced
  key `cs1-<step>-…`, so the report can attribute every byte.
- **Prune**: the daily report deletes entries scoped to a CLOSED pull
  request's merge ref — GitHub lets nothing else read them, so they are
  budget and nothing more. Nothing `main` or an open PR can read is deleted.

## Hit-rate reporting

A cache that keeps its own transport, such as the layers ref (whose replayer
verifies layer by layer) or the FHIR IG AST (whose refresh runs on its own
runner), reports through `phase: report` with `result` (hit, warm or miss)
and `why`. `cache:plan`'s decisions do the same. The daily report counts
them all in one place.

Every restore writes one line to the job summary:
`cached-step <step>: hit|warm|miss (<trust>) — <why>. Key <key>.` It also
uploads a tiny artifact named `cached-step--<step>--<result>--<unique>`
(8-day retention). The daily report (`.github/scripts/cache-report.sh`, the
06:00 UTC tick of `sweeps.yml`) counts those NAMES per step, so it downloads
nothing, and adds the cache usage and the size of each namespace.

## The inventory every scheme was ported from

`.github/cache-inventory/2026-11-05.cache-inventory.json` (`cache-inventory/1.0.0`,
the schema in cat-harness-tools `schemas/sdlc/cache.ts`) is the survey of every
cache in every repository this index mounts, taken 2026-11-05. It is kept here
rather than in cat-harness-tools' `caches/` because it names every layer, and a
layer may not name the layers above it (`check:reference-direction`).
