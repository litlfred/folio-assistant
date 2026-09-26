---
# folio-assistant-6pfo
title: Staging previews on gh-pages carry metadata that exists only at runtime — publish it as a KG graph
status: in-progress
type: task
priority: normal
created_at: 2026-09-19T12:28:52Z
updated_at: 2026-09-19T15:49:43Z
parent: folio-assistant-zzmr
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

_2026-09-19T12:33Z_ — Owner clarified the shape, and it is concrete:

> *"like `<base-url>/fsh-guts/staging.jsonld` (there sibling working this)"*
> … *"or you are queued."*

So this is not "some graph somewhere" — it is a **published JSON-LD artefact at
a stub-scoped path on the site**, served next to the folio's other renderings.
Queued either way: a sibling may be on it, and this bean is the record rather
than a claim.

**The machinery for it already exists**, which makes the mechanical half cheap.
Grounded against `main` at `7eb482668`:

- `artefactStub()` (`schemas/cat-harness.ts:669`) is how an instance's artefact
  stem is derived — the `fsh-guts` position in the owner's example is the
  **stub**, not a literal, and writing it as a literal is the genericity defect
  `placement.md` Step 1 exists to catch.
- `renderingPath()` (same file, :769) answers WHERE a rendering lives, and is
  already the single answer for that question.
- `RENDERING_MEDIA_TYPES` (:796) already carries `[".jsonld",
  "application/ld+json"]`, and `serving-a-rendering.json` already requires
  `<stub>.json` and `<stub>.jsonld` to be the same bytes. Both landed in #384
  (`0hi8`).

So the path, the media type and the serving contract are settled. **What is not
settled is the content** — and that is questions 1–4 above, unchanged: who
writes the record (deploy time knows the PR and issue; sweep time knows the size
and liveness; neither knows both), and what removes a preview's entry when the
preview goes.

One consequence of the URL shape worth stating, because it answers question 4
and sharpens question 3: if `staging.jsonld` is served from the **publish
branch** beside the previews it describes, then it is regenerated by whatever
writes to `gh-pages` — which is now three things (the deploy, the label
cleanup, and the dispatch cleanup added in #407). Each would have to rewrite
it, or it describes previews that are gone. That is the same class as a link
resolving to nothing, and it is why "the record cannot outlive the preview" is
in `## Done when` rather than being an implementation detail.

_2026-09-19T12:35Z_ — Owner, on where the write/remove logic belongs:

> *"thats part of the behaviour of that node type"*

**That answers open question 3, and it reframes 1 and 4 as well.** I had written
them as workflow-plumbing questions — which YAML job rewrites the document, and
whether it lives on the publish branch. That framing was wrong, and it is the
same mistake this repository keeps paying for: putting a fact about a node into
the thing that happens to touch it.

The node type owns its own lifecycle. A `staging-preview` node knows how it
comes into existence, what it carries, and what makes it cease to exist — the
same way a bean knows `scrapped` is its retirement and not a deletion, a
`workflow-state` instance declares itself with `$schema` rather than being
duck-typed, and a memory node carries `archived` rather than the generator
deciding externally which entries to drop.

So the questions are not "which of the three `gh-pages` writers rewrites the
document" but **what the node type's behaviour is**, with the writers merely
invoking it:

- **Creation** is part of the deploy's meaning, not a step bolted onto it.
- **Removal** is the node's own retirement, so the cleanup dispatch added in
  #407 calls it rather than reimplementing it — and the three-writer problem I
  raised dissolves, because none of them owns the rule.
- **Liveness** is a property the node can answer about itself. `previewLiveness`
  already exists as a single function called from both the sweep and the removal
  preflight, precisely so the two cannot disagree; that is this shape already,
  arrived at from the other direction.

Worth stating because it is the cheap-today part: `previewLiveness` being
shared is evidence the node type is already latent in the code. What is missing
is the declaration that says so, and the published document that lets anything
else read it.

I am leaving questions 1 and 4 rewritten rather than deleted, so the next reader
can see the framing that was corrected and does not re-derive it.

_2026-09-19T15:05Z_ — **CORRECTION to my own note above, and it is the kind
that sends the next agent the wrong way.**

I wrote that in `<base-url>/fsh-guts/staging.jsonld` the `fsh-guts` position is
**the stub**, not a literal, and that writing it literally would be the
genericity defect `placement.md` Step 1 exists to catch. That is wrong.

**`fsh-guts` is a declared graph in this repository**, not a stub. Bean `t0i3`,
*"FSH-GUTS: a declared non-renderable graph for deprecated and throwaway
content"*, `in-progress`, and — tellingly — parented to `zzmr`, the same epic
as this bean. It comes from the owner's own instruction: *"do not pollute the
KG with SDLC churn…. if you need to keep it, make a…"*. Three commits landed
against it while this bean sat queued: the fsh-guts viewer as a dead-fish
control under Settings (`7vhe`), the sticky discard that feeds it (`d1r6`),
and carrying node bodies in the export so the viewer has content.

**So the URL was telling me where the data belongs, and I read it as telling
me how to spell a path.** A staging preview is SDLC churn by definition — it
exists for one review and is meant to die — so staging metadata is exactly
what `fsh-guts` was declared for. Not a first-class KG node that happens to
need a home; a throwaway one that has a declared home already.

That also changes the open questions above. "Is it a new graph kind or nodes
in an existing one" is answered: **an existing one**, and not the one I was
circling. And `uv09` — *"PUBLISH: strip every fsh-guts reference from the KG"*
— means the publish path already has to know the difference, so the removal
half of the lifecycle may already be somebody's problem.

I am leaving the wrong note above rather than deleting it, so the correction
is visible and the next reader does not re-derive the same mistake. What
misled me: I checked `artefactStub()` and `renderingPath()` and found they fit,
and stopped — a path convention that FITS is not evidence that the thing in
the path is a stub. I never grepped for `fsh-guts` itself.

_2026-09-19T15:50:04Z_ — CLAIMED and investigated. Grounded against main at 14cbeef5e (post-merge working tree). Nothing is built yet; this note records what the code already does, because two of my earlier notes guessed and one of them was wrong.

THE APPARENT CONTRADICTION IS NOT ONE, and I checked rather than reasoned. uv09 is `completed` — "strip every fsh-guts reference from the KG before publication" — which looked like it forbade the owner's own `<base-url>/fsh-guts/...` example URL. schemas/cat-harness.ts:911 settles it in the source:

  "This is not a contradiction of `<base>/fsh-guts.jsonld`. They are different
   documents: that one IS the trashcan's graph and is asked for by name; every
   other published artefact must contain no path to it. A consumer may go there
   deliberately and must never arrive by following an edge."

So fsh-guts IS published, as its own document, reachable by name only. UNPUBLISHED_GRAPH_KINDS (:919) is the single list every emitter reads. docs-site.yml:213 runs scripts/fsh-guts-export.ts --out ./_site/fsh-guts.jsonld and copies it to .json, satisfying the same-bytes rule in serving-a-rendering.json.

THE MECHANICAL HALF MAY BE FREE, and this is the finding that changes the cost:

- FshGutsNodeSchema.kind (schemas/fsh-guts.ts:44) is `z.string().min(1)` — OPEN, deliberately, with the comment "a closed enum would mean a schema change stands between an agent and not deleting something."
- fsh-guts-export.ts includes a file if and only if it DECLARES `folio-fsh-guts/v1` — by declaration, not by extension or location.

Therefore a staging-preview record written under fsh-guts/ as a file declaring folio-fsh-guts/v1 with kind: "staging-preview" is published ALREADY, with ZERO change to the exporter, the schema, or the strip list. The publishing half of this bean may require no new machinery at all.

WHAT schemas/staging.ts IS NOT. It exists (208 lines) but its subject is StagingComparison — before/after URL PAIRS for review. That is not the preview's own record and does not grow into it. Reusable from it: branchToSlug() and stagingBaseUrl(), which already mirror the sed transform in feature-staging.yml.

SIBLING CHECK, per bean-coordination. No open PR is on this: #433 on claude/brave-hypatia-r820sf — the branch this bean names as working 1lfx — is "qa-results: stop every QA producer dirtying the tree on a clean run", a different subject. 1lfx is back to `todo`. t0i3 (the fsh-guts graph itself) is in-progress and NOT mine; this bean must not touch its declaration. Also in flight and worth watching for conflict: #434 "wggr: the rest of the stub inversion, one directory at a time" moves published paths around, which is the same surface a new published artefact lands on.

WHAT IS STILL A DECISION, and it is the owner's, not mine. Two forks, and they are independent:

1. DOCUMENT SHAPE. staging-preview nodes inside the existing fsh-guts.jsonld (free, per the finding above, but one document mixes every churn kind), OR a separate <base>/staging.jsonld (closer to the owner's literal example, needs a second exporter and a second entry in docs-site.yml).
2. WHO WRITES THE RECORD — bean question 1, still open and still the interesting part. Deploy time knows the PR and the issue; sweep time knows the size and the liveness; NEITHER knows both. The owner's "that's part of the behaviour of that node type" says the node owns the rule, but not which moment populates which fields.

Not guessing either. Put to the owner before any code is written.

_2026-09-20T04:53:02Z_ — UNBLOCKED. Owner picked option 1: make the change in `schemas/fsh-guts.ts` and flag the sibling. Done; the note is on `t0i3`, whose status I left `in-progress` and did not touch.

The publishing half of this bean is now closed. A `staging-preview` record written as JSON under `fsh-guts/` reaches `<base>/fsh-guts.jsonld` with its `staging` block intact, under `data`. Three changes were needed, not one — the fields were being lost at the schema (`z.object` strips), at the reader (markdown front matter is flat, so a nested block becomes `[]`), and at the exporter (an explicit allowlist, so passthrough alone published nothing). Fixing any one alone would have changed nothing observable, which is why the first two limits looked like the whole problem when `6pfo` shipped.

THE PINNED TESTS DID THEIR JOB. Both limits were pinned as failing-by-design constraints in `scripts/tests/staging-preview.test.ts`, on the stated grounds that a silent fix leaves a detour nobody can date. They failed the moment the fix landed. Rewritten rather than deleted: one now records FIXED, the other STILL TRUE — front matter is still flat, which is why the carrier stays JSON and why `readStagingPreview` remains a TYPED reader rather than a workaround.

STILL OPEN, and it is the whole remaining half of this bean: **no workflow is wired.** Nothing writes a record at deploy time, nothing enriches it at sweep time, nothing retires it on cleanup. The owner's answer on shape was "deploy writes it, sweep enriches it" and "one document", and the node type implements exactly that — but the constraint recorded on 2026-09-19 has not changed and is the next thing to solve:

- `feature-staging.yml` has `contents: write` and pushes only to `gh-pages`; it never writes to `main`.
- `health-check.yml` is `contents: read` DELIBERATELY — AGENTS.md: "It reports and never acts." Granting it write to commit records would break a stated principle, so the sweep is not the writer without a decision.
- Fourteen other workflows do have `contents: write`, so a scheduled writer is possible; which one, and whether per-preview commits to `main` are acceptable churn, is unanswered.

Do not guess at that. It is a question for the owner, in the same shape as the two already answered.

_2026-09-20T05:38:14Z_ — **CORRECTION to my own note above, re-measured on main at `ece998d22` after the cat-harness restructure.**

I wrote: *"Fourteen other workflows do have `contents: write`, so a scheduled writer is possible."* That is true as a count and misleading as a conclusion, which is the worse kind of wrong.

MEASURED, not quoted:

- 16 workflows can write. **14 of them are `workflow_dispatch`-only** — a workflow nobody can trigger automatically is not a writer.
- Exactly **2** both auto-fire and can write: `docs-site.yml` (push to `main`, path-filtered) and `feature-staging.yml`.
- **3** workflows carry a `schedule:` — `ci-health.yml`, `health-check.yml`, `upstream-pins.yml` — and **all three are `contents: read`**.

So **there is no scheduled writer at all**, and my "a scheduled writer is possible" pointed the next agent at an option that does not exist without building one.

WHAT I MISSED, and it makes the remaining question much smaller. `feature-staging.yml` already fires at BOTH ends of a preview's life:

```yaml
pull_request:        types: [opened, synchronize, reopened]   # creation
pull_request_target: types: [closed]                          # retirement
```

It has `contents: write`, and at both moments it knows the branch, the commit, the PR and the issue. So CREATION and RETIREMENT — the two halves the owner said belong to the node type — already have an owner that fires at exactly the right times. `retireStagingPreview` being idempotent matters here: `synchronize` fires repeatedly, `closed` can fire more than once.

THE OPEN QUESTION IS ENRICHMENT ONLY — size, files, liveness. Those are the sweep's knowledge, and `health-check.yml` is `contents: read` **deliberately**: AGENTS.md states "It reports and never acts", with `plj1` as the worked example of what happens when a reporting tool acts. Granting it write to enrich records would contradict a stated principle, not merely a setting.

Three shapes, put to the owner rather than guessed:

1. Drop enrichment from the record — deploy facts only, retired on close. Meets this bean's `## Done when` without touching the principle or adding churn to `main`.
2. Give `health-check.yml` write. Contradicts "It reports and never acts".
3. A new scheduled workflow whose only job is to enrich. No principle broken, but a new writer committing per-preview records to `main`, and another thing to keep green.

Leaving the wrong note above rather than editing it, so the correction is visible and the next reader does not re-derive it. What misled me: I counted `contents: write` and stopped, without asking what fires each workflow — the same shape as counting a thing and not checking it is reachable.

_2026-09-20T06:52:59Z_ — OWNER CHOSE: retire into `gh-pages` OUTSIDE the deleted directory, **and never delete a retired record without explicit confirmation from the user**. That second half makes the retired store a durable artefact, so `deletion-requires-confirmation` governs it the same way it governs a bean or a preview.

**MEASURED FIRST, and it changes what this costs.** There is NOWHERE on `gh-pages` a retired record survives today:

- `docs-site.yml` is a FULL REPLACE — `git rm -r --ignore-unmatch '*'` over the whole branch, then copies `_site` in — and it is the only one of the repository's six `gh-pages` publishers without `keep_files: true`. It fires on every push to `main`.
- The only reason `STAGING/<slug>/` survives is `restore-staging.ts`, which carries **the OPEN pull requests'** previews back into `_site` before the push (bean `plj1`).
- A retired record belongs to a CLOSED pull request by definition. So it would be carried by nothing and wiped by the next deploy.

So "retire it somewhere the cleanup does not touch" is necessary and not sufficient: the cleanup is not the only thing that deletes. `restore-staging.ts` has to carry the retired store too — and that is the RIGHT home rather than scope creep, because that script already is the single answer to "what survives a full replace".

**A SECOND HAZARD, from the slug.** `STAGING/_retired/` is reachable by `rm -rf "STAGING/$SLUG"`: a branch named `_retired` slugifies to exactly `_retired`, and git permits that ref. Verified. So the store needs an explicit guard, not just a name nothing happens to collide with today.

**AND A NEAR-MISS WORTH ITS OWN BEAN.** The slug sanitiser CAN emit `..` — input `..` gives output `..`, which as a path is `STAGING/..`, the checkout root, against an `rm -rf`. It is safe only because **git rejects every ref name containing `..`** (verified with `git check-ref-format` across eight candidates). The protection lives in git's ref rules, not in the `sed`, and that invariant is written down nowhere. A future change to the sanitiser, or a slug taken from something that is not a ref, loses it silently.

So the design is four pieces, and the last two are what "never delete" actually costs:

1. `stage` writes the live record into `_site/`, landing at `STAGING/<slug>/staging-preview.json`.
2. `cleanup`, before `rm -rf`, retires it into the retired store.
3. `restore-staging.ts` carries the retired store across a full replace — unconditionally, NOT gated on open pull requests, since a retired record's PR is closed.
4. Every removal path is guarded: the slug-collision case refused outright, and any deliberate removal of a retired record requires the explicit confirmation input, the same shape `cleanup-dispatch` already uses.
