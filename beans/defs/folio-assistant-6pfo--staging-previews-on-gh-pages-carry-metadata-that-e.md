---
# folio-assistant-6pfo
title: 'Staging previews on gh-pages carry metadata that exists only at runtime — publish it as a KG graph'
status: todo
type: task
priority: normal
created_at: 2026-09-19T12:28:52Z
updated_at: 2026-09-19T12:28:52Z
---

Owner, 2026-09-19: *"metadata on ghpages staging should be avalabale in KG"*.

Queued, not started — raised mid-turn while the preview cleanup was running,
and the standing instruction is to queue rather than pivot.

## The ask, as I read it

Every staging preview under `STAGING/<slug>` on `gh-pages` has facts attached
to it: which branch it was built from, which commit, which pull request and
issue it belongs to, when it was built, which host rendered it, how large it
is, how many files, and whether anything still points at it. **Today every one
of those facts is computed at runtime and then thrown away.**

`probeStaging` and `probeBranches` in `test/health/probes.ts` walk `gh-pages`
and the remote on each sweep; `previewLiveness` and the `staging-preview-*`
checks consume the result; the numbers reach a person through
`test/health/results/repository.health-report.json` and then only as findings.
The per-preview record itself is never written down as a node anything can
query. A consumer that wants to ask *"what previews exist, and what is each
one for"* — the site, a tool, an agent, a reviewer — has no graph to ask.

The banner `feature-staging.yml` injects into every staged page already
carries most of this (branch, commit, PR, issue, build log, timestamp), so the
facts are assembled and rendered into HTML at build time and discarded as
data. That is the shape worth naming: **the information exists, is already
computed, and is only ever presented.**

## Why it is a KG question and not just a report

`harness.json` declares the graphs this instance holds, and a staging preview
is an artefact this instance produced, about which we know structured things.
The repo already has the machinery: `1dfh` publishes the harness knowledge
graph as JSON to Pages with a viewer over it, and `health` became a declared
graph kind two hours ago (`3vge`) on exactly the argument that a report about
the instance is not the same subject as a verdict about its content.

Whether staging metadata is its own graph kind, or nodes within an existing
one, is the first real design question and is NOT settled here.

## Related, and none of them is this

- **`1lfx`** — *STAGING must report which host rendered it, not assume gh-pages.*
  The closest: it is about a staging deployment describing itself. It covers
  one field (the host); this covers the record. A sibling session is working it
  on `claude/brave-hypatia-r820sf` — **do not claim `1lfx`.**
- **`1dfh`** — *Publish the harness knowledge graph as JSON to Pages, and a
  viewer over it.* The publishing mechanism this would likely ride on.
- **`lx2s`** — *Feature-branch staging under gh-pages (issue #215).* The parent
  of the staging machinery itself.

## Open questions, for whoever picks this up

1. **Where does the record get written?** At deploy time by
  `feature-staging.yml` (the only place that knows the PR and issue), or
  derived at sweep time by the health probes (the only place that knows the
  size and the liveness)? Neither knows everything, which is the interesting
  part.
2. **Is it a new graph kind or nodes in an existing one?** Adding a kind means
  `BASE_GRAPH_KINDS`, both enumerating assertions in `schemas/cat-harness.test.ts`,
  and the documented-kinds table — the three places `3vge` had to touch.
3. **What happens to a preview's record when the preview is removed?** The
  cleanup dispatch would have to remove or tombstone it, or the graph starts
  describing artefacts that are gone — the same class of defect as a link that
  resolves to nothing.
4. **Does the record live on `gh-pages` beside the preview, or in the repo?**
  On the publish branch it is co-located and dies with the preview; in the repo
  it is versioned and reviewable but needs a writer.

## Done when

A consumer can ask what staging previews exist and what each one is for,
without walking `gh-pages` itself, and the record cannot outlive the preview it
describes.
