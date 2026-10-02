---
# folio-assistant-3jhq
title: 'TWO PATHS FOR ONE BOOTSTRAP GRAPH: docs-site publishes bootstrap.jsonld at the site root, feature-staging at bootstrap/bootstrap.jsonld'
status: completed
type: task
priority: normal
created_at: 2026-09-21T14:16:21Z
updated_at: 2026-09-21T18:27:11Z
parent: folio-assistant-vke6
---

Noticed while measuring issue #720, and deliberately kept out of that fix.

## What was measured, 2026-09-21

| workflow | command | published at |
|---|---|---|
| `docs-site.yml` | `kg-export.ts --instance ./bootstrap` | `<base>/bootstrap.jsonld` |
| `feature-staging.yml` | `gen-bootstrap-graph.ts --base-url "$BASE"` | `<base>/bootstrap/bootstrap.jsonld` |

Two DIFFERENT scripts, two DIFFERENT paths, for a document that names itself
by `@id`. The `docs-site` path is the one cat-harness's own graph links to —
verified by building the export and reading the link targets out of it:

    https://litlfred.github.io/folio-assistant/bootstrap.jsonld#skill/discussion
    https://litlfred.github.io/folio-assistant/bootstrap.jsonld#skill/log-message

So on a STAGED preview those two links point at a document the staging build
does not write at that path — the `blv9` shape ("the `@id` resolved to
nothing"), one workflow over from where it was fixed.

## Why this is not obviously a bug yet, and what to measure first

NOT ASSUMED TO BE ONE. Three things have to be checked before deciding:

- [x] does `feature-staging.yml` publish the `--instance` export at all, or
      only `gen-bootstrap-graph.ts`? They may be different documents with
      different jobs, in which case the paths are correct and the finding is
      that nothing says so
- [x] what does a staged cat-harness graph mint as its link target — the
      staged base plus `bootstrap.jsonld`, or something else?
- [x] is `gen-bootstrap-graph.ts` the same graph as
      `kg-export --instance ./bootstrap`, or a different projection of it?

Answer those before proposing a path change. Two scripts and two paths may be
two answers to one question — or it may be one answer each to two questions,
and collapsing them would lose a document.

## Done when

- [x] the three questions above are answered by measurement, not by reading
- [x] either the paths agree, or a comment in BOTH workflows says why they do
      not and which document is which
- [x] whichever it is, a check covers it — `check:published-instance-exports`
      (added for #720) reads the deploy workflow only, so the staging workflow
      is still a place a break hides

## The three answers, 2026-09-21 — and the bean's own premise was half wrong

**Q1 — staging publishes only one of the two.** `feature-staging.yml:585` ran
`gen-bootstrap-graph.ts` → `bootstrap/bootstrap.jsonld` and
nothing else. `docs-site.yml` runs **both**: that one (line 411) AND
`kg-export --instance` → `bootstrap.jsonld` at the site root (line 330).

**Q2 — the staged graph links to the path staging did not write.** Built with
`--base-url https://…/STAGING/demo-branch` and the targets read out of the
document rather than inferred:

    …/STAGING/demo-branch/bootstrap.jsonld#skill/discussion
    …/STAGING/demo-branch/bootstrap.jsonld#skill/log-message

So **every staged preview carried two dangling links** — `blv9` exactly, and
one of the skill bodies caught in the same grep names `blv9` as the failure it
exists to stop.

**Q3 — effectively the SAME graph, which this bean assumed it might not be.**
Both 85 nodes; 84 of 85 node IRIs differ *only by stem*, because the `@id`s
differ. They diverge in top-level fields only: `gen-` carries
`omitted`/`problems` and no timestamp (pure, cacheable); `kg-export` carries
`generatedAt` and `sourceCommit*`.

## What was done, on the owner's ruling

"Fix staging only; bean the duplication."

- `feature-staging.yml` now publishes the site-root export with `--base-url`,
  beside the cold-start document it already wrote. Both workflows carry a
  comment saying which document is which and why there are two.
- `check:published-instance-exports` reads **every** workflow rather than
  `docs-site.yml` alone — derived, so the third file is covered without an
  edit. Naming the second file would have fixed today and left the next one to
  be found the same way.

## The falsification failed first, and that was the useful part

Pointing an invocation at `./no-such-instance` **exited 0 and the gate printed
a tick.** With a `--base-url` supplied, a missing declaration costs nothing —
the stub falls back, the `@id` is absolute, no source is reported unread — so
the export published an EMPTY graph under a trusted name. `dh4f`, inside the
gate written to stop that class.

Two guards added, each re-falsified:

| planted | before | after |
|---|---|---|
| `--instance ./no-such-instance` | exit 0, ✓ | exit 1, "instance path does not exist" |
| `--instance ./.github` | exit 0, ✓ **28 nodes** | exit 1, "declares no instance" |

The second is why "0 nodes" was not enough on its own: `./.github` is not
empty, because the generic collectors read the repository whatever the
argument names. The question that discriminates is the one this repository
asks everywhere else — **declaration over location**.

## Deliberately still NOT closed, and it is not the duplication

**This gate checks that a published export SUCCEEDS, not that a workflow
publishes everything its own graph links to.** Deleting the staging invocation
again would leave it green: one fewer invocation is not a failing one. The
defect this bean found would therefore not be caught by the fix this bean
shipped.

The real invariant — *a workflow publishing this instance's graph must also
publish every foreign document that graph links into* — is a cross-check
between a workflow's link targets and the paths it writes. Bigger than this
bean, and recorded rather than attempted: bean `qgpo`.

The one-graph-two-`@id`s question is bean `dyd3`, with the three options tabled
and the measurements already in it.

## Served, confirmed by the owner — the one link this session could not check

The verification chain had a gap this environment cannot close: the agent
proxy denies `litlfred.github.io:443`, so a staged URL cannot be fetched from
here.

    curl: (56) CONNECT tunnel failed, response 403
      host: litlfred.github.io:443  (policy denial)

A green `stage` job proves the file was WRITTEN INTO `_site/`. It does not
prove it is SERVED. Those were the same claim for `gen-bootstrap-graph.ts`
for months, and `blv9` is what the difference cost — so it was reported as a
third state rather than rounded up into the green.

The owner opened it, 2026-09-21:

    https://litlfred.github.io/folio-assistant/STAGING/claude-sharp-ptolemy-6qxh77-3jhq/bootstrap.jsonld
    → served, valid JSON-LD

So the document staging did not publish before this change is now on the
staged site, at the path cat-harness's own links name. That is the bean's
claim, closed on observation rather than on an exit code.

**One detail visible in the capture and worth recording**: the `@context`
carries the CANONICAL namespace IRIs (`…/cat-harness/ns#`, not a staged
variant), which is correct and deliberate — `feature-staging.yml` says so
directly, that "a vocabulary's IRIs are the vocabulary, and they are the same
document at any base". A staged namespace would be a different vocabulary,
which is not what a preview is for.

**And one the capture does not settle**: the document's own `@id`. The
screenshot shows the `@context` block, above where `@id` appears. The export
is invoked with `--base-url "$BASE"`, and `exportIdentity` with a `baseUrl`
was measured here to mint `<baseUrl>/<stub>.jsonld`, so it should end in the
staged path — but that is inference from the code, not a reading of the served
bytes, and the two are exactly what this bean exists to keep apart. An `@id`
naming the LIVE document while served from a staged path would be worse than
the 404 it replaced, which is the hazard `feature-staging.yml`'s own comment
names.
