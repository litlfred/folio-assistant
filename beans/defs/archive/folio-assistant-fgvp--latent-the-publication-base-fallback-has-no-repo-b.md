---
# folio-assistant-fgvp
title: 'LATENT: the publication-base fallback has no repo-boundary check, so --instance on an outside checkout mints this site''s IRIs'
status: scrapped
type: task
priority: normal
created_at: 2026-09-21T16:23:29Z
updated_at: 2026-09-21T17:29:17Z
parent: folio-assistant-vke6
---

Observed while merging #718 into the `u1iu` branch, 2026-09-21. **Not a defect
today** — filed so it is not rediscovered as one.

## What was measured

`exportIdentity` (main, after #718):

    const ownCanonical = decl?.canonicalUrl ?? "";
    const publisherCanonical = ownCanonical ? "" : (readDeclaration(ROOT)?.canonicalUrl ?? "");

The fallback applies to ANY `instanceRoot`, with no check that it resolves
inside this repository.

## Why it is latent rather than live

The only in-tree caller is `skillHome`, which iterates
`instanceRootsIn(repoRootFor(ROOT))` — always inside. So no code path reaches
the case.

The CLI does: `kg-export.ts --instance ../some-other-checkout` would mint
`<this site>/<their-stub>.jsonld` for a document published somewhere this
repository cannot know about.

## Why that would matter

It is the hazard `makeIri` already refuses by name — an IRI that looks
dereferenceable and 404s is worse than an absent one, because a consumer reads
the first as a fact about the graph and the second as a fact about the export.
Before #718 that case produced a relative `@id` plus a reported problem, which
is the honest answer.

So this is a NARROWING of honesty that came free with a correct fix, on a path
nothing walks.

## Done when

- [ ] decide whether the CLI's `--instance` is a supported way to export a
      foreign checkout at all. If it is not, the fix may be to REFUSE an
      outside path rather than to fall back differently
- [ ] if it is supported: a path-boundary check (`relative()`, not
      `startsWith` — `/repo-other` is not a child of `/repo`), keeping the
      relative-IRI-plus-problem third state outside the repo
- [ ] a test that fails if an outside instance silently inherits this site

## Do not

Do not "fix" this by making bootstrap declare a canonicalUrl. It has no
site; `40fl` settled that and its reasoning is right.

## Reasons for Scrapping

**Superseded by `vz24` / PR #746**, which was already open and complete when
this was picked up — same defect, same fix, same reasoning, by the session
that wrote `40fl`/#718 and `tyyc`/#721.

Scrapped rather than worked, and scrapped rather than deleted: a deleted bean
leaves the next agent unable to tell abandonment from accident, and this id is
referenced from PR #725's body, its merge commit, and bean `u1iu`.

## The check that caught it, and that this is the third instance

Found **before a line was written**, by the rule `u1iu` added four hours
earlier: a finding about the forge is checked against the forge — open PRs and
`origin/main` — not against a local `git log`. `beans list` would not have
caught it either; `vz24` was `in-progress` on the sibling's branch only.

Three duplications between sessions in one afternoon (`lps0`, `u1iu`/`40fl`,
this one). The first two cost a branch each. This one cost a `list_pull_requests`
call, which is the whole argument for the rule.

## The defect is real, and was verified rather than assumed

On `main` at `4acdd373cc`, before #746:

    $ kg-export.ts --instance /tmp/outside-XXXX
      @id  https://litlfred.github.io/folio-assistant/outside.jsonld
      EXIT=0

## What this bean contributed that `vz24` did not have

A review of #746, posted on the PR, with one finding measured on its own
branch: `publishedHere` tests LOCATION, not PUBLICATION. `docs-site.yml`
writes two graph documents; enumerated over `instanceRootsIn(repoRoot)`,

    13 instances; 11 get an ABSOLUTE @id the deploy never writes

e.g. `--instance ./who-iris` → `https://litlfred.github.io/folio-assistant/who-iris.jsonld`,
exit 0. Same class as the `/tmp` case, narrowed but not closed, and the
variable name asserts the stronger claim the code does not check.

Left with #746's author as a comment-and-rename rather than raised as a
blocker, and deliberately NOT opened as a fresh bean here — it belongs to
`vz24`'s decision, and a bean minted against somebody else's open PR is how
this afternoon's duplications started.

## A slip of my own, recorded rather than amended away

The first commit on this branch swept in **two stray QA sidecars** —
`kg-export.outside.qa-results.json` and `kg-export.who-iris.qa-results.json`.
Both are debris from the repro runs above: `git add -A` after
`--instance /tmp/outside` and `--instance ./who-iris`. The PR body said "one
bean file" while the diff carried three, and CI was green on all of it,
because nothing in the gate set asks whether a results file has a subject
anybody exports.

Removed in a follow-up commit rather than amended out, so the mistake stays
legible.

**It is also a finding about `u1iu`'s own sidecar fix.** Before that change an
ad-hoc foreign export CLOBBERED the host's committed result — strictly worse.
After it, an ad-hoc export leaves a NEW committed-looking file named after
whatever was passed to `--instance`. The results tree can now accumulate a
sidecar per experiment, and the accumulation is silent.

Not opened as a bean here, deliberately: the fix belongs with whoever settles
`vz24`'s location-vs-publication question, since "which instances may own a
results sidecar" is the same question one directory over. Recorded here so it
is findable from the id that observed it.
