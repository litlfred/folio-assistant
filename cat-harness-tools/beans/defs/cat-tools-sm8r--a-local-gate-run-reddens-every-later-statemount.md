---
# cat-tools-sm8r
$schema: bean/1.0.0
title: 'A local gate run reddens every later state:mount: its own steps write into the mounted layers'
status: todo
type: bug
priority: normal
tags:
    - ci-speed
    - pp9g
created_at: 2026-11-06T05:00:00Z
updated_at: 2026-11-06T05:00:00Z
parent: cat-tools-pp9g
---

Found re-timing the pre-push hook (`pp9g`) on a cold, freshly mounted
folio-assistant agent checkout (4 CPUs), tools at main after #1532, 2026-11-06.
Asked for by the CI-speed coordinator: "find out why it exits 1 in this
container, and whether #1489's skip should apply".

## Measured

- Before the gate run, `state:mount` exits 0: 62 s the first time, 17 s again.
- Inside it, all 8 `state:mount` steps (one per CI job) exit **1**, at
  41.7, 35.9, 36.8, 39.3, 41.0, 38.2, 39.0 and 32.9 s: **305 s**, about 5 min
  of a 1396 s gate run.
- Each reports 8 remote instances `missing`: *"left untouched: <dir> no longer
  hash to the lock — edits there are somebody's work"*. The fetch it makes
  first changes nothing.

## Cause

A local `gates` run runs every job's steps one after another in **one**
checkout. In CI each job starts from a fresh mount, so its `state:mount`
comes first and sees an intact mount. Here, steps of earlier jobs have
already written into the mounted layers, and the lock check (rightly) refuses
to call an edited mount current:

1. **Generated output inside a mount.** `ig-index:build` writes
   `smart-trust/fhir-artifact-index/{index.json,menu.json,package.tgz,contexts,sidecars}`
   and the same under `smart-trust-phw/`. The QA working copy and docs steps
   write `cat-harness/docs/_data/{provenance,todo_listing.json}`,
   `docs/_includes/generated`, `docs/assets/{auto-docs,beans}`.
2. **Committed generated files rewritten.** The glossary writers regenerate
   `cat-harness/docs/assets/glossary/*.skos.jsonld`,
   `who-iris/glossary/generated/**/*.glossary.json` and
   `folio-assistant-core/glossary/generated/**/*.glossary.json`, and the
   content differs: definitions changed in the other layers' sources at their
   pins. **The glossaries committed in those three layers are stale against
   the pins.** That is a finding in its own right, which CI does not see
   because each job mounts fresh.

Reproduced in a fresh worktree mounted from the same lock:
`mount-from-lock.sh --check` says `current`. **One** extra file in
`smart-trust/fhir-artifact-index/` makes smart-trust `missing`, and **one**
appended byte in a committed `who-iris/glossary/generated/*.json` makes
who-iris `missing`.

## Whether #1489's skip should apply

**No.** It skips the fetch only when every instance is current per the lock,
and these are not: the mounts really differ. What is wasted is the fetch
after that verdict. Every non-current instance is one the fetch will leave
untouched, so it cannot change the outcome.

## Fixes, smallest first (not built; owner or coordinator to pick)

1. **`remote-mount.ts`: skip the fetch when it cannot help.** When every
   non-current instance is "edited, would be left untouched", report that
   without fetching. Each of the 8 steps then takes about 1–2 s and stays
   red, honestly. Saves about 290 s per cold local run. It changes nothing in
   CI.
2. **`gates.ts`: a local run sets up once.** Run each distinct setup command
   (`state:mount`, `ig-index:build`, `bun install`) once per run, not once
   per job. That saves the same 290 s plus about 60 s of repeated
   `ig-index:build`, and removes the false reds. The risk is a job whose
   setup really depends on an earlier job's writes; none is known.
3. **Root: nothing a CI step writes goes inside a mounted layer.** Either
   `ig-index:build` and the glossary writers write outside the mounts, or the
   lock digest excludes outputs the layer declares as built. Separately, the
   three stale committed glossaries need regenerating in their own layers.

## Owner ruling (2026-11-06, card "Mount fix")

"Build all four", in this order:

1. `remote-mount` skips the fetch when it cannot help (above, fix 1);
2. a local `gates` run does each setup command once (fix 2);
3. regenerate the stale committed glossaries in cat-harness, who-iris and
   folio-assistant-core against the pins, one PR per layer;
4. **no CI step writes inside a mount**: move the IG index, the QA copy, the
   docs and the glossary output out of the mounted layers. It touches many
   writers, so it is a written plan in this bean before any code.

Measure before and after for each.

Already in flight, consistent with the ruling:

- cat-harness-tools#1558: `builtAtPublish` applies to every pinned
  directory of an instance. It was ignored for one pinned as several
  (smart-trust ×7, smart-trust-phw ×4). A bug fix on its own.
- cat-harness-tools#1559: `check:published-packages` runs pytest without
  writing `__pycache__/` or `.pytest_cache/` into the mounted
  cat-harness-tools. That is fix 4 for that writer. Two tracked `.pyc` files
  are untracked.
- smart-base#310, smart-trust#142, smart-trust-phw#33: declare
  `fhir-artifact-index/sidecars/` and `contexts/` built. **Back to draft**,
  because the ruling moves the IG index out of the mounts instead; the plan
  in fix 4 decides whether they are needed at all.

## Which step writes into which mount (measured 2026-11-06)

Fresh worktree mounted from the same lock, each QA working-copy step run
alone, `mount-from-lock.sh --check` after each:

| step | time | mounts it leaves `missing` |
|---|---|---|
| `kg-export --instance ./bootstrap` | 3 s | cat-harness |
| `qa:refresh` | 606 s | + fhir-harness, folio-assistant-core, folio-assistant-sci, smart-base, who-iris |
| `glossary:page` | 18 s | (no new layer) |

Files that differ from a fresh mount after a whole local run: 1604. Of
these, 1119 are `cat-harness/test/results/` (the QA tree), 396 are
`fhir-artifact-index/sidecars/`, and 16 are `glossary/generated/` files
rewritten with different content. The rest are cat-harness docs and
attestations rewritten in place.

## Item 3 (regenerate the stale glossaries): what "against the pins" finds (2026-11-06)

For each glossary file the index's writers rewrite, the regenerated bytes
were compared with the layer's own `main`:

- **who-iris:** `main` equals the regenerated bytes exactly
  (`kg-tools`, `kg-bpmn-activities`). Nothing is stale in who-iris; the
  index pins an older who-iris (35f23d3, main 90bb3f5). A re-pin fixes it.
- **cat-harness:** `main` differs, and so does the pin. cat-harness already
  regenerates against its own pins on every merge ("Post-merge regen check
  and repair", green on main at 2f203e16). The bytes differ because the
  index composes **different pins of the layers below**:
  bootstrap a83ae82d (cat-harness's lock) vs c90ef456 (folio-assistant's),
  bootstrap-tools f22b2490 vs aa25987a. `bootstrap--kg-*.skos.jsonld` is
  computed from bootstrap, so no single commit of cat-harness can match both.
- folio-assistant-core, fhir-harness, smart-base, folio-assistant-sci:
  `main` differs too. The writer is folio-assistant-core's `glossary:page`,
  which writes `generated/<instance>/` into **every** instance's glossary
  directory. smart-base cannot even run it on its own (no workspace), so the
  committed copies are written by an index and differ by the index's pins.

**So regenerating in the layers cannot make the index's mounts clean.**
Committed bytes computed from the layers below are checkout-dependent, which
is the `because: checkout` case of `built-at-publish.ts`. The fix is item 4
(no CI step writes inside a mount), or exact pin alignment, which no layer
controls.

## Item 4: the plan (no CI step writes inside a mount), written before code

Item 3 was dropped on the owner's card ("1. Drop it, plan item 3"; that is
this item, which the card calls item 3). Pins are being aligned in its
place (owner: "align pins"; drift check cat-harness-tools#1571).

### The rule
A mounted layer is **read-only** in a checkout that mounts it: its directory
holds the pinned bytes and nothing else. Everything a step computes FOR a
layer goes to one place outside the mounts:

    build/layers/<instance>/<the same instance-relative path>

That is one **output root** per layer, mirroring the layer's own layout, so
`smart-trust/fhir-artifact-index/index.json` becomes
`build/layers/smart-trust/fhir-artifact-index/index.json`. In the layer's
OWN repository (the instance is `source.local`, not mounted), the output root
is the layer itself, as today: nothing changes for a layer building itself.

### One resolver, read and write
`cat-harness-tools/scripts/lib/layer-output.ts` (new):
- `outputPathFor(root, instance, rel)` is where a writer writes:
  `build/layers/<instance>/<rel>` when the instance is a remote mount,
  else `<instance path>/<rel>`;
- `readPathFor(root, instance, rel)` is the output root when the file is
  there, else the mount. An overlay: computed output over pinned bytes.

Every writer and reader below moves onto these two calls. Nothing else may
join an instance path to a computed file; a check finds a writer that does,
by its write sites, in the same style as `check:input-sites`.

### The writers, by measured volume (2026-11-06)

| writer | writes today | files | readers to move |
|---|---|---|---|
| `qa:refresh` (QA working copy) | `<layer>/test/results/**` | 1159 | the gates that judge QA (JUDGE mode), `uml:overview`, `readme:subgraphs`, `qa:publish` |
| `ig-index:build` (fhir-harness) | `<ig>/fhir-artifact-index/{index,menu,releases}.json`, `package.tgz`, `sidecars/`, `contexts/` | 396 + 4 per IG | `ig-pages`, the JSON view pages, `ig-site:sidecars` |
| `glossary:page` (core) | `<layer>/glossary/generated/<instance>/*.glossary.json` | 16 | glossary pages, `check:term-mapping`, archimate-from-glossary |
| kg-export, docs writers | `cat-harness/docs/{_data,_includes/generated,assets/{auto-docs,beans,glossary}}` | ~45 | the docs site build (`compose-docs`) |
| prose rewrite (writer not yet identified) | `cat-harness/docs/{concepts,guides,process}/*.md`, `test/attestations/**` | 7 | to find first: it rewrites COMMITTED source, which no step may do |

### Order (one PR each, measured before and after)
1. The resolver and its write-site check, warning only.
2. `ig-index:build` and its readers (smallest reader set; that also
   retires smart-base#310, smart-trust#142 and smart-trust-phw#33, now
   drafts).
3. `glossary:page`.
4. The docs writers.
5. `qa:refresh`, the largest and most-read; the QA stamp work of CI speed
   14 lands on the same paths, so coordinate.
6. Find the prose rewriter, and stop it writing committed source.
7. The write-site check goes from warning to red.

### Done when
In a fresh composed checkout, after a full local gate run,
`mount-from-lock.sh --check` reports every instance `current`, and no
`state:mount` exits 1 for an edited mount.

### Finding while measuring item 2 (2026-11-06)
In a freshly mounted composed checkout, `qa:working-copy` fails before any
gate runs: its writer `p2:refusals` needs
`smart-base/fhir-artifact-index/index.json`, which only `ig-index:build`
writes, and nothing orders one before the other. Earlier local runs passed
only because a previous gate had already left that file inside the mount,
which is the very write this item removes. Plan step 2 must therefore give
`qa:refresh` a declared dependency on `ig-index:build` (or have
`p2:refusals` read through `readPathFor`, and build the index on a miss).
